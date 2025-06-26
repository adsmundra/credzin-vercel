
import pandas as pd
import numpy as np
import os
import matplotlib.cm as cm
import matplotlib.pyplot as plt

import re
import nltk
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
import spacy





# import PyPDF2
from pathlib import Path
import time
from typing import Optional, List
from qdrant_client.models import PointStruct, SparseVector, VectorParams, Distance, SparseVectorParams
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

from agno.knowledge.langchain import LangChainKnowledgeBase
import gradio as gr
from langchain_qdrant import Qdrant
from langchain_huggingface import HuggingFaceEmbeddings
from agno.agent import Agent
from agno.models.ollama import Ollama
from agno.tools.reasoning import ReasoningTools

import asyncio
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_qdrant import QdrantVectorStore, RetrievalMode
from langchain_qdrant import FastEmbedSparse

from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# from DataLoaders.QdrantDB import qdrantdb_client

from utils.logger import configure_logging
from utils.utilities import setup_env

# Decide Run mode
setup_env()

logger = configure_logging("CreditCardIngestion")

# featuretools for automated feature engineering
import featuretools as ft

# ignore warnings from pandas
import warnings
warnings.filterwarnings("ignore", category=UserWarning, message="pkg_resources is deprecated")


def load_csv_files(parent_dir, target_filename):
    all_dfs = []
    
    # Walk through the directory structure
    for root, dirs, files in os.walk(parent_dir):
        # Check if the current directory is a 'csv' folder
        if os.path.basename(root) == 'csv':
            for file in files:
                # Check if the file matches the target filename and is a CSV
                if file == target_filename and file.endswith('.csv'):
                    file_path = os.path.join(root, file)
                    try:
                        # Read the CSV file
                        df = pd.read_csv(file_path)
                        all_dfs.append(df)
                        logger.info(f"Loaded: {file_path}")
                    except Exception as e:
                        logger.error(f"Error reading {file_path}: {e}")
    
    # Concatenate all DataFrames, ignoring index
    if all_dfs:
        combined_df = pd.concat(all_dfs, ignore_index=True)
        return combined_df
    else:
        raise ValueError(f"No CSV files named '{target_filename}' found in the 'csv' directories.")

# Specify the parent directory and target filename
parent_directory = 'KnowledgeBase/banks'
target_filename = 'credit_card_details_v2.csv' 

# Load all CSV files with the specific name into a single DataFrame
combined_df = load_csv_files(parent_directory, target_filename)

# Preview result
logger.info(combined_df.shape)
logger.info(combined_df.head())

# Group data by bank name and count credit cards
bank_counts = combined_df.groupby('bank_name')['card_name'].count().reset_index()


'''
This is use for creating the graphs {no. of credit card V/S the bank name}
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
plt.show()
'''

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

logger.info(df_features.shape)
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

logger.info(df_benefits.shape)
logger.info(df_benefits.sample(3))
logger.info(df_benefits.columns)

# Ensure the output directory exists
output_dir = 'KnowledgeBase/StructuredCardsData'
os.makedirs(output_dir, exist_ok=True)


# Save the final DataFrame to a single CSV file (append if exists)
csv_path = os.path.join(output_dir, 'cc_feats_V2.csv')
if os.path.exists(csv_path):
    # Read existing CSV to check columns
    existing_df = pd.read_csv(csv_path)
    if set(existing_df.columns) == set(df_benefits.columns):
        # Append without headers if columns match
        df_benefits.to_csv(csv_path, mode='a', header=False, index=False)
        logger.info(f"Appended to existing CSV at {csv_path}")
    else:
        logger.warning(f"Warning: Column mismatch with existing CSV at {csv_path}. Overwriting instead.")
        df_benefits.to_csv(csv_path, index=False)
        logger.info(f"DataFrame saved to {csv_path} (overwritten due to column mismatch)")
else:
    # Create new CSV if it doesn't exist
    df_benefits.to_csv(csv_path, index=False)
    logger.info(f"DataFrame saved to new CSV at {csv_path}")

# Save each bank's data to separate sheets in an Excel file (overwrite)
excel_path = os.path.join(output_dir, 'credit_card_details_V2.xlsx')
with pd.ExcelWriter(excel_path, engine='xlsxwriter') as writer:
    for bank in df_benefits['bank_name'].unique():
        # Filter data for the current bank
        bank_df = df_benefits[df_benefits['bank_name'] == bank]
        # Clean sheet name: replace invalid chars, truncate to 31 chars
        sheet_name = re.sub(r'[\\\/:*?"<>|]', '_', bank)[:31]
        # Save to a sheet named after the bank
        bank_df.to_excel(writer, sheet_name=sheet_name, index=False)
logger.info(f"DataFrame saved to Excel with bank sheets at {excel_path}")


# qdrantdb 

os.environ["QDRANT_API_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.SsEx9xbs-jY9DjYKrmyGatbRchqs3vQ4lbfF0vS5M4A"
os.environ["QDRANT_URL"] = "https://76d501b6-b754-42c1-a4da-9e0bc8cca319.us-east4-0.gcp.cloud.qdrant.io:6333/"

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

COLLECTION_NAME = "test_knowledge_base"

# Folder paths
CSV_FOLDER = "KnowledgeBase/StructuredCardsData/cc_feats_V2.csv"

# Initialize clients
logger.info(" Initializing system...")
client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
embedding_model = SentenceTransformer('BAAI/bge-large-en-v1.5', trust_remote_code=True)

# Text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=768,
    chunk_overlap=128,
    length_function=len,
    separators=["\n\n", "\n", " ", ""]
)

sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")

def setup_collection():
    """Create or verify Qdrant collection"""
    try:
        collection_info = client.get_collection(COLLECTION_NAME)
        has_dense_config = "vector" in collection_info.config.vectors_config.config_by_name
        has_sparse_config = "sparse_vector" in collection_info.config.vectors_config.config_by_name

        if has_dense_config and has_sparse_config:
            logger.error(f"Collection '{COLLECTION_NAME}' already exists with dense and sparse vector configurations.")
            create_new_collection = False
        else:
            logger.info(f"Collection '{COLLECTION_NAME}' exists but needs update for hybrid search. Recreating...")
            client.delete_collection(collection_name=COLLECTION_NAME)
            create_new_collection = True

    except:
        logger.info(f"Collection '{COLLECTION_NAME}' not found. Creating a new one for hybrid search.")
        create_new_collection = True

    if create_new_collection:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config={
                "vector": VectorParams(size=1024, distance=Distance.COSINE)  # Must match model output: 1536
            },
            sparse_vectors_config={
                "sparse-vector": SparseVectorParams()
            }
        )
        logger.info(f"Created collection '{COLLECTION_NAME}' with dense and sparse vector configurations.")

def extract_csv_documents(csv_input):
# Extract CSV documents keeping only first 6 columns as metadata, rest in content
    documents = []

    try:
        if isinstance(csv_input, str):
            logger.info(f"Processing CSV file: {csv_input}")
            df = pd.read_csv(csv_input)
            filename = os.path.basename(csv_input)
        elif isinstance(csv_input, pd.DataFrame):
            logger.info("Processing provided DataFrame")
            df = csv_input
            filename = "input_dataframe.csv"
        else:
            logger.error("Error: csv_input must be a file path (str) or pandas DataFrame")
            return documents
    except Exception as e:
        logger.error(f"Error reading CSV: {e}")
        return documents

    # Decide how many credit_card you want to push into QdrantDB
    # df = df.head(10)
    # logger.info(f"Limited to first {len(df)} rows")

    # Ensure columns exist
    for col in ["card_name", "bank_name"]:
        if col not in df.columns:
            df[col] = "Unknown"

    # Set which columns go into metadata
    primary_columns = ["bank_name", "card_name"]

    for idx, row in df.iterrows():
        card_name = row.get("card_name", "Unknown") or "Unknown"
        bank_name = row.get("bank_name", "Unknown") or "Unknown"

        # Build metadata with only primary columns
        metadata = {
            "source": filename,
            "type": "csv",
            "filename": filename,
            "row_index": idx + 1,
            "card_name": card_name,
            "bank_name": bank_name,
        }

        for col in primary_columns:
            if col not in ["card_name", "bank_name"]:
                metadata[col] = row.get(col, None) if pd.notna(row.get(col)) else None

        # All other fields go to content
        other_parts = [f"{col}={val}" for col, val in row.items()
                       if col not in primary_columns and pd.notna(val)]
        card_text = f"Card: {card_name} by {bank_name}\n" + " | ".join(other_parts)

        doc = Document(
            page_content=card_text,
            metadata=metadata
        )
        documents.append(doc)

    logger.info(f"Extracted {len(documents)} documents from CSV")
    return documents


def chunk_documents(documents):
    """Split documents into chunks"""
    logger.info(f"Splitting {len(documents)} documents into chunks...")
    all_chunks = []

    for doc in documents:
        chunks = text_splitter.split_documents([doc])
        all_chunks.extend(chunks)

    logger.info(f"Created {len(all_chunks)} chunks")
    return all_chunks


def insert_chunks(chunks, batch_size=10):
    total_inserted = 0
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]

        dense_embeddings = embedding_model.encode(
            [f"passage: {c.page_content}" for c in batch],
            normalize_embeddings=True,
            show_progress_bar=False
        )
        sparse_embs = sparse_embeddings.embed_documents([c.page_content for c in batch])

        points = []
        for j, chunk in enumerate(batch):
            dense_vec = dense_embeddings[j].tolist()
            se = sparse_embs[j]

            # This is the corrected section
            point = PointStruct(
                id=i + j,
                vector={
                    "vector": dense_vec,
                    "sparse-vector": SparseVector(
                        # Removed .tolist() from the next two lines
                        indices=se.indices,
                        values=se.values
                    )
                },
                payload={
                    "content": chunk.page_content,
                    "source": chunk.metadata.get("source", ""),
                    "type": chunk.metadata.get("type", ""),
                    "filename": chunk.metadata.get("filename", ""),
                    "chunk_id": i + j,
                    "metadata": chunk.metadata,
                    "card_name": chunk.metadata.get("card_name", "Unknown"),
                    "bank_name": chunk.metadata.get("bank_name", "Unknown")
                }
            )
            points.append(point)

        client.upsert(collection_name=COLLECTION_NAME, points=points, wait=True)
        total_inserted += len(points)
        logger.info(f"Inserted batch {i//batch_size + 1}, total so far {total_inserted}")
        time.sleep(0.1)

    return total_inserted


def get_collection_stats():
    """Get collection statistics"""
    try:
        count = client.count(COLLECTION_NAME)
        return count.count
    except:
        return 0

def main(csv_input):
    """Main ingestion process"""
    logger.info("🚀 Starting Document Ingestion Process")
    logger.info("=" * 50)

    # Setup collection
    setup_collection()

    # Extract documents from all folders
    logger.info("\n📂 Extracting documents...")

    # Extract CSVs
    csv_docs = extract_csv_documents(csv_input)    

    if not csv_docs:
        logger.error("❌ No documents found! Please check your folder structure.")
        return

    logger.info(f"\n📊 Summary:")
    logger.info(f"  - CSVs: {len(csv_docs)} files")

    # Chunk documents
    chunks = chunk_documents(csv_docs)

    # Insert into Qdrant
    total_inserted = insert_chunks(chunks)

    # Final stats
    logger.info(f"\n🎉 Ingestion Complete!")
    logger.info(f"  - Documents processed: {len(csv_docs)}")
    logger.info(f"  - Chunks created: {len(chunks)}")
    logger.info(f"  - Successfully inserted: {total_inserted}")
    logger.info(f"  - Total in collection: {get_collection_stats()}")

if __name__ == "__main__":
    csv_file = "KnowledgeBase/StructuredCardsData/cc_feats_V2.csv"
    main(csv_file)
