# from src.Recommender.LangGraphNodes.build_graph import card_graph
from src.utils.logger import logger
# from src.Scrapers.banks import AxisBankScraper, ICICIBankScraper, SBIBankScraper
# from src.Scrapers.sites import CardInsiderScraper
from src.scrapers.banks.BankScrapper_V2 import firecrawl_scraper
import os
import pandas as pd
import sys
from typing import List, Dict

def get_card_info_from_excel(excel_path: str, bank_name: str) -> List[Dict[str, str]]:
    """
    Return a list of dicts with card_name and card_image_url (if available).

    Supports both 'card_image_url' and 'image_url' column names.

    Args:
        excel_path: Path to the workbook that has a sheet per bank.
        bank_name: Target bank (worksheet name, case-sensitive).

    Returns:
        A list like [{"card_name": "Magnus", "card_image_url": "https://…"}, …]
        If image URL column is not found, it will default to an empty string.
    """
    logger.info("Reading the Excel workbook to fetch card names & image URLs …")

    try:
        xl = pd.ExcelFile(excel_path)
        if bank_name not in xl.sheet_names:
            logger.warning("No worksheet found for bank: %s", bank_name)
            return []

        df = pd.read_excel(excel_path, sheet_name=bank_name)

        # Normalize column names to lowercase for easier matching
        df.columns = [col.strip().lower() for col in df.columns]

        # Determine which image column to use
        image_col = None
        if "card_image_url" in df.columns:
            image_col = "card_image_url"
        elif "image_url" in df.columns:
            image_col = "image_url"
        else:
            logger.warning("No image URL column found in worksheet: %s", bank_name)

        if "card_name" not in df.columns:
            logger.warning("Worksheet '%s' is missing 'card_name' column.", bank_name)
            return []

        # Extract only needed columns
        selected_cols = ["card_name"] + ([image_col] if image_col else [])
        card_info_df = df[selected_cols].dropna(subset=["card_name"]).fillna("")

        # Ensure uniform key for image URL
        if image_col and image_col != "card_image_url":
            card_info_df.rename(columns={image_col: "card_image_url"}, inplace=True)

        return card_info_df.to_dict("records")

    except Exception as exc:
        logger.error("Error reading Excel for %s: %s", bank_name, exc)
        return []

def run_bank_scrapers_new(bank_name, card_info, EXCEL_PATH):
    '''
    Func:
        run final_scrapper for the bank credit_card details
    
    Args: 
        df: read str from the input path
    '''
    logger.info("Starting credit card scraping process (NEW) ...")
    # firecrawl_scraper(df)
    # Run Firecrawl scraper
    firecrawl_scraper(bank_name, card_info, EXCEL_PATH)


def run_bank_scrapers(bank_names):
    """
    Run scrapers for the specified banks.
    
    Args:
        bank_names (list): List of bank names to scrape (e.g., ['axis', 'sbi', 'icici'])
    """
    logger.info("Starting credit card scraping process...")
    
    # Map bank names to their respective scrapers
    bank_scrapers = {
        'axis': AxisBankScraper,
        'sbi': SBIBankScraper,
        'icici': ICICIBankScraper
    }
    # Run bank-specific scrapers
    for bank in bank_names:
        bank = bank.lower()
        if bank in bank_scrapers:
            logger.info(f"Running scraper for {bank.upper()} Bank...")
            try:
                scraper = bank_scrapers[bank]()
                scraper.scrape()
                logger.info(f"✅ Successfully completed scraping for {bank.upper()} Bank")
            except Exception as e:
                logger.error(f"❌ Error scraping {bank.upper()} Bank: {str(e)}")
        else:
            logger.warning(f"⚠️ No scraper found for {bank.upper()} Bank")
    
    logger.info("✅✅ Credit card scraping process completed for all the banks!")


def run_site_scrapers(site_names):
    """
    Run scrapers for the specified sites.
    
    Args:
        site_names (list): List of site names to scrape (e.g., ['cardinsider'])
    """
    
    # Map site names to their respective scrapers
    site_scrapers = {
        'cardinsider': CardInsiderScraper
    }

    for site in site_names:
        site = site.lower()
        if site in site_scrapers:
            if site == 'cardinsider':
                # Run CardInsider scraper for all banks
                logger.info("Running CardInsider scraper...")
                bank_names = ['axis', 'sbi', 'icici']
                try:
                    card_insider = CardInsiderScraper()
                    card_insider.scrape(bank_names)
                    logger.info("Successfully completed CardInsider scraping")
                except Exception as e:
                    logger.error(f"Error in CardInsider scraping: {str(e)}")    

    logger.info("✅✅ Site scraping process completed!")


if __name__ == "__main__":
    
    try:
        logger.info("Running main function …")

        EXCEL_PATH = "KnowledgeBase/StructuredCardsData/credit_card_details.xlsx"

        BANK_NAMES = ["Amex"]

        if not BANK_NAMES:
            logger.error("bank_names must be a non‑empty list")
            sys.exit(0)

        for bank_name in BANK_NAMES:
            if not isinstance(bank_name, str) or not bank_name.strip():
                logger.warning("Skipping invalid bank name: %s", bank_name)
                continue

            bank_name = bank_name.strip()
            logger.info("\nProcessing bank: %s", bank_name)

            card_info = get_card_info_from_excel(EXCEL_PATH, bank_name)

            # # For printing card name and image url's
            # for idx, card in enumerate(card_info, start=1):
            #     name = card.get("card_name", "[NO NAME]")
            #     img_url = card.get("card_image_url", "[NO URL]")
            #     print(f"{idx}. Card: {name}\n   Image URL: {img_url}")

            if not card_info:
                logger.warning("No card data found for bank %s", bank_name)
                continue

            card_names = [item["card_name"] for item in card_info]
            logger.info("Found %d cards for %s: %s", len(card_names), bank_name, card_names)

            run_bank_scrapers_new(bank_name, card_info, EXCEL_PATH)

    except Exception as exc:
        logger.critical("Critical error in the main process: %s", exc)
    
        '''
        # List of banks to scrape
        banks_to_scrape = ['axis', 'sbi', 'icici']
        run_bank_scrapers(banks_to_scrape)

        # List of sites to scrape
        sites_to_scrape = ['cardinsider']
        run_site_scrapers(sites_to_scrape)
        

        graph = card_graph()
        logger.info("Graph created successfully.")

        # Show the graph structure 
        graph.show_graph()
        graph.show_graph_as_picture()

        # Read all files under resources/case_files
        case_files_dir = '/Users/aman/Welzin/Dev/credzin/KnowledgeBase/banks/AxisBank/csv/'
        if not os.path.exists(case_files_dir):
            logger.error(f"Data files directory does not exist: {case_files_dir}")
            raise FileNotFoundError(f"Directory not found: {case_files_dir}")

        case_files = [os.path.join(case_files_dir, f) for f in os.listdir(case_files_dir) if os.path.isfile(os.path.join(case_files_dir, f))]
        logger.info('case_files:', case_files)

        if not case_files:
            logger.warning("No data files found in the directory.")

        for case_file in case_files:
            logger.info('case_file: ', case_file)
            try:
                input_data = {"data_path": case_file}
                logger.info(f"Processing data files: {case_file}")

                result = graph.invoke(input=input_data)

                if result is None:
                    logger.error("Graph execution returned None. Please check the workflow and nodes.")
                    continue

                logger.info(f"Graph execution result: {result}")

                #write_output(result)
                
                logger.info("Process completed successfully for the data files.")

            except Exception as e:
                logger.error(f"Error processing case file {case_file}: {e}")
         '''