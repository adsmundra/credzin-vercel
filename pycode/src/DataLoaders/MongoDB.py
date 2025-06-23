from pymongo import MongoClient, errors
from utils.logger import configure_logging

logger = configure_logging("mongodb")

def mongodb_client():
    logger.info("Connecting to MongoDB to fetch data...")
    try:
        MONGO_URI = "mongodb+srv://Welzin:yYsuyoXrWcxPKmPV@welzin.1ln7rs4.mongodb.net/credzin?retryWrites=true&w=majority&appName=Welzin"
        myclient = MongoClient(MONGO_URI)
        myclient.admin.command('ping')
        logger.info("MongoDB connection successful.")
        db_name = "credzin"
        mydb = myclient[db_name]
        logger.info(f"Connected to MongoDB {mydb} database successfully.")
        return mydb
    except errors.ServerSelectionTimeoutError as e:
        logger.error(f"MongoDB server selection timeout: {e}")
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
    return None
