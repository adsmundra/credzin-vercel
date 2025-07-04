from utils.logger import configure_logging
from utils.utilities import setup_env
from pathlib import Path
import pandas as pd
from pydantic import BaseModel
from firecrawl import FirecrawlApp
import csv
from typing import List
from datetime import datetime
from tqdm import tqdm

# Setup environment and logger
setup_env()
logger = configure_logging("FirecrawlBankScrapper")

# Configuration constants
CSV_PATH = "/Users/aman/Welzin/dev/credzin/KnowledgeBase/StructuredCardsData/cc_features.csv"
FIRECRAWL_API_KEY = 'fc-c815652927e747a69dbc90f6db2563e2'
BANK_LIST = ["AU Small Finance Bank"]

class ExtractSchema(BaseModel):
    bank_name: str = "null"
    card_name: str = "null"
    card_type: str = "null"
    card_category: str = "null"
    card_usp: str = "null"
    card_image_url: str = "null"
    know_more_link: str = "null"
    apply_now_link: str = "null"
    joining_fee: str = "null"
    annual_fee: str = "null"
    annual_fee_waiver: str = "null"
    add_on_card_fee: str = "null"
    interest_rate_pa: str = "null"
    card_replacement_fee: str = "null"
    cash_payment_fee: str = "null"
    duplicate_statement_fee: str = "null"
    outstation_cheque_fee: str = "null"
    hostlisting_charges: str = "null"
    cash_withdrawal_fee: str = "null"
    overdue_penalty_fee: str = "null"
    over_limit_penalty: str = "null"
    foreign_currency_transaction_fee: str = "null"
    reward_point_redemption_fee: str = "null"
    dynamic_currency_conversion_markup: str = "null"
    education_transaction_fee: str = "null"
    wallet_load_transaction_fee: str = "null"
    fuel_transaction_fee: str = "null"
    utility_transaction_fee: str = "null"
    rewards_program: str = "null"
    cashback_with_every_transaction: str = "null"
    spend_based_reversal: str = "null"
    flexipay: str = "null"
    reward_points: str = "null"
    rewards: str = "null"
    features: str = "null"
    returns_rate: str = "null"
    welcome_benefit: str = "null"
    welcome_points: str = "null"
    milestone_benefit: str = "null"
    bonus_points: str = "null"
    fuel_benefits: str = "null"
    dining_benefits: str = "null"
    culinary_treats: str = "null"
    travel_benefits: str = "null"
    movie_benefits: str = "null"
    OTT_benefits: str = "null"
    cashback_offers: str = "null"
    voucher_offers: str = "null"
    mobile_app_benefits: str = "null"
    stay_benefits: str = "null"
    lifestyle_benefits: str = "null"
    e_commerce: str = "null"
    lounge_access: str = "null"
    concierge_service: str = "null"
    insurance: str = "null"
    fraud_protection: str = "null"
    health_and_wellness_benefits: str = "null"
    security_features: str = "null"
    international_use: str = "null"
    full_card_description: str = "null"
    eligibility_criteria: str = "null"
    terms_and_conditions: str = "null"

def parse_card_info(bank_name, card_info, csv_path):
    import time
    prompt_template = '''
        • Extract all the data for {bank_name} {card_name}:
            1. bank_name: The issuer bank or name of the financial institution that issues the respective credit card.
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
     
        • If a particular field is not available, set its value to "null".
        • If information is split across multiple pages, aggregate it and return one value.
    '''
    master_columns = ['dt'] + [k for k in ExtractSchema.model_fields.keys()]
    # Log the list of cards to be scraped
    card_names = [entry.get("card_name", "").strip() for entry in card_info if entry.get("card_name", "").strip()]
    logger.info(f"Cards to be scraped for {bank_name}: {card_names}")
    for idx, entry in enumerate(tqdm(card_info, desc=f"Scraping cards for {bank_name}"), 1):
        card_name = entry.get("card_name", "").strip()
        original_image_url = entry.get("card_image_url", "null")
        if not card_name:
            logger.warning(f"Skipping entry with empty card_name.")
            continue
        full_card_name = f"{bank_name} {card_name}"
        logger.info(f"[{idx}/{len(card_info)}] Scraping card: {full_card_name}")
        prompt = prompt_template.format(bank_name=bank_name, card_name=card_name)
        start_time = time.perf_counter()
        scrape_result = None
        try:
            app = FirecrawlApp(api_key=FIRECRAWL_API_KEY)
            scrape_result = app.extract(
                prompt=prompt,
                schema=ExtractSchema.model_json_schema()
            )
            elapsed = time.perf_counter() - start_time
            logger.info(f"Scraped {full_card_name} in {elapsed:.2f} seconds")
            tokens_used = getattr(scrape_result, 'tokens_used', 'N/A')
            context_size = getattr(scrape_result, 'context_size', 'N/A')
            logger.info(f"Tokens used: {tokens_used}, Context size: {context_size}")
        except Exception as e:
            elapsed = time.perf_counter() - start_time
            logger.error(f"Error scraping {full_card_name} after {elapsed:.2f} seconds: {e}")
            continue
        if not scrape_result:
            logger.error(f"No result for {full_card_name}. Skipping.")
            continue
        data_dict = getattr(scrape_result, "data", {}) or {}
        if original_image_url and original_image_url != "null":
            data_dict["card_image_url"] = original_image_url
        values = [str(data_dict.get(field, "null")) for field in ExtractSchema.model_fields]
        dt_value = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        values.append(dt_value)
        row_dict = dict(zip([k for k in ExtractSchema.model_fields.keys()], values[:-1]))
        row_dict['dt'] = dt_value
        row_dict = {col: row_dict.get(col, "") for col in master_columns}
        df_new = pd.DataFrame([row_dict])
        csv_path_obj = Path(csv_path)
        if csv_path_obj.exists():
            df_new.to_csv(csv_path, mode='a', header=False, index=False)
        else:
            df_new.to_csv(csv_path, mode='w', header=True, index=False)
        logger.info(f"Appended record for {full_card_name} to CSV {csv_path}")
    # After all cards, re-sort the CSV file by bank_name, card_name, dt
    try:
        df = pd.read_csv(csv_path)
        sort_cols = [col for col in ['bank_name', 'card_name', 'dt'] if col in df.columns]
        if sort_cols:
            df = df.sort_values(by=sort_cols, ascending=True)
            df.to_csv(csv_path, index=False, quoting=csv.QUOTE_ALL, lineterminator='\n')
            logger.info(f"Sorted CSV {csv_path} by {sort_cols}")
    except Exception as e:
        logger.error(f"Failed to sort CSV {csv_path}: {e}")
    return len(card_info)

def bank_scraper(bank_names: List[str], csv_path: str = None) -> dict:
    if csv_path is None:
        csv_path = CSV_PATH
    logger.info(f"Starting bank scraper for banks: {bank_names}")
    results = {}
    for bank_name in bank_names:
        bank_name = bank_name.strip()
        df = pd.read_csv(csv_path)
        df.columns = [col.strip().lower() for col in df.columns]
        filtered_df = df[df['bank_name'].str.lower() == bank_name.lower()]
        if filtered_df.empty:
            logger.warning(f"No card data found for bank {bank_name}")
            results[bank_name] = {"success": False, "cards_processed": 0, "error": "No card data found"}
            continue
        num_processed = parse_card_info(bank_name, filtered_df.to_dict('records'), csv_path)
        results[bank_name] = {"success": True, "cards_processed": num_processed, "error": None}
        logger.info(f"{bank_name}: {num_processed} cards processed")
    log_summary(results)
    return results

def log_summary(results: dict) -> None:
    total_banks = len(results)
    succeeded = sum(1 for r in results.values() if r["success"])
    failed = total_banks - succeeded
    total_cards = sum(r["cards_processed"] for r in results.values())
    logger.info(f"Summary: {succeeded} succeeded, {failed} failed, {total_cards} cards processed across {total_banks} banks.")

if __name__ == "__main__":
    import sys
    try:
        logger.info("Running FirecrawlBankScrapper as standalone script...")
        logger.info(f"Processing banks: {BANK_LIST}")
        results = bank_scraper(BANK_LIST)
        logger.info("FirecrawlBankScrapper standalone execution completed!")
    except Exception as exc:
        logger.critical(f"Critical error in FirecrawlBankScrapper standalone execution: {exc}")
        raise