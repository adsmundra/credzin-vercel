from src.Recommender.LangGraphNodes.build_graph import card_graph
from src.Utils.utils import logger
from src.Scrapers.banks import AxisBankScraper, ICICIBankScraper, SBIBankScraper
from src.Scrapers.sites import CardInsiderScraper

import os

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
        logger.info("✅ Starting the credit card recommendation system...")
        
        '''
        # List of banks to scrape
        banks_to_scrape = ['axis', 'sbi', 'icici']
        run_bank_scrapers(banks_to_scrape)

        # List of sites to scrape
        sites_to_scrape = ['cardinsider']
        run_site_scrapers(sites_to_scrape)
        '''

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

    except Exception as e:
        logger.critical(f"Critical error in the main process: {e}")
    