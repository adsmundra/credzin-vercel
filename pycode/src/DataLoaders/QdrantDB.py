import os
from qdrant_client import QdrantClient
from src.utils.utils import logger

def qdrantdb_client():
    logger.info("Connecting to QdrantDB ...")

    try:
        os.environ["QDRANT_API_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.SsEx9xbs-jY9DjYKrmyGatbRchqs3vQ4lbfF0vS5M4A"
        os.environ["QDRANT_URL"] = "https://76d501b6-b754-42c1-a4da-9e0bc8cca319.us-east4-0.gcp.cloud.qdrant.io:6333/"

        QDRANT_URL = os.getenv("QDRANT_URL")
        QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
        
        qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        
        logger.info("QdrantDB connection successful.")
        return qdrant_client

    except Exception as e:
        logger.error("Error connecting to QdrantDB: %s", e)
        print("Error connecting to QdrantDB:", e)
        return False  # Return failure flag
