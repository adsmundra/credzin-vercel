
import pandas as pd
import numpy as np

import matplotlib.cm as cm
import matplotlib.pyplot as plt

import re
import nltk
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
import spacy

# featuretools for automated feature engineering
import featuretools as ft

# ignore warnings from pandas
import warnings
warnings.filterwarnings('ignore')

# Load the Excel file
file_path = '/Users/aman/Welzin/Dev/credzin/resources/credit_card_details.xlsx'
xls = pd.ExcelFile(file_path)

# Get all sheet names, excluding 'card_issuers'
sheet_names = [sheet for sheet in xls.sheet_names if sheet != 'card_issuers']

# Read and concatenate all sheets (assuming identical headers)
dfs = [xls.parse(sheet) for sheet in sheet_names]

# Concatenate into a single DataFrame
combined_df = pd.concat(dfs, ignore_index=True)

# Preview result
print(combined_df.shape)
print(combined_df.head())

# Group data by bank name and count credit cards
bank_counts = combined_df.groupby('bank_name')['card_name'].count().reset_index()

# Create the bar graph
plt.figure(figsize=(10, 6))  # Adjust figure size as needed
colors = cm.viridis(np.linspace(0, 1, len(bank_counts)))  # Get colors from viridis colormap
bars = plt.bar(bank_counts['bank_name'], bank_counts['card_name'], color=colors)
plt.xlabel("Bank Name")
plt.ylabel("Number of Credit Cards")
plt.title("Credit Card Counts by Bank")
plt.xticks(rotation=45, ha='right')  # Rotate x-axis labels for readability
plt.tight_layout()  # Adjust layout to prevent labels from overlapping

for bar in bars:    # Add count labels to the bars
    yval = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2, yval, int(yval), va='bottom', ha='center')
#plt.show()


# NLP PROCESSING

# Copy the dataframe for processing
df_features = combined_df

# Normalize the features column: remove leading/trailing quotes and parse
df_features['features_clean'] = df_features['features'].astype(str).str.strip('"')

# Define tags to extract from the features column
# welcome_points: Mentions of welcome or joining benefits
# milestone_rewards: Based on spending or milestone achievements
# bonus_points: Mentions of extra or bonus points
# cashback_offer: Cards offering cashback
# voucher_offer: Includes vouchers like Amazon, Flipkart, etc.
# travel_rewards: Travel-related benefits (flights, hotels)
# fuel_rewards: Fuel surcharge waiver or fuel-based rewards
# movie_rewards: Offers for movies or entertainment

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

# Function to check for keyword presence
def keyword_flags(text, keyword_list):
    text = str(text).lower()
    return any(kw in text for kw in keyword_list)

# Apply keyword tagging
for tag, keywords in tags.items():
    df_features[tag] = df_features['features_clean'].apply(lambda x: keyword_flags(x, keywords))

print(df_features.shape)
df_features.sample(5)


# Normalize the 'rewards' column (often contains JSON-like strings)
df_benefits = df_features
df_benefits['rewards_clean'] = df_benefits['rewards'].astype(str).str.strip('"')

# Define benefit tags to extract
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

# Function to tag based on keywords
def tag_from_rewards(text, keywords):
    text = str(text).lower()
    return any(k in text for k in keywords)

# Apply tagging
for tag, keywords in benefit_tags.items():  
    df_benefits[tag] = df_benefits['rewards_clean'].apply(lambda x: tag_from_rewards(x, keywords))

print(df_benefits.shape)
print(df_benefits.sample(3))
print(df_benefits.columns)