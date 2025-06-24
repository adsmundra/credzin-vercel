from utils.logger import configure_logging
from utils.utilities import setup_env

from pathlib import Path
import pandas as pd
from pydantic import BaseModel
from firecrawl import FirecrawlApp
import csv
from typing import List, Dict

# Decide Run mode
setup_env()

logger = configure_logging("BankScrapper_V2")

# Configuration constants
EXCEL_PATH = "KnowledgeBase/StructuredCardsData/credit_card_details.xlsx"

FIRECRAWL_API_KEYS = ['fc-7ca0ba6b1d604fe78d3c318efe38b8cc']
last_key_index = -1

class ExtractSchema(BaseModel):
        bank_name: str = "NILL"
        card_name: str = "NILL"
        card_type: str = "NILL"
        card_category: str = "NILL"
        card_usp: str = "NILL"
        card_image_url: str = "NILL"
        know_more_link: str = "NILL"
        apply_now_link: str = "NILL"
        joining_fee: str = "NILL"
        annual_fee: str = "NILL"
        annual_fee_waiver: str = "NILL"
        add_on_card_fee: str = "NILL"
        interest_rate_pa: str = "NILL"
        card_replacement_fee: str = "NILL"
        cash_payment_fee: str = "NILL"
        duplicate_statement_fee: str = "NILL"
        outstation_cheque_fee: str = "NILL"
        hostlisting_charges: str = "NILL"
        cash_withdrawal_fee: str = "NILL"
        overdue_penalty_fee: str = "NILL"
        over_limit_penalty: str = "NILL"
        foreign_currency_transaction_fee: str = "NILL"
        reward_point_redemption_fee: str = "NILL"
        dynamic_currency_conversion_markup: str = "NILL"
        education_transaction_fee: str = "NILL"
        wallet_load_transaction_fee: str = "NILL"
        fuel_transaction_fee: str = "NILL"
        utility_transaction_fee: str = "NILL"
        rewards_program: str = "NILL"
        cashback_with_every_transaction: str = "NILL"
        spend_based_reversal: str = "NILL"
        flexipay: str = "NILL"
        reward_points: str = "NILL"
        rewards: str = "NILL"
        features: str = "NILL"
        returns_rate: str = "NILL"
        welcome_benefit: str = "NILL"
        welcome_points: str = "NILL"
        milestone_benefit: str = "NILL"
        bonus_points: str = "NILL"
        fuel_benefits: str = "NILL"
        dining_benefits: str = "NILL"
        culinary_treats: str = "NILL"
        travel_benefits: str = "NILL"
        movie_benefits: str = "NILL"
        OTT_benefits: str = "NILL"
        cashback_offers: str = "NILL"
        voucher_offers: str = "NILL"
        mobile_app_benefits: str = "NILL"
        stay_benefits: str = "NILL"
        lifestyle_benefits: str = "NILL"
        e_commerce: str = "NILL"
        lounge_access: str = "NILL"
        concierge_service: str = "NILL"
        insurance: str = "NILL"
        fraud_protection: str = "NILL"
        health_and_wellness_benefits: str = "NILL"
        security_features: str = "NILL"
        international_use: str = "NILL"
        full_card_description: str = "NILL"
        eligibility_criteria: str = "NILL"
        terms_and_conditions: str = "NILL"

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

def save_to_csv(output_path, rows, mode='a'):
    df = pd.DataFrame(rows, columns=list(ExtractSchema.model_fields.keys()))

    # Clean newline characters inside cells
    df = df.applymap(lambda x: x.replace('\n', ' ').replace('\r', ' ') if isinstance(x, str) else x)

    if mode == 'a' and output_path.exists():
        existing_df = pd.read_csv(output_path)
        combined_df = pd.concat([existing_df, df], ignore_index=True)
        combined_df.to_csv(output_path, index=False, quoting=csv.QUOTE_ALL, lineterminator='\n')
    else:
        df.to_csv(output_path, index=False, quoting=csv.QUOTE_ALL, lineterminator='\n')

def parse_card_info(bank_name, card_info, excel_path):
    """
    Perform Firecrawl scraping for each card of the specified bank.
    Args:
        bank_name (str): Name of the bank.
        card_info (list): List of card info dicts for the bank.
        excel_path (str): Path to the Excel file.
    Returns:
        int: Number of cards processed.
    """

    # Firecrawl API Key 
    # app = FirecrawlApp(api_key='fc-55191b48af524d3b83bb261b34431646')


    app = FirecrawlApp(api_key='fc-b9db21c349214ef69cd49deed5737e1f')
    prompt_template = '''
        • Extract all the data for {card_name}:
            1. bank_name: The name of the financial institution that issues the respective credit card.
            2. card_name: The official name of the credit card.
            3. card_type: The card's primary classification based on its target user or function (e.g., Retail,Business).
            4. card_category: The main spending focus or benefit area the card is designed for (e.g., Fuel,Shopping).
            5. card_usp: The Unique Selling Proposition the distinctive feature, benefit, or value proposition that sets this card apart from competitors and other cards in the market (e.g., Unlimited free airport lounge access worldwide).
            6. card_image_url:  Direct URL(s) to images of the credit card for visual identification.
            7. know_more_link: Official webpage with detailed information about the card.
            8. apply_now_link: Direct link to the online application form for the card.
            9. joining_fee: The one time upfront fee charged when the credit card is first issued or activated.
            10. annual_fee: The recurring yearly maintenance fee charged for keeping the credit card active and accessing its benefits.
            11. annual_fee_waiver: Specific conditions, spending thresholds, or promotional terms under which the annual fee is waived or reversed. (e.g., minimum spend).
            12. add_on_card_fee: Fee for issuing supplementary or additional cards linked to the primary cardholder's account.
            13. interest_rate_pa: The Annual interest rate that is charged on outstanding balances that are not paid.
            14. card_replacement_fee: Fee for replacing a lost, stolen, damaged, or expired credit card.
            15. cash_payment_fee: Fee for making credit card bill payments in cash.
            16. duplicate_statement_fee: Fee for extra copies of statements.
            17. outstation_cheque_fee: Fee for processing credit card payments made using cheques drawn on banks from different cities or states than the cardholder's registered address.
            18. hostlisting_charges: Fee for blocking a lost/stolen card.
            19. cash_withdrawal_fee: Fee for withdrawing cash using the credit card.
            20. overdue_penalty_fee: Fee imposed when payments are made after the due date or when minimum amount due is not paid.
            21. over_limit_penalty: Fee for exceeding the assigned credit limit.
            22. foreign_currency_transaction_fee: Fee for transactions made in foreign currencies(e.g., non-INR transactions).
            23. reward_point_redemption_fee: Fee for redeeming reward points.
            24. dynamic_currency_conversion_markup: Additional fee charged when merchants offer to convert foreign currency transactions to Indian Rupees at the point of sale abroad(e.g., currency conversion at POS).
            25. education_transaction_fee: Specific charges for education-related payments (e.g., school/college fees, exam fees, educational course payments).
            26. wallet_load_transaction_fee: Charges for loading money into digital wallets using the card.
            27. fuel_transaction_fee: Charges for fuel purchases.
            28. utility_transaction_fee: Charges for utility bill payments.
            29. rewards_program: Details of the card's rewards program structure (e.g., Earn 2 points per ₹100 spent).
            30. cashback_with_every_transaction: Indicates whether the card provides cashback rewards on all purchases or only specific categories (e.g., 1% cashback on all spends).
            31. spend_based_reversal: Fee waivers or reversals based on achieving specific spending milestones within defined time periods (e.g.,  Annual fee reversed if spends > ₹1 lakh/year).
            32. flexipay: Availability of EMI or balance transfer availability (e.g., Yes, on spends above ₹2,500).
            33. reward_points: The system by which cardholders earn points for spending (e.g., 4 points per ₹150 spent).
            34. rewards: List of general rewards and benefits offered by the card (e.g., Free movie tickets, shopping vouchers).
            35. features: Summary of key features and benefits of the card (e.g., Contactless payments, lounge access).
            36. returns_rate: The effective percentage return or value back from spending.
            37. welcome_benefit: Special benefits or gifts provided upon card activation (e.g., ₹1,000 Amazon voucher).
            38. welcome_points: Specific bonus reward points credited when the card is issued, activated, or upon meeting initial spending requirements within the first few months (e.g., 2,500 points on first transaction).
            39. milestone_benefit: Benefits or rewards for reaching specific spending milestones (e.g., Free flight ticket on spends above ₹5 lakh/year).
            40. bonus_points: Additional points awarded under specific conditions/promotions (e.g., 500 points on birthday month).
            41. fuel_benefits: Discounts, cashback, or rewards for fuel purchases (e.g., 1% fuel surcharge waiver).
            42. dining_benefits: Offers, discounts, or rewards at restaurants (e.g., 20% off at select restaurants).
            43. culinary_treats: Access to exclusive dining experiences or events (e.g., Chef's table invitations).
            44. travel_benefits: Benefits related to travel such as discounts, insurance, or exclusive offers (e.g., Free travel insurance, airport transfers).
            45. movie_benefits: Offers or rewards for movie ticket purchases (e.g., Buy 1 Get 1 free ticket monthly).
            46. OTT_benefits: Complimentary or discounted access to OTT (Over-the-Top) streaming services (e.g., 3 months free Netflix).
            47. cashback_offers: Specific cashback promotions for eligible transactions.
            48. voucher_offers: Offers involving gift vouchers or shopping vouchers (e.g., ₹500 Myntra voucher on spends > ₹50,000).
            49. mobile_app_benefits: Exclusive benefits available through the card's mobile app (e.g., Extra points on app transactions).
            50. stay_benefits: Discounts or offers on hotel stays or accommodations (e.g., 10% off at partner hotels).
            51. lifestyle_benefits: Perks related to shopping, wellness, or lifestyle services (e.g., Free gym membership).
            52. e_commerce: Offers or rewards for online shopping transactions (e.g., 2% cashback on Amazon/Flipkart).
            53. lounge_access: Details of complimentary or discounted airport lounge access (domestic/international) (e.g., 8 free domestic lounge visits per year).
            54. concierge_service: Availability of personal concierge services (e.g., 24x7 concierge for travel bookings).
            55. insurance: Types of insurance coverage provided (e.g., air accident cover, travel insurance).
            56. fraud_protection: Protection against unauthorized/fraudulent transactions or Fraud liability protection (e.g., Zero liability if reported within 24 hours).
            57. health_and_wellness_benefits: Health-related perks(e.g. medical insurance,wellness programs).
            58. security_features: Security mechanisms (e.g., chip & PIN, contactless, 2FA).
            59. international_use: Indicates if the card is suitable for international transactions and Global acceptance status (e.g., Yes, accepted worldwide).
            60. full_card_description: Comprehensive summary of benefits and features (e.g., This card offers premium travel, shopping, and lifestyle benefits, including lounge access, high rewards, and robust insurance, making it ideal for frequent travelers).
            61. eligibility_criteria: Requirements for applicants  (e.g., age, income, credit score).
            62. terms_and_conditions: Official terms, rules, and conditions governing card usage(e.g., All dues must be paid on time; rewards program subject to change).
        • If a particular field is not available, set its value to "NILL".
        • If information is split across multiple pages, aggregate it and return one value.
    '''

    # all_rows = []
    
    # for entry in card_info:
    #     card_name = entry.get("card_name", "").strip()
    #     original_image_url = entry.get("card_image_url", "NILL")

    #     if not card_name:
    #         continue

    #     full_card_name = f"{bank_name} {card_name}"
    #     prompt = prompt_template.format(card_name=full_card_name)
        
    #     # try:
    #     #     scrape_result = app.extract(
    #     #         prompt=prompt,
    #     #         schema=ExtractSchema.model_json_schema()
    #     #     )
    #     #     # logger.info(f"\nResult for {full_card_name}:\n", scrape_result)
    #     #     logger.info(f"\nResult for {full_card_name}:\n")
    #     #     logger.info(str(scrape_result))
    #     # except Exception as e:
    #     #     logger.error(f"Error scraping for {full_card_name}: {e}")
    #     #     continue

    #     scrape_result = None

    #     for key in FIRECRAWL_API_KEYS:
    #         try:
    #             app = FirecrawlApp(api_key=key)
    #             scrape_result = app.extract(
    #                 prompt=prompt,
    #                 schema=ExtractSchema.model_json_schema()
    #             )
    #             logger.info(f"Success with key {key} for {full_card_name}")
    #             logger.info(str(scrape_result))
    #             break  # Success → stop trying other keys
    #         except Exception as e:
    #             logger.error(f"Failed with key {key} for {full_card_name}: {e}")
    #             time.sleep(2)  # small delay before trying next key

    #     if not scrape_result:
    #         logger.error(f"All API keys failed for {full_card_name}. Skipping.")
    #         continue

    #     data_dict = getattr(scrape_result, "data", {}) or {}

    #     # Overwrite card_image_url with the one from Excel if present
    #     if original_image_url and original_image_url != "NILL":
    #         data_dict["card_image_url"] = original_image_url

    #     values = [str(data_dict.get(field, "NILL")) for field in ExtractSchema.model_fields]
    #     all_rows.append(values)

    #     formatted_bank_name = f"{bank_name.title()}bank"
    #     base_output_dir = Path('KnowledgeBase/banks')
    #     bank_folder = base_output_dir / formatted_bank_name / 'csv'
    #     bank_folder.mkdir(parents=True, exist_ok=True)

    #     output_path = bank_folder / "credit_card_details_v2.csv"
    #     save_to_csv(output_path, [values], mode='a')
    #     logger.info(f"\nAppended record for {full_card_name} → {output_path}")

    # if not all_rows:
    #     logger.error(f"No rows processed for bank {bank_name}.")

    global last_key_index  # Use global variable to track key index

    all_rows = []
    for entry in card_info:
        card_name = entry.get("card_name", "").strip()
        original_image_url = entry.get("card_image_url", "NILL")
        if not card_name:
            logger.warning(f"Skipping entry with empty card_name.")
            continue
        full_card_name = f"{bank_name} {card_name}"
        prompt = prompt_template.format(card_name=full_card_name)

        
        scrape_result = None
        # Select the next key in round-robin fashion
        last_key_index = (last_key_index + 1) % len(FIRECRAWL_API_KEYS)
        selected_key = FIRECRAWL_API_KEYS[last_key_index]
        
        # Try the selected key first

        try:
            logger.info(f"Trying round-robin key {selected_key} for {full_card_name}")
            app = FirecrawlApp(api_key=selected_key)
            scrape_result = app.extract(
                prompt=prompt,
                schema=ExtractSchema.model_json_schema()
            )

            logger.info(f"\nResult for {full_card_name}:\n")

            logger.info(f"Success with round-robin key {selected_key} for {full_card_name}")

            logger.info(str(scrape_result))
        except Exception as e:
            logger.error(f"Failed with round-robin key {selected_key} for {full_card_name}: {e}")
            # Fallback: Try other keys in order
            for fallback_key in FIRECRAWL_API_KEYS:
                if fallback_key == selected_key:
                    continue  # Skip the already tried key
                try:
                    logger.info(f"Trying fallback key {fallback_key} for {full_card_name}")
                    app = FirecrawlApp(api_key=fallback_key)
                    scrape_result = app.extract(
                        prompt=prompt,
                        schema=ExtractSchema.model_json_schema()
                    )
                    logger.info(f"Success with fallback key {fallback_key} for {full_card_name}")
                    logger.info(str(scrape_result))
                    break  # Stop trying other keys on success
                except Exception as e:
                    logger.error(f"Failed with fallback key {fallback_key} for {full_card_name}: {e}")
                    time.sleep(0.5)  # Small delay before trying next key

        if not scrape_result:
            logger.error(f"All API keys failed for {full_card_name}. Skipping.")
            continue
        data_dict = getattr(scrape_result, "data", {}) or {}
        if original_image_url and original_image_url != "NILL":
            data_dict["card_image_url"] = original_image_url
        values = [str(data_dict.get(field, "NILL")) for field in ExtractSchema.model_fields]
        all_rows.append(values)
        
        formatted_bank_name = f"{bank_name.title()}bank"
        base_output_dir = Path('KnowledgeBase/banks')
        bank_folder = base_output_dir / formatted_bank_name / 'csv'
        bank_folder.mkdir(parents=True, exist_ok=True)
        output_path = bank_folder / "credit_card_details_v2.csv"
        save_to_csv(output_path, [values], mode='a')

        logger.info(f"\nAppended record for {full_card_name} → {output_path}")
        logger.info(f"Appended record for {full_card_name} to {output_path}")

    if not all_rows:
        logger.error(f"No rows processed for bank {bank_name}.")
    return len(all_rows)

def run_bank_scrapers_v2(bank_names: List[str], excel_path: str = None) -> dict:
    """
    Main function to process multiple banks: get card info from Excel and run scrapers.
    
    Args:
        bank_names: List of bank names to process
        excel_path: Path to the Excel file containing card data (optional, uses default if not provided)
        
    Returns:
        dict: Results for each bank (success/failure status and number of cards processed)
    """
    # Use default Excel path if none provided
    if excel_path is None:
        excel_path = EXCEL_PATH
    
    logger.info("Starting BankScrapper_V2 for multiple banks...")
    logger.info(f"Using Excel file: {excel_path}")
    
    if not bank_names:
        logger.error("bank_names must be a non-empty list")
        return {}
    
    results = {}
    
    for bank_name in bank_names:
        logger.info(f"\n{'='*50}")
        logger.info(f"Processing bank: {bank_name}")
        logger.info(f"{'='*50}")
        
        # Validate bank name
        if not isinstance(bank_name, str) or not bank_name.strip():
            logger.warning(f"Skipping invalid bank name: {bank_name}")
            results[bank_name] = {"success": False, "cards_processed": 0, "error": "Invalid bank name"}
            continue
        
        bank_name = bank_name.strip()
        
        # Get card info from Excel
        card_info = get_card_info_from_excel(excel_path, bank_name)
        
        if not card_info:
            logger.warning(f"No card data found for bank {bank_name}")
            results[bank_name] = {"success": False, "cards_processed": 0, "error": "No card data found"}
            continue
        
        # Log found cards
        card_names = [item["card_name"] for item in card_info]
        logger.info(f"Found {len(card_names)} cards for {bank_name}: {card_names}")
        
        # Run the scraper
        try:
            num_processed = parse_card_info(bank_name, card_info, excel_path)
            logger.info(f"Successfully processed {num_processed} cards for {bank_name}")
            results[bank_name] = {"success": True, "cards_processed": num_processed, "error": None}
            logger.info(f"✅ Successfully completed processing for {bank_name}")
        except Exception as e:
            logger.error(f"Error processing bank {bank_name}: {e}")
            results[bank_name] = {"success": False, "cards_processed": 0, "error": str(e)}
            logger.error(f"❌ Failed to process {bank_name}")
    
    logger.info("Multi-bank processing completed!")
    
    # Log summary
    log_summary(results)
    
    return results

def log_summary(results: dict) -> None:
    """
    Log a summary of the bank processing results.
    
    Args:
        results: Dictionary containing results from run_bank_scrapers_v2
    """
    successful_banks = []
    failed_banks = []
    total_cards_processed = 0
    
    for bank_name, result in results.items():
        if result["success"]:
            successful_banks.append(bank_name)
            total_cards_processed += result["cards_processed"]
            logger.info(f"✅ {bank_name}: {result['cards_processed']} cards processed")
        else:
            failed_banks.append(bank_name)
            logger.error(f"❌ {bank_name}: {result['error']}")
    
    logger.info(f"\n{'='*60}")
    logger.info(f"SUMMARY: {len(successful_banks)} banks successful, {len(failed_banks)} failed")
    logger.info(f"Total cards processed: {total_cards_processed}")
    logger.info(f"{'='*60}")


if __name__ == "__main__":
    """
    Standalone execution of BankScrapper_V2.
    This allows the file to be run directly: python BankScrapper_V2.py
    """
    try:
        logger.info("Running BankScrapper_V2 as standalone script...")
        
        # Default bank names to process when run standalone
        #DEFAULT_BANK_NAMES = ["Induslnd","IDFC","AU","Yes","Amex","ICICI","Kotak","HDFC","SBI","IDBI"]
        DEFAULT_BANK_NAMES = ['SBI']
        # You can modify this list to process different banks
        # Example: DEFAULT_BANK_NAMES = ["Amex", "Axis", "SBI", "ICICI"]
        
        logger.info(f"Processing banks: {DEFAULT_BANK_NAMES}")
        
        # Run the bank scraper
        results = run_bank_scrapers_v2(DEFAULT_BANK_NAMES)
        
        logger.info("BankScrapper_V2 standalone execution completed!")
        
    except Exception as exc:
        logger.critical(f"Critical error in BankScrapper_V2 standalone execution: {exc}")
        raise