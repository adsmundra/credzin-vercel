from airflow import DAG
from airflow.operators.python import PythonOperator
import pendulum
import sys
import os
import subprocess
import logging

# Configure logging
logger = logging.getLogger(__name__)

def run_main_script():
    """
    Function to execute the main.py script
    """
    try:
        # Add the pycode directory to Python path
        pycode_path = '/app/pycode'
        if pycode_path not in sys.path:
            sys.path.insert(0, pycode_path)
        
        # Change working directory to pycode
        original_cwd = os.getcwd()
        os.chdir(pycode_path)
        
        logger.info(f"Changed working directory to: {os.getcwd()}")
        logger.info(f"Python path: {sys.path}")
        
        # Method 1: Try importing as module (recommended)
        try:
            logger.info("Attempting to import main module...")
            import main
            
            # If your main.py has a main() function, uncomment this:
            # if hasattr(main, 'main'):
            #     main.main()
            # else:
            #     logger.info("No main() function found, module imported successfully")
            
            logger.info("Main module imported and executed successfully")
            
        except ImportError as import_error:
            logger.warning(f"Import failed: {import_error}")
            logger.info("Falling back to exec method...")
            
            # Method 2: Execute the file directly
            main_file_path = os.path.join(pycode_path, 'main.py')
            
            if not os.path.exists(main_file_path):
                raise FileNotFoundError(f"main.py not found at {main_file_path}")
            
            with open(main_file_path, 'r') as file:
                script_content = file.read()
            
            # Execute the script content
            exec(script_content, {'__name__': '__main__'})
            logger.info("Script executed successfully using exec method")
        
        except Exception as exec_error:
            logger.error(f"Exec method failed: {exec_error}")
            
            # Method 3: Use subprocess as last resort
            logger.info("Falling back to subprocess method...")
            result = subprocess.run(
                [sys.executable, 'main.py'],
                cwd=pycode_path,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode == 0:
                logger.info("Script executed successfully using subprocess")
                logger.info(f"Script output: {result.stdout}")
            else:
                logger.error(f"Script failed with return code: {result.returncode}")
                logger.error(f"Error output: {result.stderr}")
                raise RuntimeError(f"Script execution failed: {result.stderr}")
    
    except Exception as e:
        logger.error(f"Error in run_main_script: {str(e)}")
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
    dirs_to_check = ['/app', '/app/pycode']
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
    
    # Check if main.py exists and is readable
    main_file = '/app/pycode/main.py'
    if os.path.exists(main_file):
        logger.info(f"main.py found at {main_file}")
        stat_info = os.stat(main_file)
        logger.info(f"File permissions: {oct(stat_info.st_mode)}")
        logger.info(f"File size: {stat_info.st_size} bytes")
    else:
        logger.error(f"main.py not found at {main_file}")

# DAG definition
with DAG(
    dag_id="daily_credit_card_scraper",
    start_date=pendulum.datetime(2024, 1, 1, tz="UTC"),
    schedule="@daily",
    catchup=False,
    tags=["scraping"],
    max_active_runs=1,  # Prevent overlapping runs
    default_args={
        "retries": 2,
        "retry_delay": pendulum.duration(minutes=5),
        "depends_on_past": False,
    },
    description="Daily credit card scraper DAG using PythonOperator",
) as dag:

    # Debug task (optional - remove in production)
    debug_task = PythonOperator(
        task_id="debug_environment",
        python_callable=debug_environment,
    )

    # Main scraper task
    run_scraper = PythonOperator(
        task_id="run_main_script",
        python_callable=run_main_script,
    )

    # Set task dependencies
    debug_task >> run_scraper

# If you want to skip the debug task in production, use this instead:
# run_scraper