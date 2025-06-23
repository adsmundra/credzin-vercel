"""
Runs Final_scrapper once a day.
"""
from airflow import DAG
from airflow.operators.python import PythonOperator
import pendulum

# Import the scraper.  Thanks to PYTHONPATH it resolves to:
# /app/pycode/src/scrapers/banks/Final_scrapper.py
from scrapers.banks import Final_scrapper


def run_final_scraper():
    """
    Wrapper that Airflow calls.  Your actual scraper
    logic stays inside Final_scrapper.py.
    """
    Final_scrapper.main()          # or whatever entry-point you expose


with DAG(
    dag_id="daily_final_scraper",
    start_date=pendulum.now("UTC"),   # first run = now, then @daily
    schedule="@daily",
    catchup=False,
    tags=["scraping"],
) as dag:

    PythonOperator(
        task_id="run_scraper",
        python_callable=run_final_scraper,
        retries=2,
    )
