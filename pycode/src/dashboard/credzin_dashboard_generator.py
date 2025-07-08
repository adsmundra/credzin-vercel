import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from ..DataLoaders.MongoDB import mongodb_client
from ..utils.logger import configure_logging

# --- Configuration ---
logger = configure_logging("dashboard_generator")
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "Output", "dash")

# --- Data Loading ---
def load_collections_as_dataframes(db, collections_to_load):
    """Loads specified collections from the database into pandas DataFrames."""
    dfs = {}
    for collection_name in collections_to_load:
        logger.info(f"Fetching data from collection: {collection_name}")
        try:
            collection = db[collection_name]
            data = list(collection.find())
            if data:
                dfs[collection_name] = pd.DataFrame(data)
                logger.info(f"Successfully created DataFrame for '{collection_name}' with {len(data)} documents.")
            else:
                logger.warning(f"Collection '{collection_name}' is empty, skipping DataFrame creation.")
        except Exception as e:
            logger.error(f"Error fetching data from collection '{collection_name}': {e}")
    return dfs

# --- Database Summary ---
def create_database_summary(db, dfs):
    """Creates a text summary of the database schema and contents."""
    summary = f"Database Name: {db.name}\n\n"
    summary += "{:<30} {:>10}\n".format("Collection Name", "Count")
    summary += "="*42 + "\n"
    for name, df in dfs.items():
        summary += "{:<30} {:>10}\n".format(name, len(df))

    return summary

# --- Visualization ---
def generate_comprehensive_dashboard(db, dfs, output_dir):
    """Generates and saves a single comprehensive dashboard image."""
    logger.info("Generating comprehensive dashboard...")
    plt.style.use('seaborn-v0_8-whitegrid') # Use a light theme
    plt.rcParams['font.family'] = 'DejaVu Sans' # Use a font that supports more Unicode characters
    os.makedirs(output_dir, exist_ok=True)

    # Adjust figure size and gridspec for better layout, especially for the summary
    fig = plt.figure(figsize=(35, 45), constrained_layout=True) # Adjusted figure height
    fig.set_facecolor('white') # Set figure background to white
    gs = fig.add_gridspec(5, 2, height_ratios=[1, 2, 2, 2, 2]) # Adjusted ratio for summary row
    fig.suptitle('Credzin Comprehensive Dashboard', fontsize=36, color='black', y=0.98)

    # --- Database Summary ---
    ax_summary = fig.add_subplot(gs[0, :])
    summary_text = create_database_summary(db, dfs)
    ax_summary.text(0.01, 0.99, summary_text, va='top', ha='left', fontsize=10, fontfamily='monospace', color='black') # Reduced font size
    ax_summary.axis('off')

    # --- User Demographics ---
    if 'users' in dfs and not dfs['users'].empty:
        users_df = dfs['users']
        ax_age = fig.add_subplot(gs[1, 0])
        if not users_df['ageRange'].dropna().empty:
            users_df['ageRange'].value_counts().plot.pie(ax=ax_age, autopct='%1.1f%%', colors=sns.color_palette('pastel'))
        ax_age.set_title('User Age Distribution', fontsize=18, color='black')
        ax_age.set_ylabel('')

        ax_salary = fig.add_subplot(gs[1, 1])
        if not users_df['salaryRange'].dropna().empty:
            users_df['salaryRange'].value_counts().plot.pie(ax=ax_salary, autopct='%1.1f%%', colors=sns.color_palette('pastel'))
        ax_salary.set_title('User Salary Distribution', fontsize=18, color='black')
        ax_salary.set_ylabel('')

        ax_prof = fig.add_subplot(gs[2, 0])
        if not users_df['profession'].dropna().empty:
            users_df['profession'].value_counts().plot.bar(ax=ax_prof, color='steelblue')
        ax_prof.set_title('User Professions', fontsize=18, color='black')
        ax_prof.tick_params(axis='x', rotation=45, labelsize=12, colors='black')
        ax_prof.tick_params(axis='y', colors='black')
        ax_prof.set_xlabel('Profession', fontsize=14, color='black')
        ax_prof.set_ylabel('Count', fontsize=14, color='black')

        ax_loc = fig.add_subplot(gs[2, 1])
        if not users_df['location'].dropna().empty:
            users_df['location'].value_counts().plot.bar(ax=ax_loc, color='mediumseagreen')
        ax_loc.set_title('User Locations', fontsize=18, color='black')
        ax_loc.tick_params(axis='x', rotation=45, labelsize=12, colors='black')
        ax_loc.tick_params(axis='y', colors='black')
        ax_loc.set_xlabel('Location', fontsize=14, color='black')
        ax_loc.set_ylabel('Count', fontsize=14, color='black')
    else:
        logger.warning("Users data not available for demographics plots.")
        for i in range(2):
            for j in range(2):
                ax = fig.add_subplot(gs[1+i, j])
                ax.text(0.5, 0.5, 'User Demographics (No Data)', horizontalalignment='center', verticalalignment='center', transform=ax.transAxes, fontsize=18, color='black')
                ax.axis('off')

    # --- User Spending Habits ---
    if 'usertransactions' in dfs and 'merchant' in dfs and not dfs['usertransactions'].empty and not dfs['merchant'].empty:
        transactions_df = dfs['usertransactions'].copy()
        merchants_df = dfs['merchant'].copy()
        transactions_df['amount'] = pd.to_numeric(transactions_df['amount'].apply(lambda x: x.get('$numberDecimal') if isinstance(x, dict) else x), errors='coerce')
        transactions_df.dropna(subset=['amount'], inplace=True)
        transactions_df = pd.merge(transactions_df, merchants_df, left_on='merchantId', right_on='_id', how='left')
        transactions_df.dropna(subset=['name'], inplace=True) # Ensure merchant name is not NaN

        ax_user_spend = fig.add_subplot(gs[3, 0])
        user_spending = transactions_df.groupby('userId')['amount'].sum().sort_values(ascending=False)
        if not user_spending.empty:
            user_spending.plot.bar(ax=ax_user_spend, color='lightcoral')
        ax_user_spend.set_title('Total Spending by User', fontsize=18, color='black')
        ax_user_spend.set_xlabel('User ID', fontsize=14, color='black')
        ax_user_spend.set_ylabel('Total Amount Spent', fontsize=14, color='black')
        ax_user_spend.tick_params(axis='x', colors='black')
        ax_user_spend.tick_params(axis='y', colors='black')

        ax_cat_spend = fig.add_subplot(gs[3, 1])
        category_spending = transactions_df.groupby('name')['amount'].sum()
        if not category_spending.empty and category_spending.sum() > 0:
            category_spending.plot.pie(ax=ax_cat_spend, autopct='%1.1f%%', colors=sns.color_palette("pastel"))
            ax_cat_spend.set_title('Spending by Merchant Category', fontsize=18, color='black')
            ax_cat_spend.set_ylabel('')
        else:
            logger.warning("Category spending data is empty or sums to zero, skipping pie chart for merchant categories.")
            ax_cat_spend.text(0.5, 0.5, 'No data available', horizontalalignment='center', verticalalignment='center', transform=ax_cat_spend.transAxes, fontsize=18, color='black')
            ax_cat_spend.set_title('Spending by Merchant Category (No Data)', fontsize=18, color='black')

    else:
        logger.warning("User transactions or merchant data not available for spending habits plots.")
        for j in range(2):
            ax = fig.add_subplot(gs[3, j])
            ax.text(0.5, 0.5, 'Spending Habits (No Data)', horizontalalignment='center', verticalalignment='center', transform=ax.transAxes, fontsize=18, color='black')
            ax.axis('off')

    # --- Card Feature Analysis ---
    if 'Credit_card_V2' in dfs and not dfs['Credit_card_V2'].empty:
        credit_cards_df = dfs['Credit_card_V2'].copy()
        features = ['lounge_access', 'insurance', 'cashback_offer', 'travel_rewards', 'fuel_rewards', 'movie_rewards']
        # Ensure boolean features are actually boolean
        for f in features:
            if f in credit_cards_df.columns:
                credit_cards_df[f] = credit_cards_df[f].astype(bool)
            else:
                credit_cards_df[f] = False # Add missing features as False

        feature_counts = credit_cards_df[features].sum()
        ax_features = fig.add_subplot(gs[4, 0])
        if not feature_counts.empty:
            feature_counts.plot.bar(ax=ax_features, color=sns.color_palette("viridis"))
        ax_features.set_title('Credit Card Feature Distribution', fontsize=18, color='black')
        ax_features.tick_params(axis='x', rotation=45, labelsize=12, colors='black')
        ax_features.tick_params(axis='y', colors='black')
        ax_features.set_xlabel('Feature', fontsize=14, color='black')
        ax_features.set_ylabel('Number of Cards', fontsize=14, color='black')
    else:
        logger.warning("Credit card data not available for feature analysis.")
        ax = fig.add_subplot(gs[4, 0])
        ax.text(0.5, 0.5, 'Card Features (No Data)', horizontalalignment='center', verticalalignment='center', transform=ax.transAxes, fontsize=18, color='black')
        ax.axis('off')

    # --- Recommendation Effectiveness ---
    if 'recommendations4' in dfs and not dfs['recommendations4'].empty:
        recommendations_df = dfs['recommendations4'].copy()
        top_recommendations = recommendations_df['card_name'].value_counts().nlargest(10)
        ax_reco = fig.add_subplot(gs[4, 1])
        if not top_recommendations.empty:
            top_recommendations.plot.barh(ax=ax_reco, color='lightsteelblue')
        ax_reco.set_title('Top 10 Most Recommended Credit Cards', fontsize=18, color='black')
        ax_reco.set_xlabel('Number of Recommendations', fontsize=14, color='black')
        ax_reco.tick_params(axis='y', labelsize=12, colors='black')
        ax_reco.tick_params(axis='x', colors='black')
    else:
        logger.warning("Recommendations data not available for effectiveness plots.")
        ax = fig.add_subplot(gs[4, 1])
        ax.text(0.5, 0.5, 'Recommendations (No Data)', horizontalalignment='center', verticalalignment='center', transform=ax.transAxes, fontsize=18, color='black')
        ax.axis('off')

    plt.savefig(os.path.join(output_dir, "comprehensive_dashboard.png"), facecolor='white', bbox_inches='tight')
    plt.close()
    logger.info(f"Saved comprehensive dashboard to {os.path.join(output_dir, "comprehensive_dashboard.png")}")

# --- Main Execution ---
def main():
    """Main function to run the dashboard generation process."""
    db = mongodb_client()
    if db is not None:
        # Load all collections to ensure comprehensive summary
        all_collection_names = db.list_collection_names()
        dfs = load_collections_as_dataframes(db, all_collection_names)
        generate_comprehensive_dashboard(db, dfs, OUTPUT_DIR)

if __name__ == "__main__":
    main()