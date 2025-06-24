from DataLoaders.MongoDB import mongodb_client
from utils.logger import configure_logging
import pandas as pd
import matplotlib.pyplot as plt
import os
import re
import numpy as np

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

def analyse_and_plot(filtered_df):
    logger.info("Starting categorization and spend analysis...")
    # Categorize
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
    filtered_df['category'] = filtered_df.apply(categorize_email, axis=1)
    # Amount extraction
    def extract_amount(text):
        matches = re.findall(r'(?:rs\.?|inr|₹)\s?([\d,]+\.?\d*)', text, re.IGNORECASE)
        if matches:
            return float(matches[0].replace(',', ''))
        return np.nan
    filtered_df['amount'] = filtered_df['body'].fillna('').apply(extract_amount)
    spend_df = filtered_df.dropna(subset=['amount']).copy()
    spend_df['date'] = pd.to_datetime(spend_df['received_at'], errors='coerce')
    # Output directory for spends
    date_str = pd.Timestamp.now().strftime('%Y-%m-%d')
    spend_dir = os.path.join('Output', 'spends', date_str)
    os.makedirs(spend_dir, exist_ok=True)
    # Per user analysis
    for user, user_df in filtered_df.groupby('user_email'):
        logger.info(f"Generating charts for user: {user}")
        # Pie chart of categories
        category_counts = user_df['category'].value_counts()
        plt.figure(figsize=(6,6))
        category_counts.plot.pie(autopct='%1.1f%%', title=f"Email Categories for {user}")
        plt.ylabel('')
        pie_path = os.path.join(spend_dir, f"{user}_categories_pie.png")
        plt.savefig(pie_path)
        logger.info(f"Saved pie chart to {pie_path}")
        plt.close()
    # Spend time series (only for emails with amounts)
    for user, user_df in spend_df.groupby('user_email'):
        logger.info(f"Generating spend time series for user: {user}")
        # Weekly
        weekly = user_df.set_index('date').resample('W')['amount'].sum()
        plt.figure(figsize=(8,4))
        weekly.plot(title=f"Weekly Spend for {user}")
        plt.ylabel('Amount')
        plt.tight_layout()
        weekly_path = os.path.join(spend_dir, f"{user}_weekly_spend.png")
        plt.savefig(weekly_path)
        logger.info(f"Saved weekly spend chart to {weekly_path}")
        plt.close()
        # Monthly
        monthly = user_df.set_index('date').resample('M')['amount'].sum()
        plt.figure(figsize=(8,4))
        monthly.plot(title=f"Monthly Spend for {user}")
        plt.ylabel('Amount')
        plt.tight_layout()
        monthly_path = os.path.join(spend_dir, f"{user}_monthly_spend.png")
        plt.savefig(monthly_path)
        logger.info(f"Saved monthly spend chart to {monthly_path}")
        plt.close()
    logger.info("Spend analysis complete.")

def spend_analyser(df):
    filtered_df = filter_relevant_emails(df)
    analyse_and_plot(filtered_df)

if __name__ == "__main__":
    logger.info("Starting txns.py")
    df = fetch_all_gmail_emails()
    if not df.empty:
        spend_analyser(df)
    logger.info("Ending txns.py")
