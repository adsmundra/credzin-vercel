import pandas as pd
import numpy as np
import os
import matplotlib.cm as cm
import matplotlib.pyplot as plt
import re
import time
from qdrant_client.models import PointStruct, SparseVector, VectorParams, Distance, SparseVectorParams
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_qdrant import FastEmbedSparse

from utils.logger import configure_logging
from utils.utilities import setup_env

# featuretools for automated feature engineering
import featuretools as ft

# ignore warnings from pandas
import warnings

# Setup environment and logger
setup_env()
logger = configure_logging("CreditCardIngestion")

#warnings.filterwarnings("ignore", category=UserWarning, message="pkg_resources is deprecated")


def load_and_combine_csv(parent_dir, target_filename):
    """Load and combine CSV files from specified directory."""
    all_dfs = []
    for root, dirs, files in os.walk(parent_dir):
        if os.path.basename(root) == 'csv':
            for file in files:
                if file == target_filename and file.endswith('.csv'):
                    file_path = os.path.join(root, file)
                    try:
                        df = pd.read_csv(file_path)
                        all_dfs.append(df)
                        logger.info(f"Loaded: {file_path}")
                    except Exception as e:
                        logger.error(f"Error reading {file_path}: {e}")
    
    if all_dfs:
        combined_df = pd.concat(all_dfs, ignore_index=True)
        logger.info(f"Combined DataFrame shape: {combined_df.shape}")
        # Clean special characters from card_name
        if 'card_name' in combined_df.columns:
            combined_df['card_name'] = combined_df['card_name'].astype(str).apply(lambda x: re.sub(r'[^a-zA-Z0-9\s]', '', x))
            logger.info("Cleaned special characters from card_name")
        # Remove duplicate rows based on card_name
        combined_df = combined_df.drop_duplicates(subset=['card_name'])
        logger.info(f"After removing duplicates by card_name, shape: {combined_df.shape}")
        return combined_df
    else:
        raise ValueError(f"No CSV files named '{target_filename}' found in the 'csv' directories.")

def process_features_and_benefits(df):
    """Process features and rewards columns to extract tags."""
    # Copy DataFrame for processing
    df_features = df.copy()
    
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

    logger.info(f"Processed DataFrame shape: {df_features.shape}")
    return df_features

def save_processed_data(df, output_dir='KnowledgeBase/StructuredCardsData'):
    """Save processed DataFrame to CSV and Excel files."""
    os.makedirs(output_dir, exist_ok=True)
    
    # Save to CSV
    csv_path = os.path.join(output_dir, 'cc_feats_V2.csv')
    if os.path.exists(csv_path):
        existing_df = pd.read_csv(csv_path)
        if set(existing_df.columns) == set(df.columns):
            df.to_csv(csv_path, mode='a', header=False, index=False)
            logger.info(f"Appended to existing CSV at {csv_path}")
        else:
            logger.warning(f"Warning: Column mismatch with existing CSV at {csv_path}. Overwriting instead.")
            df.to_csv(csv_path, index=False)
            logger.info(f"DataFrame saved to {csv_path} (overwritten due to column mismatch)")
    else:
        df.to_csv(csv_path, index=False)
        logger.info(f"DataFrame saved to new CSV at {csv_path}")
    
    # # Save to Excel with separate sheets per bank
    # excel_path = os.path.join(output_dir, 'credit_card_details_V2.xlsx')
    # with pd.ExcelWriter(excel_path, engine='xlsxwriter') as writer:
    #     for bank in df['bank_name'].unique():
    #         bank_df = df[df['bank_name'] == bank]
    #         sheet_name = re.sub(r'[\\\/:*?"<>|]', '_', bank)[:31]
    #         bank_df.to_excel(writer, sheet_name=sheet_name, index=False)
    # logger.info(f"DataFrame saved to Excel with bank sheets at {excel_path}")


def setup_qdrant_collection():
    """Setup or verify Qdrant collection for hybrid search."""
    QDRANT_URL = os.getenv("QDRANT_URL")
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
    COLLECTION_NAME = "Credit_card_V2_remake"
    
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    
    try:
        collection_info = client.get_collection(COLLECTION_NAME)
        has_dense_config = "vector" in collection_info.config.vectors_config.config_by_name
        has_sparse_config = "sparse_vector" in collection_info.config.vectors_config.config_by_name

        if has_dense_config and has_sparse_config:
            logger.info(f"Collection '{COLLECTION_NAME}' already exists with correct configuration.")
        else:
            logger.info(f"Collection '{COLLECTION_NAME}' exists but needs update. Recreating...")
            client.delete_collection(collection_name=COLLECTION_NAME)
            create_new_collection = True
    except:
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
    
    return client, COLLECTION_NAME

'''
THIS PART IS USE FOR THE CONVERTING THE CSV INTO CHUNKS AND THEN PUSH IT INTO Qdrant DB

def ingest_to_qdrant(df, client, collection_name):
    """Ingest processed data into Qdrant."""
    embedding_model = SentenceTransformer('BAAI/bge-large-en-v1.5', trust_remote_code=True)
    sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=256,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    # Extract documents
    def extract_csv_documents(df):
        documents = []
        filename = "processed_dataframe.csv"
        for idx, row in df.iterrows():
            card_name = row.get("card_name", "Unknown") or "Unknown"
            bank_name = row.get("bank_name", "Unknown") or "Unknown"
            metadata = {
                "source": filename,
                "type": "csv",
                "filename": filename,
                "row_index": idx + 1,
                "card_name": card_name,
                "bank_name": bank_name,
            }
            primary_columns = ["bank_name", "card_name"]
            for col in primary_columns:
                if col not in ["card_name", "bank_name"]:
                    metadata[col] = row.get(col, None) if pd.notna(row.get(col)) else None
            other_parts = [f"{col}={val}" for col, val in row.items()
                           if col not in primary_columns and pd.notna(val)]
            card_text = f"Card: {card_name} by {bank_name}\n" + " | ".join(other_parts)
            doc = Document(page_content=card_text, metadata=metadata)
            documents.append(doc)
        logger.info(f"Extracted {len(documents)} documents from DataFrame")
        return documents
    
    # Chunk documents
    def chunk_documents(documents):
        logger.info(f"Splitting {len(documents)} documents into chunks...")
        chunks = text_splitter.split_documents(documents)
        logger.info(f"Created {len(chunks)} chunks")
        return chunks
    
    # Insert chunks
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
                point = PointStruct(
                    id=i + j,
                    vector={
                        "vector": dense_vec,
                        "sparse-vector": SparseVector(indices=se.indices, values=se.values)
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
            client.upsert(collection_name=collection_name, points=points, wait=True)
            total_inserted += len(points)
            logger.info(f"Inserted batch {i//batch_size + 1}, total so far {total_inserted}")
            time.sleep(0.1)
        return total_inserted
    
    documents = extract_csv_documents(df)
    if not documents:
        logger.error("No documents extracted for Qdrant ingestion")
        return 0
    chunks = chunk_documents(documents)
    total_inserted = insert_chunks(chunks)
    return total_inserted

def orchestrate_ingestion(csv_input):
    """Orchestrate the entire ingestion process."""
    logger.info("🚀 Starting Document Ingestion Process")
    logger.info("=" * 50)
    
    # Step 1: Load and combine CSV files
    parent_directory = 'KnowledgeBase/banks'
    target_filename = 'credit_card_details_v2.csv'
    combined_df = load_and_combine_csv(parent_directory, target_filename)
    
    # Step 2: Process features and benefits
    processed_df = process_features_and_benefits(combined_df)
    
    # Step 3: Save processed data
    save_processed_data(processed_df)
    
    # Step 4: Setup Qdrant collection
    client, collection_name = setup_qdrant_collection()
    
    # Step 5: Ingest to Qdrant
    total_inserted = ingest_to_qdrant(processed_df, client, collection_name)
    
    # Final stats
    logger.info(f"\n🎉 Ingestion Complete!")
    logger.info(f"  - Documents processed: {len(processed_df)}")
    logger.info(f"  - Chunks inserted: {total_inserted}")
    logger.info(f"  - Total in collection: {client.count(collection_name).count}")

def main(csv_input):
    """Main function to initiate the ingestion process."""
    os.environ["QDRANT_API_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.SsEx9xbs-jY9DjYKrmyGatbRchqs3vQ4lbfF0vS5M4A"
    os.environ["QDRANT_URL"] = "https://76d501b6-b754-42c1-a4da-9e0bc8cca319.us-east4-0.gcp.cloud.qdrant.io:6333/"
    
    orchestrate_ingestion(csv_input)

if __name__ == "__main__":
    csv_file = "KnowledgeBase/StructuredCardsData/cc_feats_V2.csv"
    main(csv_file)
'''  

# THIS PART IS USE FOR THE PUSHING THE DATA INTO Qdrant DB WITHOUT PUTTING IT INTO CHUNKS
# ONE ROW OF THE CSV REPRESNTS THE ONE POINT IN THE Qdrant DB

def ingest_to_qdrant(csv_path, client, collection_name):
    """Ingest each CSV row as a single point into Qdrant."""
    embedding_model = SentenceTransformer('BAAI/bge-large-en-v1.5', trust_remote_code=True)
    sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")
    
    # Read CSV
    try:
        df = pd.read_csv(csv_path)
        # df = df.head(10)  # Limit to first 10 cards
        logger.info(f"Loaded CSV: {csv_path}, shape: {df.shape}")
    except Exception as e:
        logger.error(f"Error reading CSV {csv_path}: {e}")
        return 0
    
    # Extract documents (one per row)
    def extract_csv_documents(df):
        documents = []
        filename = os.path.basename(csv_path)
        for idx, row in df.iterrows():
            card_name = row.get("card_name", "Unknown") or "Unknown"
            bank_name = row.get("bank_name", "Unknown") or "Unknown"
            metadata = {
                "source": filename,
                "type": "csv",
                "filename": filename,
                "row_index": idx + 1,
                "card_name": card_name,
                "bank_name": bank_name,
            }
            primary_columns = ["bank_name", "card_name"]
            for col in primary_columns:
                if col not in ["card_name", "bank_name"]:
                    metadata[col] = row.get(col, None) if pd.notna(row.get(col)) else None
            other_parts = [f"{col}={val}" for col, val in row.items()
                           if col not in primary_columns and pd.notna(val)]
            card_text = f"Card: {card_name} by {bank_name}\n" + " | ".join(other_parts)
            doc = Document(page_content=card_text, metadata=metadata)
            documents.append(doc)
        logger.info(f"Extracted {len(documents)} documents from CSV")
        return documents
    
    # Insert documents as single points
    def insert_documents(documents, batch_size=10):
        total_inserted = 0
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i+batch_size]
            dense_embeddings = embedding_model.encode(
                [f"passage: {doc.page_content}" for doc in batch],
                normalize_embeddings=True,
                show_progress_bar=False
            )
            sparse_embs = sparse_embeddings.embed_documents([doc.page_content for doc in batch])
            points = []
            for j, doc in enumerate(batch):
                dense_vec = dense_embeddings[j].tolist()
                se = sparse_embs[j]
                point = PointStruct(
                    id=i + j,
                    vector={
                        "vector": dense_vec,
                        "sparse-vector": SparseVector(indices=se.indices, values=se.values)
                    },
                    payload={
                        "content": doc.page_content,
                        "source": doc.metadata.get("source", ""),
                        "type": doc.metadata.get("type", ""),
                        "filename": doc.metadata.get("filename", ""),
                        "row_index": doc.metadata.get("row_index", 0),
                        "metadata": doc.metadata,
                        "card_name": doc.metadata.get("card_name", "Unknown"),
                        "bank_name": doc.metadata.get("bank_name", "Unknown")
                    }
                )
                points.append(point)
            client.upsert(collection_name=collection_name, points=points, wait=True)
            total_inserted += len(points)
            logger.info(f"Inserted batch {i//batch_size + 1}, total so far {total_inserted}")
            time.sleep(0.1)
        return total_inserted
    
    documents = extract_csv_documents(df)
    if not documents:
        logger.error("No documents extracted for Qdrant ingestion")
        return 0
    total_inserted = insert_documents(documents)
    return total_inserted

def orchestrate_ingestion(csv_input):
    """Orchestrate the QdrantDB ingestion process."""
    logger.info("🚀 Starting Document Ingestion Process")
    logger.info("=" * 50)
    
    # Step 1: Load and combine CSV files
    parent_directory = 'KnowledgeBase/banks'
    target_filename = 'credit_card_details_v2.csv'
    combined_df = load_and_combine_csv(parent_directory, target_filename)
    
    # Step 2: Process features and benefits
    processed_df = process_features_and_benefits(combined_df)
    
    # Step 3: Save processed data
    save_processed_data(processed_df)
    
    # Step 4: Setup Qdrant collection
    client, collection_name = setup_qdrant_collection()
    
    # Step 5: Ingest to Qdrant
    total_inserted = ingest_to_qdrant(csv_input, client, collection_name)
    
    # Final stats
    logger.info(f"\n🎉 Ingestion Complete!")
    logger.info(f"  - Points inserted: {total_inserted}")
    logger.info(f"  - Total in collection: {client.count(collection_name).count}")

def main(csv_input):
    """Main function to initiate the ingestion process."""
    os.environ["QDRANT_API_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.SsEx9xbs-jY9DjYKrmyGatbRchqs3vQ4lbfF0vS5M4A"
    os.environ["QDRANT_URL"] = "https://76d501b6-b754-42c1-a4da-9e0bc8cca319.us-east4-0.gcp.cloud.qdrant.io:6333/"
    
    orchestrate_ingestion(csv_input)

if __name__ == "__main__":
    csv_file = "KnowledgeBase/StructuredCardsData/cc_feats_V2.csv"
    main(csv_file)