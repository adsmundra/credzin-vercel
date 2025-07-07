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
import os
import logging
import time # Added for Qdrant ingestion

# Qdrant related imports
from qdrant_client.models import PointStruct, SparseVector, VectorParams, Distance, SparseVectorParams
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from langchain.schema import Document
from langchain_qdrant import FastEmbedSparse

# Import qdrantdb_client from DataLoaders
from DataLoaders.QdrantDB import qdrantdb_client

# ignore warnings from pandas
import warnings
warnings.filterwarnings('ignore')

# --- Qdrant Helper Functions ---
def _setup_qdrant_collection():
    """Setup or verify Qdrant collection for hybrid search."""
    COLLECTION_NAME = "credit_card_features"
    
    client = qdrantdb_client() # Use the imported client function
    if not client:
        logger.error("Failed to get Qdrant client. Aborting collection setup.")
        return None, None
    
    try:
        collection_info = client.get_collection(COLLECTION_NAME)
        has_dense_config = "vector" in collection_info.config.vectors_config.config_by_name
        has_sparse_config = "sparse_vector" in collection_info.config.vectors_config.config_by_name

        if has_dense_config and has_sparse_config:
            logger.info(f"Collection '{COLLECTION_NAME}' already exists with correct configuration.")
            create_new_collection = False
        else:
            logger.info(f"Collection '{COLLECTION_NAME}' exists but needs update. Recreating...")
            client.delete_collection(collection_name=COLLECTION_NAME)
            create_new_collection = True
    except Exception:
        logger.info(f"Collection '{COLLECTION_NAME}' not found. Creating new one.")
        create_new_collection = True

    if create_new_collection:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config={
                "vector": VectorParams(size=1024, distance=Distance.COSINE)
            },
            sparse_vectors_config={
                "sparse-vector": SparseVectorParams()
            }
        )
        logger.info(f"Created collection '{COLLECTION_NAME}' with dense and sparse vector configurations.")
    
    

def _ingest_rows_as_points(df, client, collection_name):
    """Ingest each DataFrame row as a single point into Qdrant."""
    logger.info("\n--- Ingesting data to Qdrant (Row by Row) ---")
    embedding_model = SentenceTransformer('BAAI/bge-large-en-v1.5', trust_remote_code=True)
    sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")
    
    # Extract documents (one per row)
    def extract_df_documents(df_to_process):
        documents = []
        for idx, row in df_to_process.iterrows():
            card_name = row.get("card_name", "Unknown") or "Unknown"
            bank_name = row.get("bank_name", "Unknown") or "Unknown"
            metadata = {
                "type": "credit_card_data",
                "row_index": idx + 1,
                "card_name": card_name,
                "bank_name": bank_name,
            }
            # Add all other columns to metadata, excluding sensitive or large text fields if necessary
            for col, val in row.items():
                if col not in ["card_name", "bank_name", "features_clean", "rewards_clean"] and pd.notna(val):
                    metadata[col] = val
            
            # Create a comprehensive text representation of the card
            card_text = f"Card: {card_name} by {bank_name}. "
            if pd.notna(row.get("card_usp")) and row["card_usp"]:
                card_text += f"USP: {row['card_usp']}. "
            if pd.notna(row.get("features_clean")) and row["features_clean"]:
                card_text += f"Features: {row['features_clean']}. "
            if pd.notna(row.get("rewards_clean")) and row["rewards_clean"]:
                card_text += f"Rewards: {row['rewards_clean']}. "
            if pd.notna(row.get("full_card_description")) and row["full_card_description"]:
                card_text += f"Description: {row['full_card_description']}. "
            
            doc = Document(page_content=card_text, metadata=metadata)
            documents.append(doc)
        logger.info(f"Extracted {len(documents)} documents from DataFrame for Qdrant.")
        return documents
    
    # Insert documents as single points
    def insert_documents(documents_to_insert, batch_size=10):
        total_inserted = 0
        for i in range(0, len(documents_to_insert), batch_size):
            batch = documents_to_insert[i:i+batch_size]
            
            dense_embeddings = embedding_model.encode(
                [f"passage: {doc.page_content}" for doc in batch],
                normalize_embeddings=True,
                show_progress_bar=False
            ).tolist()
            
            sparse_embs = sparse_embeddings.embed_documents([doc.page_content for doc in batch])
            
            points = []
            for j, doc in enumerate(batch):
                point = PointStruct(
                    id=total_inserted + j, # Ensure unique IDs across batches
                    vector={
                        "vector": dense_embeddings[j],
                        "sparse-vector": SparseVector(indices=sparse_embs[j].indices, values=sparse_embs[j].values)
                    },
                    payload={
                        "content": doc.page_content,
                        "metadata": doc.metadata,
                        "card_name": doc.metadata.get("card_name", "Unknown"),
                        "bank_name": doc.metadata.get("bank_name", "Unknown")
                    }
                )
                points.append(point)
            
            client.upsert(collection_name=collection_name, points=points, wait=True)
            total_inserted += len(points)
            logger.info(f"Inserted batch {i//batch_size + 1}, total so far {total_inserted}")
            time.sleep(0.1) # Small delay to avoid overwhelming Qdrant
        return total_inserted
    
    documents = extract_df_documents(df)
    if not documents:
        logger.error("No documents extracted for Qdrant ingestion.")
        return 0
    
    total_inserted = insert_documents(documents)
    logger.info(f"Successfully inserted {total_inserted} points into Qdrant collection '{collection_name}'.")
    return total_inserted

def _ingest_chunks_to_qdrant(df, client, collection_name):
    """Ingest processed data into Qdrant after chunking."""
    logger.info("\n--- Ingesting data to Qdrant (with Chunking) ---")
    embedding_model = SentenceTransformer('BAAI/bge-large-en-v1.5', trust_remote_code=True)
    sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=256,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    # Extract documents
    def extract_df_documents_for_chunking(df_to_process):
        documents = []
        for idx, row in df_to_process.iterrows():
            card_name = row.get("card_name", "Unknown") or "Unknown"
            bank_name = row.get("bank_name", "Unknown") or "Unknown"
            metadata = {
                "type": "credit_card_data",
                "row_index": idx + 1,
                "card_name": card_name,
                "bank_name": bank_name,
            }
            # Add all other columns to metadata, excluding sensitive or large text fields if necessary
            for col, val in row.items():
                if col not in ["card_name", "bank_name", "features_clean", "rewards_clean"] and pd.notna(val):
                    metadata[col] = val
            
            # Create a comprehensive text representation of the card
            card_text = f"Card: {card_name} by {bank_name}. "
            if pd.notna(row.get("card_usp")) and row["card_usp"]:
                card_text += f"USP: {row["card_usp"]}. "
            if pd.notna(row.get("features_clean")) and row["features_clean"]:
                card_text += f"Features: {row["features_clean"]}. "
            if pd.notna(row.get("rewards_clean")) and row["rewards_clean"]:
                card_text += f"Rewards: {row["rewards_clean"]}. "
            if pd.notna(row.get("full_card_description")) and row["full_card_description"]:
                card_text += f"Description: {row["full_card_description"]}. "
            
            doc = Document(page_content=card_text, metadata=metadata)
            documents.append(doc)
        logger.info(f"Extracted {len(documents)} documents from DataFrame for chunking.")
        return documents
    
    # Chunk documents
    def chunk_documents(documents_to_chunk):
        logger.info(f"Splitting {len(documents_to_chunk)} documents into chunks...")
        chunks = text_splitter.split_documents(documents_to_chunk)
        logger.info(f"Created {len(chunks)} chunks.")
        return chunks
    
    # Insert chunks
    def insert_chunks(chunks_to_insert, batch_size=10):
        total_inserted = 0
        for i in range(0, len(chunks_to_insert), batch_size):
            batch = chunks_to_insert[i:i+batch_size]
            
            dense_embeddings = embedding_model.encode(
                [f"passage: {c.page_content}" for c in batch],
                normalize_embeddings=True,
                show_progress_bar=False
            ).tolist()
            
            sparse_embs = sparse_embeddings.embed_documents([c.page_content for c in batch])
            
            points = []
            for j, chunk in enumerate(batch):
                point = PointStruct(
                    id=total_inserted + j, # Ensure unique IDs across batches
                    vector={
                        "vector": dense_embeddings[j],
                        "sparse-vector": SparseVector(indices=sparse_embs[j].indices, values=sparse_embs[j].values)
                    },
                    payload={
                        "content": chunk.page_content,
                        "metadata": chunk.metadata,
                        "card_name": chunk.metadata.get("card_name", "Unknown"),
                        "bank_name": chunk.metadata.get("bank_name", "Unknown")
                    }
                )
                points.append(point)
            
            client.upsert(collection_name=collection_name, points=points, wait=True)
            total_inserted += len(points)
            logger.info(f"Inserted batch {i//batch_size + 1}, total so far {total_inserted}")
            time.sleep(0.1) # Small delay to avoid overwhelming Qdrant
        return total_inserted
    
    documents = extract_df_documents_for_chunking(df)
    if not documents:
        logger.error("No documents extracted for Qdrant chunking and ingestion.")
        return 0
    
    chunks = chunk_documents(documents)
    total_inserted = insert_chunks(chunks)
    logger.info(f"Successfully inserted {total_inserted} chunks into Qdrant collection '{collection_name}'.")
    return total_inserted

def _ingest_chunks_to_qdrant(df, client, collection_name):
    """Ingest processed data into Qdrant after chunking."""
    logger.info("\n--- Ingesting data to Qdrant (with Chunking) ---")
    embedding_model = SentenceTransformer('BAAI/bge-large-en-v1.5', trust_remote_code=True)
    sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=256,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    # Extract documents
    def extract_df_documents_for_chunking(df_to_process):
        documents = []
        for idx, row in df_to_process.iterrows():
            card_name = row.get("card_name", "Unknown") or "Unknown"
            bank_name = row.get("bank_name", "Unknown") or "Unknown"
            metadata = {
                "type": "credit_card_data",
                "row_index": idx + 1,
                "card_name": card_name,
                "bank_name": bank_name,
            }
            # Add all other columns to metadata, excluding sensitive or large text fields if necessary
            for col, val in row.items():
                if col not in ["card_name", "bank_name", "features_clean", "rewards_clean"] and pd.notna(val):
                    metadata[col] = val
            
            # Create a comprehensive text representation of the card
            card_text = f"Card: {card_name} by {bank_name}. "
            if pd.notna(row.get("card_usp")) and row["card_usp"]:
                card_text += f"USP: {row['card_usp']}. "
            if pd.notna(row.get("features_clean")) and row["features_clean"]:
                card_text += f"Features: {row['features_clean']}. "
            if pd.notna(row.get("rewards_clean")) and row["rewards_clean"]:
                card_text += f"Rewards: {row['rewards_clean']}. "
            if pd.notna(row.get("full_card_description")) and row["full_card_description"]:
                card_text += f"Description: {row['full_card_description']}. "
            
            doc = Document(page_content=card_text, metadata=metadata)
            documents.append(doc)
        logger.info(f"Extracted {len(documents)} documents from DataFrame for chunking.")
        return documents
    
    # Chunk documents
    def chunk_documents(documents_to_chunk):
        logger.info(f"Splitting {len(documents_to_chunk)} documents into chunks...")
        chunks = text_splitter.split_documents(documents_to_chunk)
        logger.info(f"Created {len(chunks)} chunks.")
        return chunks
    
    # Insert chunks
    def insert_chunks(chunks_to_insert, batch_size=10):
        total_inserted = 0
        for i in range(0, len(chunks_to_insert), batch_size):
            batch = chunks_to_insert[i:i+batch_size]
            
            dense_embeddings = embedding_model.encode(
                [f"passage: {c.page_content}" for c in batch],
                normalize_embeddings=True,
                show_progress_bar=False
            ).tolist()
            
            sparse_embs = sparse_embeddings.embed_documents([c.page_content for c in batch])
            
            points = []
            for j, chunk in enumerate(batch):
                point = PointStruct(
                    id=total_inserted + j, # Ensure unique IDs across batches
                    vector={
                        "vector": dense_embeddings[j],
                        "sparse-vector": SparseVector(indices=sparse_embs[j].indices, values=sparse_embs[j].values)
                    },
                    payload={
                        "content": chunk.page_content,
                        "metadata": chunk.metadata,
                        "card_name": chunk.metadata.get("card_name", "Unknown"),
                        "bank_name": chunk.metadata.get("bank_name", "Unknown")
                    }
                )
                points.append(point)
            
            client.upsert(collection_name=collection_name, points=points, wait=True)
            total_inserted += len(points)
            logger.info(f"Inserted batch {i//batch_size + 1}, total so far {total_inserted}")
            time.sleep(0.1) # Small delay to avoid overwhelming Qdrant
        return total_inserted
    
    documents = extract_df_documents_for_chunking(df)
    if not documents:
        logger.error("No documents extracted for Qdrant chunking and ingestion.")
        return 0
    
    chunks = chunk_documents(documents)
    total_inserted = insert_chunks(chunks)
    logger.info(f"Successfully inserted {total_inserted} chunks into Qdrant collection '{collection_name}'.")
    return total_inserted

from utils.logger import configure_logging

# --- Logging Configuration ---
logger = configure_logging("CreditCardEDA")

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

# Additional stopwords for credit card domain
ADDITIONAL_STOPWORDS = [
    'card', 'credit', 'bank', 'offer', 'rewards', 'points', 'benefit', 
    'surcharge', 'waiver', 'annual', 'fee', 'per', 'every', 'on', 'with', 
    'for', 'and', 'or', 'from', 'to', 'in', 'at', 'by', 'of', 'is', 
    'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 
    'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 
    'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 
    'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 
    'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 
    'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 
    'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 
    's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
]

# --- Helper Functions ---
def _keyword_flags(text, keyword_list):
    """Checks for keyword presence in text."""
    text = str(text).lower()
    return any(kw in text for kw in keyword_list)

def _tag_from_rewards(text, keywords):
    """Tags based on keywords in rewards text."""
    text = str(text).lower()
    return any(k in text for k in keywords)

def _perform_initial_data_inspection(df):
    """Performs initial data loading and inspection."""
    logger.info("\n--- 1. Data Loading and Initial Inspection ---")
    logger.info(f"DataFrame Shape: {df.shape}")
    logger.info(f"DataFrame Head:\n{df.head().to_string()}")
    logger.info("DataFrame Info:")
    df.info()
    logger.info(f"DataFrame Description (all columns):\n{df.describe(include='all').to_string()}")
    logger.info(f"Missing Values:\n{df.isnull().sum().to_string()}")
    logger.info(f"Number of duplicate rows: {df.duplicated().sum()}")

def _perform_data_cleaning(df):
    """Cleans and preprocesses the DataFrame."""
    logger.info("\n--- 2. Data Cleaning and Preprocessing ---")
    if 'card_name' in df.columns:
        df['card_name'] = df['card_name'].astype(str).apply(lambda x: re.sub(r'[^a-zA-Z0-9\s]', '', x))
        logger.info("Cleaned special characters from 'card_name'.")

    df['features'] = df['features'].fillna('')
    df['rewards'] = df['rewards'].fillna('')
    logger.info("Filled NaN in 'features' and 'rewards' columns with empty strings.")
    return df

def _plot_credit_card_counts_by_bank(df, output_dir):
    """Generates and saves a bar chart of credit card counts by bank."""
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
    plot_path = os.path.join(output_dir, 'credit_card_counts_by_bank.png')
    plt.savefig(plot_path)
    logger.info(f"Saved 'credit_card_counts_by_bank.png' to {plot_path}")
    plt.close() # Close plot to free memory

def _process_nlp_features(df):
    """Performs NLP cleaning and feature/benefit tagging."""
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
        df_processed[tag] = df_processed['features_clean'].apply(lambda x: _keyword_flags(x, keywords))

    # Apply tagging for rewards
    for tag, keywords in benefit_tags.items():
        df_processed[tag] = df_processed['rewards_clean'].apply(lambda x: _tag_from_rewards(x, keywords))

    logger.info(f"DataFrame shape after feature and benefit tagging: {df_processed.shape}")
    logger.info(f"Sample after tagging:\n{df_processed.sample(5).to_string()}")
    return df_processed, tags, benefit_tags

def _generate_word_clouds(df_processed, stop_words, output_dir):
    """Generates and saves word clouds for features and rewards."""
    logger.info("\n--- 3.3. Word Cloud for Features and Rewards ---")
    
    all_stop_words = set(stopwords.words('english'))
    all_stop_words.update(ADDITIONAL_STOPWORDS)

    all_features_text = " ".join(df_processed['features_clean'].dropna())
    wordcloud_features = WordCloud(width=800, height=400, background_color='white', stopwords=all_stop_words).generate(all_features_text)
    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud_features, interpolation='bilinear')
    plt.axis('off')
    plt.title('Word Cloud for Credit Card Features')
    plot_path = os.path.join(output_dir, 'features_wordcloud.png')
    plt.savefig(plot_path)
    logger.info(f"Saved 'features_wordcloud.png' to {plot_path}")
    plt.close()

    all_rewards_text = " ".join(df_processed['rewards_clean'].dropna())
    wordcloud_rewards = WordCloud(width=800, height=400, background_color='white', stopwords=all_stop_words).generate(all_rewards_text)
    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud_rewards, interpolation='bilinear')
    plt.axis('off')
    plt.title('Word Cloud for Credit Card Rewards')
    plot_path = os.path.join(output_dir, 'rewards_wordcloud.png')
    plt.savefig(plot_path)
    logger.info(f"Saved 'rewards_wordcloud.png' to {plot_path}")
    plt.close()

def _perform_tfidf_analysis(df_processed, stop_words):
    """Performs TF-IDF analysis for important keywords."""
    logger.info("\n--- 3.4. TF-IDF Analysis for Important Keywords ---")
    
    all_stop_words = set(stopwords.words('english'))
    all_stop_words.update(ADDITIONAL_STOPWORDS)

    tfidf_vectorizer = TfidfVectorizer(stop_words=list(all_stop_words), max_features=100)

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

def _plot_feature_benefit_distribution(df_processed, all_tags, output_dir):
    """Plots the distribution of tagged features and benefits."""
    logger.info("\n--- 3.5. Distribution of Tagged Features and Benefits ---")
    tag_counts = df_processed[all_tags].sum().sort_values(ascending=False)

    plt.figure(figsize=(14, 8))
    sns.barplot(x=tag_counts.index, y=tag_counts.values, palette='viridis')
    plt.xlabel("Feature/Benefit Tag")
    plt.ylabel("Number of Cards")
    plt.title("Distribution of Credit Card Features and Benefits")
    plt.xticks(rotation=75)
    plt.tight_layout()
    plot_path = os.path.join(output_dir, 'feature_benefit_distribution.png')
    plt.savefig(plot_path)
    logger.info(f"Saved 'feature_benefit_distribution.png' to {plot_path}")
    plt.close()

def _plot_bank_wise_feature_benefit_distribution(df_processed, all_tags, output_dir):
    """Plots bank-wise distribution of features and benefits."""
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
            axes[i].tick_params(axis='x', rotation=45) # Removed ha='right'
        else:
            fig.delaxes(axes[i])

    plt.suptitle('Feature/Benefit Distribution by Bank', y=1.02, fontsize=16)
    plt.tight_layout(rect=[0, 0.03, 1, 0.98])
    plot_path = os.path.join(output_dir, 'bank_wise_feature_benefit_distribution.png')
    plt.savefig(plot_path)
    logger.info(f"Saved 'bank_wise_feature_benefit_distribution.png' to {plot_path}")
    plt.close()

def _save_processed_data(df, output_path):
    """Saves the processed DataFrame to CSV."""
    logger.info("\n--- 4. Save Processed Data ---")
    try:
        df.to_csv(output_path, index=False, quoting=1)
        logger.info(f"Processed DataFrame saved to {output_path}")
    except Exception as e:
        logger.error(f"Error saving processed data: {e}")

# --- Main Execution ---
def main():
    logger.info("--- Starting Credit Card EDA Process ---")

    try:
        df = pd.read_csv(INPUT_PATH)
        logger.info(f"Successfully loaded data from {INPUT_PATH}")
    except FileNotFoundError:
        logger.error(f"Error: Input file not found at {INPUT_PATH}")
        return
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        return

    _perform_initial_data_inspection(df)
    df = _perform_data_cleaning(df)
    _plot_credit_card_counts_by_bank(df, OUTPUT_DASH_DIR)
    
    df_processed, tags, benefit_tags = _process_nlp_features(df)
    
    all_tags = list(tags.keys()) + list(benefit_tags.keys())
    
    _generate_word_clouds(df_processed, stopwords, OUTPUT_DASH_DIR)
    _perform_tfidf_analysis(df_processed, stopwords)
    _plot_feature_benefit_distribution(df_processed, all_tags, OUTPUT_DASH_DIR)
    _plot_bank_wise_feature_benefit_distribution(df_processed, all_tags, OUTPUT_DASH_DIR)
    _save_processed_data(df_processed, OUTPUT_PROCESSED_PATH)

    # --- Qdrant Ingestion ---

    try:
        client, collection_name = _setup_qdrant_collection()
        total_inserted_points = _ingest_rows_as_points(df_processed, client, collection_name)
        logger.info(f"\n🎉 Qdrant Ingestion Complete!")
        logger.info(f"  - Total points inserted: {total_inserted_points}")
        logger.info(f"  - Total points in collection '{collection_name}': {client.count(collection_name).count}")
    except Exception as e:
        logger.error(f"Error during Qdrant ingestion: {e}")

    logger.info("\n--- Credit Card EDA Process Complete ---")

if __name__ == "__main__":
    main()