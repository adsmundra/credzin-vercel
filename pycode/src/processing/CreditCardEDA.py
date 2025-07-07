import pandas as pd
import numpy as np
import matplotlib.cm as cm
import matplotlib.pyplot as plt
import seaborn as sns

import re
import nltk
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from wordcloud import WordCloud
import spacy
import os
import logging

# featuretools for automated feature engineering (keep if needed, but not directly used in EDA for now)
import featuretools as ft

# ignore warnings from pandas
import warnings
warnings.filterwarnings('ignore')

# --- Logging Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Configuration ---
INPUT_PATH = 'KnowledgeBase/StructuredCardsData/cc_features.csv'
OUTPUT_PROCESSED_PATH = 'KnowledgeBase/StructuredCardsData/cc_features_processed.csv'
OUTPUT_DASH_DIR = 'Output/dash'

# Ensure output directory exists
os.makedirs(OUTPUT_DASH_DIR, exist_ok=True)
logger.info(f"Ensured output directory exists: {OUTPUT_DASH_DIR}")

# Download NLTK stopwords if not already downloaded
try:
    stopwords.words('english')
except LookupError:
    nltk.download('stopwords')
    logger.info("Downloaded NLTK stopwords.")

# Function to check for keyword presence
def keyword_flags(text, keyword_list):
    text = str(text).lower()
    return any(kw in text for kw in keyword_list)

# Function to tag based on keywords (moved up for proper definition)
def tag_from_rewards(text, keywords):
    text = str(text).lower()
    return any(k in text for k in keywords)

def main():
    logger.info("--- Starting Credit Card EDA Process ---")

    # --- 1. Data Loading and Initial Inspection ---
    logger.info("\n--- 1. Data Loading and Initial Inspection ---")
    try:
        df = pd.read_csv(INPUT_PATH)
        logger.info(f"Successfully loaded data from {INPUT_PATH}")
    except FileNotFoundError:
        logger.error(f"Error: Input file not found at {INPUT_PATH}")
        return
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        return

    logger.info(f"DataFrame Shape: {df.shape}")
    logger.info(f"DataFrame Head:\n{df.head().to_string()}")
    logger.info("DataFrame Info:")
    df.info()
    logger.info(f"DataFrame Description (all columns):\n{df.describe(include='all').to_string()}")
    logger.info(f"Missing Values:\n{df.isnull().sum().to_string()}")
    logger.info(f"Number of duplicate rows: {df.duplicated().sum()}")

    # --- 2. Data Cleaning and Preprocessing ---
    logger.info("\n--- 2. Data Cleaning and Preprocessing ---")
    if 'card_name' in df.columns:
        df['card_name'] = df['card_name'].astype(str).apply(lambda x: re.sub(r'[^a-zA-Z0-9\s]', '', x))
        logger.info("Cleaned special characters from 'card_name'.")

    df['features'] = df['features'].fillna('')
    df['rewards'] = df['rewards'].fillna('')
    logger.info("Filled NaN in 'features' and 'rewards' columns with empty strings.")

    # --- 3. Exploratory Data Analysis (EDA) ---

    # 3.1. Credit Card Counts by Bank
    logger.info("\n--- 3.1. Credit Card Counts by Bank ---")
    bank_counts = df.groupby('bank_name')['card_name'].count().reset_index()
    bank_counts = bank_counts.sort_values(by='card_name', ascending=False)

    plt.figure(figsize=(12, 7))
    colors = cm.viridis(np.linspace(0, 1, len(bank_counts)))
    bars = plt.bar(bank_counts['bank_name'], bank_counts['card_name'], color=colors)
    plt.xlabel("Bank Name")
    plt.ylabel("Number of Credit Cards")
    plt.title("Credit Card Counts by Bank")
    plt.xticks(rotation=60, ha='right')
    plt.tight_layout()

    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 0.1, int(yval), va='bottom', ha='center')
    plot_path = os.path.join(OUTPUT_DASH_DIR, 'credit_card_counts_by_bank.png')
    plt.savefig(plot_path)
    logger.info(f"Saved 'credit_card_counts_by_bank.png' to {plot_path}")
    plt.close() # Close plot to free memory

    # 3.2. NLP Processing and Feature Tagging
    logger.info("\n--- 3.2. NLP Processing and Feature Tagging ---")
    df_processed = df.copy()
    df_processed['features_clean'] = df_processed['features'].astype(str).str.strip('"')
    df_processed['rewards_clean'] = df_processed['rewards'].astype(str).str.strip('"')

    # Define tags for features
    tags = {
        'welcome_benefit': ['welcome', 'joining benefit', 'gift'],
        'milestone_benefit': ['milestone', 'spend', 'cashback'],
        'lounge_access': ['lounge', 'airport'],
        'fuel_benefit': ['fuel', 'fuel surcharge'],
        'movie_offer': ['movie', 'cinema', 'bookmyshow'],
        'reward_points': ['reward point', 'earn point'],
        'dining_offer': ['dining', 'restaurant', 'meal'],
        'travel_offer': ['travel', 'flight', 'hotel'],
        'international_use': ['international', 'forex'],
        'insurance': ['insurance', 'coverage', 'accident'],
    }

    # Define benefit tags for rewards
    benefit_tags = {
        'welcome_points': ['welcome', 'joining'],
        'milestone_rewards': ['milestone', 'spend', 'anniversary'],
        'bonus_points': ['bonus', 'extra points'],
        'cashback_offer': ['cashback', 'moneyback'],
        'voucher_offer': ['voucher', 'amazon', 'flipkart', 'gift'],
        'travel_rewards': ['flight', 'hotel', 'travel', 'airline'],
        'fuel_rewards': ['fuel', 'fuel surcharge'],
        'movie_rewards': ['movie', 'cinema', 'bookmyshow'],
    }

    # Apply keyword tagging for features
    for tag, keywords in tags.items():
        df_processed[tag] = df_processed['features_clean'].apply(lambda x: keyword_flags(x, keywords))

    # Apply tagging for rewards
    for tag, keywords in benefit_tags.items():
        df_processed[tag] = df_processed['rewards_clean'].apply(lambda x: tag_from_rewards(x, keywords))

    logger.info(f"DataFrame shape after feature and benefit tagging: {df_processed.shape}")
    logger.info(f"Sample after tagging:\n{df_processed.sample(5).to_string()}")

    # 3.3. Word Cloud for Features and Rewards
    logger.info("\n--- 3.3. Word Cloud for Features and Rewards ---")
    stop_words = set(stopwords.words('english'))
    # Add common credit card related stopwords
    stop_words.update(['card', 'credit', 'bank', 'offer', 'rewards', 'points', 'benefit', 'surcharge', 'waiver', 'annual', 'fee', 'per', 'every', 'on', 'with', 'for', 'and', 'or', 'from', 'to', 'in', 'at', 'by', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'])

    all_features_text = " ".join(df_processed['features_clean'].dropna())
    wordcloud_features = WordCloud(width=800, height=400, background_color='white', stopwords=stop_words).generate(all_features_text)
    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud_features, interpolation='bilinear')
    plt.axis('off')
    plt.title('Word Cloud for Credit Card Features')
    plot_path = os.path.join(OUTPUT_DASH_DIR, 'features_wordcloud.png')
    plt.savefig(plot_path)
    logger.info(f"Saved 'features_wordcloud.png' to {plot_path}")
    plt.close()

    all_rewards_text = " ".join(df_processed['rewards_clean'].dropna())
    wordcloud_rewards = WordCloud(width=800, height=400, background_color='white', stopwords=stop_words).generate(all_rewards_text)
    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud_rewards, interpolation='bilinear')
    plt.axis('off')
    plt.title('Word Cloud for Credit Card Rewards')
    plot_path = os.path.join(OUTPUT_DASH_DIR, 'rewards_wordcloud.png')
    plt.savefig(plot_path)
    logger.info(f"Saved 'rewards_wordcloud.png' to {plot_path}")
    plt.close()

    # 3.4. TF-IDF Analysis for Important Keywords
    logger.info("\n--- 3.4. TF-IDF Analysis for Important Keywords ---")
    tfidf_vectorizer = TfidfVectorizer(stop_words=list(stop_words), max_features=100)

    # For Features
    tfidf_matrix_features = tfidf_vectorizer.fit_transform(df_processed['features_clean'])
    feature_names_features = tfidf_vectorizer.get_feature_names_out()
    tfidf_scores_features = tfidf_matrix_features.sum(axis=0).A1
    top_features_df = pd.DataFrame({'term': feature_names_features, 'tfidf_score': tfidf_scores_features})
    top_features_df = top_features_df.sort_values(by='tfidf_score', ascending=False).head(20)
    logger.info(f"\nTop 20 TF-IDF terms in Features:\n{top_features_df.to_string()}")

    # For Rewards
    tfidf_matrix_rewards = tfidf_vectorizer.fit_transform(df_processed['rewards_clean'])
    feature_names_rewards = tfidf_vectorizer.get_feature_names_out()
    tfidf_scores_rewards = tfidf_matrix_rewards.sum(axis=0).A1
    top_rewards_df = pd.DataFrame({'term': feature_names_rewards, 'tfidf_score': tfidf_scores_rewards})
    top_rewards_df = top_rewards_df.sort_values(by='tfidf_score', ascending=False).head(20)
    logger.info(f"\nTop 20 TF-IDF terms in Rewards:\n{top_rewards_df.to_string()}")

    # 3.5. Distribution of Tagged Features and Benefits
    logger.info("\n--- 3.5. Distribution of Tagged Features and Benefits ---")
    all_tags = list(tags.keys()) + list(benefit_tags.keys())
    tag_counts = df_processed[all_tags].sum().sort_values(ascending=False)

    plt.figure(figsize=(14, 8))
    sns.barplot(x=tag_counts.index, y=tag_counts.values, palette='viridis')
    plt.xlabel("Feature/Benefit Tag")
    plt.ylabel("Number of Cards")
    plt.title("Distribution of Credit Card Features and Benefits")
    plt.xticks(rotation=75, ha='right')
    plt.tight_layout()
    plot_path = os.path.join(OUTPUT_DASH_DIR, 'feature_benefit_distribution.png')
    plt.savefig(plot_path)
    logger.info(f"Saved 'feature_benefit_distribution.png' to {plot_path}")
    plt.close()

    # 3.6. Bank-wise Feature/Benefit Distribution
    logger.info("\n--- 3.6. Bank-wise Feature/Benefit Distribution ---")
    df_melted = df_processed.melt(id_vars=['bank_name'], value_vars=all_tags, var_name='feature_type', value_name='has_feature')
    df_melted = df_melted[df_melted['has_feature'] == True]

    bank_feature_counts = df_melted.groupby(['bank_name', 'feature_type']).size().unstack(fill_value=0)

    bank_names_to_plot = bank_feature_counts.index.tolist()
    num_banks = len(bank_names_to_plot)
    num_cols = 3
    num_rows = (num_banks + num_cols - 1) // num_cols

    fig, axes = plt.subplots(num_rows, num_cols, figsize=(num_cols * 6, num_rows * 5), sharey=True)
    axes = axes.flatten()

    for i, bank in enumerate(bank_names_to_plot):
        if i < len(axes):
            bank_feature_counts.loc[bank].sort_values(ascending=False).plot(kind='bar', ax=axes[i], color=sns.color_palette('tab10'))
            axes[i].set_title(f'{bank}')
            axes[i].set_xlabel('')
            axes[i].set_ylabel('Count')
            axes[i].tick_params(axis='x', rotation=45)
        else:
            fig.delaxes(axes[i])

    plt.suptitle('Feature/Benefit Distribution by Bank', y=1.02, fontsize=16)
    plt.tight_layout(rect=[0, 0.03, 1, 0.98])
    plot_path = os.path.join(OUTPUT_DASH_DIR, 'bank_wise_feature_benefit_distribution.png')
    plt.savefig(plot_path)
    logger.info(f"Saved 'bank_wise_feature_benefit_distribution.png' to {plot_path}")
    plt.close()

    # --- 4. Save Processed Data ---
    logger.info("\n--- 4. Save Processed Data ---")
    try:
        df_processed.to_csv(OUTPUT_PROCESSED_PATH, index=False, quoting=1)
        logger.info(f"Processed DataFrame saved to {OUTPUT_PROCESSED_PATH}")
    except Exception as e:
        logger.error(f"Error saving processed data: {e}")

    logger.info("\n--- Credit Card EDA Process Complete ---")

if __name__ == "__main__":
    main()