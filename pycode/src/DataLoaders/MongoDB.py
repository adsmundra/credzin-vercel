from pymongo import MongoClient, errors
from src.utils.utils import logger


def mongodb_client():
    logger.info("Connecting to MongoDB to fetch data...")

    try:
        MONGO_URI = "mongodb+srv://Welzin:yYsuyoXrWcxPKmPV@welzin.1ln7rs4.mongodb.net/credzin?retryWrites=true&w=majority&appName=Welzin"
        myclient = MongoClient(MONGO_URI)

        # Ping to test connection
        myclient.admin.command('ping')
        logger.info("MongoDB connection successful.")

        # Connect to the database
        db_name = "credzin"        
        mydb = myclient[db_name]

        logger.info(f"Connected to MongoDB {mydb} database successfully.")
        return True

        # Define collection names
        # collection_user = "users"       
        # collection_credit_card = "credit_cards"
        # collection_recommendation = "recommendations

        # mycol_user = mydb[collection_user]
        # mycol_credit_card = mydb[collection_credit_card]
        # mycol_recommendation = mydb[collection_recommendation]
        # df_users = pd.DataFrame(list(mycol_user.find()))
        # df_credit_cards = pd.DataFrame(list(mycol_credit_card.find()))
        # df_recommendations = pd.DataFrame(list(mycol_recommendation.find()))
       
    except errors.ServerSelectionTimeoutError as e:
        logger.error("MongoDB server selection timeout: %s", e)
        print("Server selection timeout:", e)
    except Exception as e:
        logger.error("Error connecting to MongoDB: %s", e)
        print("Error connecting to MongoDB:", e)

    return False  # Return failure flag
