import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src')))

from DataLoaders.MongoDB import mongodb_client
from utils.logger import configure_logging
import pandas as pd
import matplotlib.pyplot as plt
import re
import numpy as np
import datetime
import uuid
import json

logger = configure_logging("transactions")

# Define keywords globally for reuse
TRANSACTION_KEYWORDS = [
    "transaction", "debited", "credited", "purchase", "payment", "spent", "withdrawn", "deposit", "paid", "received"
]
BANK_KEYWORDS = [
    "bank", "account", "statement", "balance", "atm", "card", "credit card", "debit card", "loan", "emi"
]
SHOPPING_KEYWORDS = [
    "order", "shipped", "delivered", "invoice", "bill", "amazon", "flipkart", "myntra", "snapdeal", "shop", "purchase"
]
ECOMMERCE_KEYWORDS = [
    "ecommerce", "cart", "checkout", "offer", "discount", "sale", "deal"
]
ALL_KEYWORDS = TRANSACTION_KEYWORDS + BANK_KEYWORDS + SHOPPING_KEYWORDS + ECOMMERCE_KEYWORDS
PATTERN = re.compile("|".join([re.escape(k) for k in ALL_KEYWORDS]), re.IGNORECASE)

def fetch_all_gmail_emails():
    logger.info("Connecting to MongoDB and fetching all emails from 'gmailmessages' collection...")
    db = mongodb_client()
    if db is None:
        logger.error("Failed to connect to MongoDB. Exiting fetch.")
        return pd.DataFrame()
    try:
        collection = db["gmailmessages"]
        logger.info("Successfully selected 'gmailmessages' collection.")
        emails = list(collection.find())
        logger.info(f"Fetched {len(emails)} emails from the collection.")
        if not emails:
            logger.warning("No emails found in the collection.")
            return pd.DataFrame()
        # Print schema (all unique keys)
        all_keys = set()
        for email in emails:
            all_keys.update(email.keys())
        logger.info(f"Schema (all unique keys in collection): {sorted(all_keys)}")
        print(f"Schema (all unique keys in collection): {sorted(all_keys)}")
        # Load into DataFrame and print
        df = pd.DataFrame(emails)
        logger.info(f"DataFrame columns: {df.columns.tolist()}")
        print(df)
        return df
    except Exception as e:
        logger.error(f"Error fetching emails: {e}")
        return pd.DataFrame()

def filter_relevant_emails(df):
    logger.info("Filtering emails for transactions, banks, shopping, or ecommerce...")
    mask = (
        df['subject'].fillna('').str.contains(PATTERN) |
        df['body'].fillna('').str.contains(PATTERN) |
        df['from'].fillna('').str.contains(PATTERN)
    )
    filtered_df = df[mask].copy()
    logger.info(f"Filtered {len(filtered_df)} relevant emails.")
    return filtered_df

def detect_transaction_type(text):
    text = text.lower()
    if any(k in text for k in ["debited", "spent", "withdrawn", "paid", "deducted"]):
        return "Debit"
    elif any(k in text for k in ["credited", "deposit", "received", "refunded"]):
        return "Credit"
    return "Unknown"

def extract_merchant(text):
    text = text.lower()
    # Patterns for common merchant indicators
    patterns = [
        r"(?:payment to|purchase from|at|for)\s+([a-zA-Z0-9\s&'-]+)",
        r"from\s+([a-zA-Z0-9\s&'-]+)\s+on",
        r"paid to\s+([a-zA-Z0-9\s&'-]+)",
        r"your order from\s+([a-zA-Z0-9\s&'-]+)",
        r"bill from\s+([a-zA-Z0-9\s&'-]+)",
        r"transaction at\s+([a-zA-Z0-9\s&'-]+)",
        r"merchant:\s*([a-zA-Z0-9\s&'-]+)",
        r"store:\s*([a-zA-Z0-9\s&'-]+)",
        r"([a-zA-Z0-9\s&'-]+)\s+has charged you"
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            merchant = match.group(1).strip()
            # Basic cleaning: remove common trailing words or excessive spaces
            merchant = re.sub(r'\s*(?:pvt|ltd|inc|co|corp|store|shop|online|india)\\.?','', merchant, flags=re.IGNORECASE).strip()
            merchant = re.sub(r'\s+', ' ', merchant).strip()
            if len(merchant) > 2: # Ensure it's not just a very short word
                return merchant.title() # Capitalize first letter of each word
    return "Unknown Merchant"

def categorize_email(row):
    text = f"{row.get('subject','')} {row.get('body','')} {row.get('from','')}".lower()
    if any(k in text for k in TRANSACTION_KEYWORDS):
        return "Transaction"
    elif any(k in text for k in BANK_KEYWORDS):
        return "Bank"
    elif any(k in text for k in SHOPPING_KEYWORDS):
        return "Shopping"
    elif any(k in text for k in ECOMMERCE_KEYWORDS):
        return "Ecommerce"
    else:
        return "Other"

def extract_amount(text):
    # Find all matches using the regex pattern
    matches = re.findall(r'(?:rs\.?|inr|₹)\s?([\d,]+\.?\d*)', text, re.IGNORECASE)
    
    if matches:
        # Extract first match and remove commas
        amount_str = matches[0].replace(',', '')
        
        # Check if string is non-empty and numeric
        if amount_str.replace('.', '', 1).isdigit():
            return float(amount_str)
    
    # Return NaN for all invalid cases
    return np.nan

def extract_merchant(text):
    text = text.lower()
    # Patterns for common merchant indicators
    patterns = [
        r"(?:payment to|purchase from|at|for)\s+([a-zA-Z0-9\s&'-]+)",
        r"from\s+([a-zA-Z0-9\s&'-]+)\s+on",
        r"paid to\s+([a-zA-Z0-9\s&'-]+)",
        r"your order from\s+([a-zA-Z0-9\s&'-]+)",
        r"bill from\s+([a-zA-Z0-9\s&'-]+)",
        r"transaction at\s+([a-zA-Z0-9\s&'-]+)",
        r"merchant:\s*([a-zA-Z0-9\s&'-]+)",
        r"store:\s*([a-zA-Z0-9\s&'-]+)",
        r"([a-zA-Z0-9\s&'-]+)\s+has charged you",
        r"(?:spent at|debited from)\s+([a-zA-Z0-9\s&'-]+)"
    ]
    stop_words = ['a', 'an', 'the', 'on', 'in', 'at', 'for', 'to', 'from', 'of', 'online', 'payment', 'transaction', 'purchase', 'order', 'store', 'shop', 'india', 'pvt', 'ltd', 'inc', 'co', 'corp']
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            merchant = match.group(1).strip()
            # Basic cleaning: remove common trailing words or excessive spaces
            merchant = re.sub(r'\s*(?:pvt|ltd|inc|co|corp|store|shop|online|india)\\.?', '', merchant, flags=re.IGNORECASE).strip()
            merchant = re.sub(r'\s+', ' ', merchant).strip()
            # Remove stop words
            merchant_words = merchant.split()
            merchant = ' '.join([word for word in merchant_words if word not in stop_words])
            if len(merchant) > 2: # Ensure it's not just a very short word
                return merchant.title() # Capitalize first letter of each word
    return "Unknown Merchant"

def log_to_csv(user, category_counts, emails_per_day):
    date_str = pd.Timestamp.now().strftime('%Y-%m-%d')
    log_dir = os.path.join('Output', 'logs', date_str)
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, 'spend_analysis_log.csv')

    # Create a DataFrame for the new log data
    log_df = pd.DataFrame({
        'user': [user],
        'date': [date_str],
        'total_emails': [category_counts.sum()],
        'transaction_emails': [category_counts.get('Transaction', 0)],
        'bank_emails': [category_counts.get('Bank', 0)],
        'shopping_emails': [category_counts.get('Shopping', 0)],
        'ecommerce_emails': [category_counts.get('Ecommerce', 0)],
        'other_emails': [category_counts.get('Other', 0)],
        'emails_per_day': [emails_per_day.to_dict()]
    })

    # Append to the CSV file
    if os.path.exists(log_file):
        log_df.to_csv(log_file, mode='a', header=False, index=False)
    else:
        log_df.to_csv(log_file, mode='w', header=True, index=False)

def generate_transactions_df(filtered_df):
    transactions_data = []
    for index, row in filtered_df.iterrows():
        # Only process rows that have a valid amount and are categorized as 'Transaction'
        if pd.notna(row['amount']) and row['category'] == 'Transaction':
            transaction = {
                "id": str(uuid.uuid4()),
                "cardId": "Unknown",  # Placeholder, as cardId is not extracted from emails
                "dateTime": row['received_at'],
                "amount": row['amount'],
                "merchantId": str(uuid.uuid4()) if row['merchant'] != "Unknown Merchant" else None, # Generate merchantId if merchant is known
                "userId": row['user_email'],
                "metadata": json.dumps({
                    "subject": row['subject'],
                    "body_snippet": row['body'][:200], # Store a snippet of the body
                    "from_email": row['from'],
                    "transaction_type": row['transaction_type'],
                    "merchant_name": row['merchant']
                })
            }
            transactions_data.append(transaction)
    return pd.DataFrame(transactions_data)
    date_str = pd.Timestamp.now().strftime('%Y-%m-%d')
    log_dir = os.path.join('Output', 'logs', date_str)
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, 'spend_analysis_log.csv')

    # Create a DataFrame for the new log data
    log_df = pd.DataFrame({
        'user': [user],
        'date': [date_str],
        'total_emails': [category_counts.sum()],
        'transaction_emails': [category_counts.get('Transaction', 0)],
        'bank_emails': [category_counts.get('Bank', 0)],
        'shopping_emails': [category_counts.get('Shopping', 0)],
        'ecommerce_emails': [category_counts.get('Ecommerce', 0)],
        'other_emails': [category_counts.get('Other', 0)],
        'emails_per_day': [emails_per_day.to_dict()]
    })

    # Append to the CSV file
    if os.path.exists(log_file):
        log_df.to_csv(log_file, mode='a', header=False, index=False)
    else:
        log_df.to_csv(log_file, mode='w', header=True, index=False)

def insert_transactions_to_mongodb(transactions_df):
    logger.info("Inserting transactions into MongoDB 'user_transactions' collection...")
    db = mongodb_client()
    if db is None:
        logger.error("Failed to connect to MongoDB. Cannot insert transactions.")
        return
    try:
        collection = db["user_transactions"]
        # Convert DataFrame to a list of dictionaries (JSON documents)
        records = transactions_df.to_dict(orient='records')
        if records:
            collection.insert_many(records)
            logger.info(f"Successfully inserted {len(records)} transactions into 'user_transactions' collection.")
        else:
            logger.info("No transactions to insert into MongoDB.")
    except Exception as e:
        logger.error(f"Error inserting transactions into MongoDB: {e}")

def analyse_and_plot(filtered_df):
    logger.info("Starting categorization, transaction type, merchant extraction, and spend analysis...")
    filtered_df['category'] = filtered_df.apply(categorize_email, axis=1)
    filtered_df['amount'] = filtered_df['body'].fillna('').apply(extract_amount)
    filtered_df['transaction_type'] = filtered_df['body'].fillna('').apply(detect_transaction_type)
    filtered_df['merchant'] = filtered_df['body'].fillna('').apply(extract_merchant)
 
    spend_df = filtered_df.dropna(subset=['amount']).copy()
    spend_df['date'] = pd.to_datetime(spend_df['received_at'], errors='coerce')

    # Generate and insert transactions into MongoDB
    transactions_to_insert_df = generate_transactions_df(filtered_df)
    insert_transactions_to_mongodb(transactions_to_insert_df)
    
    # Output directory for spends
    date_str = pd.Timestamp.now().strftime('%Y-%m-%d')
    spend_dir = os.path.join('Output', 'spends', date_str)
    os.makedirs(spend_dir, exist_ok=True)
    
    all_chart_paths = []

    # Per user analysis
    for user, user_df in filtered_df.groupby('user_email'):
        logger.info(f"Generating charts for user: {user}")
        user_spend_df = spend_df[spend_df['user_email'] == user].copy()

        # Pie chart of categories
        category_counts = user_df['category'].value_counts()
        plt.figure(figsize=(8,8))
        category_counts.plot.pie(autopct='%1.1f%%', title=f"Email Categories for {user}")
        plt.ylabel('')
        pie_path = os.path.join(spend_dir, f"{user}_categories_pie.png")
        plt.savefig(pie_path)
        plt.close()
        all_chart_paths.append(pie_path)

        # Transaction Type Distribution
        if not user_spend_df.empty:
            txn_type_counts = user_spend_df['transaction_type'].value_counts()
            plt.figure(figsize=(8,8))
            txn_type_counts.plot.pie(autopct='%1.1f%%', title=f"Transaction Types for {user}")
            plt.ylabel('')
            txn_type_path = os.path.join(spend_dir, f"{user}_transaction_types_pie.png")
            plt.savefig(txn_type_path)
            plt.close()
            all_chart_paths.append(txn_type_path)

            # Total Spend and Debit Transactions
            total_spend = user_spend_df['amount'].sum()
            debit_transactions = user_spend_df[user_spend_df['transaction_type'] == 'Debit']
            total_debit_spend = debit_transactions['amount'].sum()
            num_debit_transactions = len(debit_transactions)

            logger.info(f"User: {user}")
            logger.info(f"  Total Spend: {total_spend:.2f}")
            logger.info(f"  Total Debit Spend: {total_debit_spend:.2f}")
            logger.info(f"  Number of Debit Transactions: {num_debit_transactions}")

            # Top 5 Merchants for Debit Transactions
            if not debit_transactions.empty:
                top_merchants = debit_transactions['merchant'].value_counts().head(5)
                logger.info(f"  Top 5 Merchants (Debit):")
                for merchant, count in top_merchants.items():
                    logger.info(f"    - {merchant}: {count} transactions")
                
                plt.figure(figsize=(10,6))
                top_merchants.plot(kind='bar')
                plt.title(f"Top 5 Merchants for {user} (Debit Transactions)")
                plt.xlabel("Merchant")
                plt.ylabel("Number of Transactions")
                plt.xticks(rotation=45, ha='right')
                plt.tight_layout()
                merchants_bar_path = os.path.join(spend_dir, f"{user}_top_merchants_bar.png")
                plt.savefig(merchants_bar_path)
                plt.close()
                all_chart_paths.append(merchants_bar_path)
            else:
                logger.info(f"  No debit transactions found for {user} to analyze merchants.")

        # Log emails per day
        if not user_df.empty:
            user_df['date_only'] = pd.to_datetime(user_df['received_at']).dt.date
            emails_per_day = user_df.groupby('date_only').size()
            log_to_csv(user, category_counts, emails_per_day)

        # Spend time series (only for emails with amounts)
        if not user_spend_df.empty:
            logger.info(f"Generating spend time series for user: {user}")
            # Weekly
            weekly = user_spend_df.set_index('date').resample('W')['amount'].sum()
            plt.figure(figsize=(10,5))
            weekly.plot(title=f"Weekly Spend for {user}")
            plt.ylabel('Amount')
            plt.tight_layout()
            weekly_path = os.path.join(spend_dir, f"{user}_weekly_spend.png")
            plt.savefig(weekly_path)
            plt.close()
            all_chart_paths.append(weekly_path)

            # Monthly
            monthly = user_spend_df.set_index('date').resample('M')['amount'].sum()
            plt.figure(figsize=(10,5))
            monthly.plot(title=f"Monthly Spend for {user}")
            plt.ylabel('Amount')
            plt.tight_layout()
            monthly_path = os.path.join(spend_dir, f"{user}_monthly_spend.png")
            plt.savefig(monthly_path)
            plt.close()
            all_chart_paths.append(monthly_path)
        else:
            logger.info(f"No spend data found for {user} to generate time series plots.")
    logger.info("Spend analysis complete.")
    return all_chart_paths

def generate_user_dashboard(user_email, chart_paths):
    html_content = f"""
    <div style="border: 1px solid #ccc; padding: 20px; margin-bottom: 20px;">
        <h2>Dashboard for {user_email}</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 20px;">
    """
    for chart_path in chart_paths:
        # Adjust path for HTML display (relative to the HTML file)
        relative_chart_path = os.path.relpath(chart_path, os.path.join('Output', 'dash', pd.Timestamp.now().strftime('%Y-%m-%d')))
        html_content += f"""
            <div style="flex: 1 1 45%; min-width: 300px;">
                <img src="{relative_chart_path}" alt="Chart" style="width: 100%; height: auto;">
            </div>
        """
    html_content += f"""
        </div>
    </div>
    """
    return html_content

def spend_analyser(df):
    filtered_df = filter_relevant_emails(df)
    all_chart_paths = analyse_and_plot(filtered_df)
    return all_chart_paths

def run_analysis_for_all_users():
    logger.info("Starting analysis for all users...")
    all_emails_df = fetch_all_gmail_emails()
    if all_emails_df.empty:
        logger.warning("No emails fetched from MongoDB. Cannot perform user-specific analysis.")
        return

    unique_users = all_emails_df['user_email'].unique()
    logger.info(f"Found {len(unique_users)} unique users to analyze.")

    full_dashboard_html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Spend Analysis Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .user-dashboard { border: 1px solid #eee; margin-bottom: 30px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .chart-container { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
            .chart-item { flex: 1 1 30%; min-width: 200px; border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
            .chart-item img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
            h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <h1>Overall Spend Analysis Dashboard</h1>
    """

    for user_email in unique_users:
        logger.info(f"Processing emails for user: {user_email}")
        user_df = all_emails_df[all_emails_df['user_email'] == user_email].copy()
        if not user_df.empty:
            chart_paths = spend_analyser(user_df)
            full_dashboard_html += generate_user_dashboard(user_email, chart_paths)
        else:
            logger.warning(f"No emails found for user: {user_email}")
    
    full_dashboard_html += """
    </body>
    </html>
    """

    # Save the full dashboard HTML
    date_str = pd.Timestamp.now().strftime('%Y-%m-%d')
    dashboard_dir = os.path.join('Output', 'dash', date_str)
    os.makedirs(dashboard_dir, exist_ok=True)
    dashboard_path = os.path.join(dashboard_dir, 'spend_dashboard.html')
    with open(dashboard_path, 'w') as f:
        f.write(full_dashboard_html)
    logger.info(f"Full spend analysis dashboard saved to {dashboard_path}")
    logger.info("User-specific analysis complete.")

if __name__ == "__main__":
    logger.info("Starting txns.py")
    run_analysis_for_all_users()
    logger.info("Ending txns.py")