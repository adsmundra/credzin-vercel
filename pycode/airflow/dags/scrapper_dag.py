from airflow import DAG
from airflow.operators.python import PythonOperator
import pendulum
import sys
import os
import logging

# Configure logging
logger = logging.getLogger(__name__)

def run_bank_scraper():
    """
    Function to execute the BankScrapper_V2 with Amex bank
    """
    try:
        # Add the pycode directory and src directory to Python path
        pycode_path = '/app/pycode'
        src_path = '/app/pycode/src'
        app_path = '/app'  # For KnowledgeBase access
        
        if pycode_path not in sys.path:
            sys.path.insert(0, pycode_path)
        if src_path not in sys.path:
            sys.path.insert(0, src_path)
        if app_path not in sys.path:
            sys.path.insert(0, app_path)
        
        # Change working directory to /app (important for KnowledgeBase relative paths)
        original_cwd = os.getcwd()
        os.chdir('/app')
        
        logger.info(f"Changed working directory to: {os.getcwd()}")
        logger.info(f"Python path: {sys.path}")
        
        # Import and run the bank scraper
        logger.info("Importing BankScrapper_V2 module...")
        from src.scrapers.banks.BankScrapper_V2 import run_bank_scrapers_v2
        
        # Run the scraper for Amex bank
        logger.info("Starting BankScrapper_V2 for Amex...")
        bank_names = ["Amex"]
        
        results = run_bank_scrapers_v2(bank_names)
        
        logger.info(f"BankScrapper_V2 completed successfully!")
        logger.info(f"Results: {results}")
        
        # Check if the operation was successful
        if results and results.get("Amex", {}).get("success", False):
            logger.info(f"✅ Amex processing successful - {results['Amex']['cards_processed']} cards processed")
        else:
            error_msg = results.get("Amex", {}).get("error", "Unknown error")
            logger.error(f"❌ Amex processing failed: {error_msg}")
            raise RuntimeError(f"BankScrapper_V2 failed for Amex: {error_msg}")
        
    except ImportError as import_error:
        logger.error(f"Import failed: {import_error}")
        logger.error("Make sure the file structure is correct:")
        logger.error("  /app/pycode/src/scrapers/banks/BankScrapper_V2.py")
        raise
    
    except Exception as e:
        logger.error(f"Error in run_bank_scraper: {str(e)}")
        raise
    
    finally:
        # Restore original working directory
        os.chdir(original_cwd)

def debug_environment():
    """
    Debug function to check environment and file system
    """
    logger.info("=== Environment Debug Information ===")
    logger.info(f"Current working directory: {os.getcwd()}")
    logger.info(f"Python executable: {sys.executable}")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Python path: {sys.path}")
    
    # Check if directories exist
    dirs_to_check = [
        '/app', 
        '/app/pycode',
        '/app/pycode/src',
        '/app/pycode/src/utils',
        '/app/pycode/src/scrapers',
        '/app/pycode/src/scrapers/banks',
        '/app/KnowledgeBase',
        '/app/KnowledgeBase/StructuredCardsData'
    ]
    
    for dir_path in dirs_to_check:
        if os.path.exists(dir_path):
            logger.info(f"Directory {dir_path} exists")
            try:
                contents = os.listdir(dir_path)
                logger.info(f"Contents of {dir_path}: {contents}")
            except PermissionError:
                logger.warning(f"Permission denied accessing {dir_path}")
        else:
            logger.error(f"Directory {dir_path} does not exist")
    
    # Check if BankScrapper_V2.py exists and is readable
    scraper_file = '/app/pycode/src/scrapers/banks/BankScrapper_V2.py'
    if os.path.exists(scraper_file):
        logger.info(f"BankScrapper_V2.py found at {scraper_file}")
        stat_info = os.stat(scraper_file)
        logger.info(f"File permissions: {oct(stat_info.st_mode)}")
        logger.info(f"File size: {stat_info.st_size} bytes")
    else:
        logger.error(f"BankScrapper_V2.py not found at {scraper_file}")
    
    # Check if required dependencies exist
    excel_file = '/app/KnowledgeBase/StructuredCardsData/credit_card_details.xlsx'
    if os.path.exists(excel_file):
        logger.info(f"Excel file found at {excel_file}")
    else:
        logger.error(f"Excel file not found at {excel_file}")
    
    # Check utils files
    utils_files = [
        '/app/pycode/src/utils/logger.py',
        '/app/pycode/src/utils/utilities.py'
    ]
    
    for util_file in utils_files:
        if os.path.exists(util_file):
            logger.info(f"Utils file found: {util_file}")
        else:
            logger.error(f"Utils file not found: {util_file}")

# DAG definition
with DAG(
    dag_id="amex_credit_card_scraper",
    start_date=pendulum.datetime(2024, 1, 1, tz="UTC"),
    schedule="@daily",
    catchup=False,
    tags=["scraping", "amex", "credit-cards"],
    max_active_runs=1,  # Prevent overlapping runs
    default_args={
        "retries": 2,
        "retry_delay": pendulum.duration(minutes=5),
        "depends_on_past": False,
    },
    description="Daily Amex credit card scraper using BankScrapper_V2",
) as dag:

    # Debug task (optional - remove in production)
    debug_task = PythonOperator(
        task_id="debug_environment",
        python_callable=debug_environment,
    )

    # Main scraper task
    run_scraper = PythonOperator(
        task_id="run_amex_scraper",
        python_callable=run_bank_scraper,
    )

    # Set task dependencies
    debug_task >> run_scraper

# If you want to skip the debug task in production, use this instead:
# run_scraper