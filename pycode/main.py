# from src.Recommender.LangGraphNodes.build_graph import card_graph
from src.utils.logger_utils import logger
# from src.Scrapers.banks import AxisBankScraper, ICICIBankScraper, SBIBankScraper
# from src.Scrapers.sites import CardInsiderScraper
from src.scrapers.banks.Final_scrapper import firecrawl_scraper
import os
import pandas as pd
import sys

def get_card_names_from_excel(excel_path, bank_name):
    """
    Read the Excel file and extract card names for the specified bank.
    
    Args:
        excel_path (str): Path to the Excel file containing multiple bank worksheets.
        bank_name (str): Name of the bank to filter card names for.
    
    Returns:
        list: List of card names for the specified bank.
    """
    logger.info("Reading the excel to get corresponding credit names from a bank....")

    try:
        # Read all sheets from the Excel file
        xl = pd.ExcelFile(excel_path)
        
        # Check if the bank_name exists as a sheet
        if bank_name not in xl.sheet_names:
            print(f"No worksheet found for bank: {bank_name}")
            return []
        
        # Read the specific bank's worksheet
        df = pd.read_excel(excel_path, sheet_name=bank_name)
        
        # Extract card names, dropping any NaN values
        card_names = df['card_name'].dropna().tolist()
        return card_names
    
    except Exception as e:
        print(f"Error reading Excel file for bank {bank_name}: {e}")
        return []


def run_bank_scrapers_new(bank_name, card_names, excel_path):
    '''
    Func:
        run final_scrapper for the bank credit_card details
    
    Args: 
        df: read str from the input path
    '''
    logger.info("Starting credit card scraping process (NEW) ...")
    # firecrawl_scraper(df)
    # Run Firecrawl scraper
    firecrawl_scraper(bank_name, card_names, excel_path)


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
        logger.info("Running main function...")

        excel_path = "KnowledgeBase/StructuredCardsData/credit_card_details.xlsx"
    
        # Input bank name
        bank_names = ["HDFC"] #input("Enter the bank name (e.g., Axis, SBI, HDFC): ").strip()
        
        # if not bank_name:
        #     print("Bank name cannot be empty.")
        # # Get card names for the specified bank
        # card_names = get_card_names_from_excel(excel_path, bank_name)
        
        # if not card_names:
        #     print(f"No card names found for bank {bank_name}.")
        
        # print(f"Found {len(card_names)} cards for {bank_name}: {card_names}")
        
        # Validate bank_names
        if not bank_names or not isinstance(bank_names, list):
            print("Error: bank_names must be a non-empty list.")
            sys.exit(0)
        
        for bank_name in bank_names:
            # Validate bank_name
            if not bank_name or not isinstance(bank_name, str):
                print(f"Skipping invalid bank name: {bank_name}")
                continue
            
            bank_name = bank_name.strip()
            print(f"\nProcessing bank: {bank_name}")
            
            # Get card names for the specified bank
            card_names = get_card_names_from_excel(excel_path, bank_name)
            
            if not card_names:
                print(f"No card names found for bank {bank_name}.")
                continue
            card_names = card_names[:5]
            print(f"Found {len(card_names)} cards for {bank_name}: {card_names}")
       
        
            run_bank_scrapers_new(bank_name, card_names, excel_path)
             
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
    except Exception as e:
        logger.critical(f"Critical error in the main process: {e}")
    

