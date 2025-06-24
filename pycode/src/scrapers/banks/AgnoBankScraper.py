from agno.agent import Agent
from agno.models.ollama import Ollama
from agno.tools.duckduckgo import DuckDuckGoTools

import json
import pandas as pd
import os    
import pprint
import sys
from pathlib import Path

# Get the parent directory (one level up from current file)
base_path = Path(__file__).resolve().parent.parent.parent.parent  # Two levels up
sys.path.append(str(base_path))

from src.utils.utilities import setup_env

# Decide Run mode
setup_env()

agent = Agent(
    name = "Card Agent",
    model=Ollama(id="llama3.2"),   # [qwen3:8b, gemma3:4b, llama3.2]
    tools=[DuckDuckGoTools()],
    description="You are a credit card data scraping expert. You analyze credit cards and extract detailed information about the card features and benefits.",
    instructions=[
        '''
        	1.	Role Assignment:
                You are a professional agent specializing in gathering detailed information about Indian credit cards.
            
            2.	Task Overview:
                Given a specific bank and credit card name, perform the following tasks:
            •	Use web search to find the top 10 relevant and up-to-date links about the specified credit card.
            •	From each working link, extract pertinent information, including fees, benefits, features, card image URLs, and offers.
            •	Consolidate all descriptions from the gathered links into a comprehensive and detailed credit card description.
            •	Summarize the findings into a clean, structured JSON object.
            
            3.	Data Fields to Capture:
                Ensure the JSON object includes the following 62 fields in the specified order:

                bank_name: The name of the financial institution that issues the credit card.
                card_name: The official product name of the credit card.
                card_type: The classification of the card (e.g., retail, co-branded, premium).
                card_category: The primary categories or use-cases the card is designed for (e.g., fuel, shopping, travel).
                card_usp: The unique selling proposition or standout feature that differentiates the card from others.
                card_image_url: Direct URL(s) to images of the credit card for visual identification.
                know_more_link: Official webpage with detailed information about the card.
                apply_now_link: Direct link to the online application form for the card.
                joining_fee: One-time fee charged when the card is first issued.
                annual_fee: Recurring yearly fee for maintaining the card.
                annual_fee_waiver: Conditions under which the annual fee is waived (e.g., minimum spend).
                add_on_card_fee: Fee for issuing supplementary/add-on cards.
                interest_rate_pa: Annualized interest rate applied to outstanding balances.
                card_replacement_fee: Fee for replacing a lost or stolen card.
                cash_payment_fee: Charges for making credit card bill payments in cash.
                duplicate_statement_fee: Fee for requesting a duplicate account statement.
                outstation_cheque_fee: Charges for payments made using cheques from non-local banks.
                hostlisting_charges: Fee for placing the card on a hotlist (e.g., for lost/stolen cards).
                cash_withdrawal_fee: Charges for withdrawing cash using the credit card.
                overdue_penalty_fee: Penalty for late payments or overdue balances.
                over_limit_penalty: Charges for exceeding the assigned credit limit.
                foreign_currency_transaction_fee: Fee for transactions made in foreign currencies; forex markup.
                reward_point_redemption_fee: Charges for redeeming reward points.
                dynamic_currency_conversion_markup: Extra fee for converting currency at the point of sale abroad.
                education_transaction_fee: Fee for transactions related to educational payments.
                wallet_load_transaction_fee: Charges for loading money into digital wallets using the card.
                fuel_transaction_fee: Charges for fuel purchases.
                utility_transaction_fee: Charges for utility bill payments.
                rewards_program: Details of the card’s rewards program structure.
                cashback_with_every_transaction: Indicates if cashback is earned on every transaction.
                spend_based_reversal: Fee reversal based on achieving certain spending thresholds.
                flexipay: Availability of EMI (Equated Monthly Installment) options, including balance transfer on EMI.
                reward_points: The system by which cardholders earn points for spending.
                rewards: List of general rewards and benefits offered by the card.
                features: Summary of key features and benefits of the card.
                returns_rate: The effective percentage return in value (points/cashback) for spending.
                welcome_benefit: Special benefits or gifts provided upon card activation.
                welcome_points: Bonus reward points given when the card is issued or first used.
                milestone_benefit: Benefits or rewards for reaching specific spending milestones.
                bonus_points: Additional points awarded under specific conditions or promotions.
                fuel_benefits: Discounts, cashback, or rewards for fuel purchases.
                dining_benefits: Offers, discounts, or rewards at restaurants.
                culinary_treats: Access to exclusive dining experiences or events.
                travel_benefits: Benefits related to travel, such as discounts, insurance, or exclusive offers.
                lounge_access: Details of complimentary or discounted airport lounge access (domestic/international).
                concierge_service: Availability of personal concierge services for travel, bookings, etc.
                movie_benefits: Offers or rewards for movie ticket purchases.
                OTT_benefits: Complimentary or discounted access to OTT (Over-the-Top) streaming services.
                cashback_offers: Specific cashback promotions for eligible transactions.
                voucher_offers: Offers involving gift vouchers or shopping vouchers.
                mobile_app_benefits: Exclusive benefits available through the card’s mobile app.
                stay_benefits: Discounts or offers on hotel stays or accommodations.
                lifestyle_benefits: Perks related to shopping, wellness, or lifestyle services.
                ecommerce_benefits: Offers or rewards for online shopping transactions.
                insurance: Types of insurance coverage provided (e.g., air accident cover, travel insurance).
                fraud_protection: Protection against unauthorized or fraudulent transactions.
                health_and_wellness_benefits: Health-related perks such as medical insurance or wellness programs.
                security_features: Security mechanisms (e.g., chip & PIN, contactless, 2FA).
                international_use: Indicates if the card is suitable for international transactions and is globally accepted.
                full_card_description: A detailed, all-encompassing summary of the card’s features, benefits, and terms.
                eligibility_criteria: Requirements for applicants (e.g., age, income, credit score).
                terms_and_conditions: Official terms, rules, and conditions governing card usage.

            4.	Formatting Guidelines:
            •	The output must be a valid JSON object, starting with { and ending with }.
            •	All string values should be enclosed in double quotes.
            •	Do not include any markdown formatting, code blocks, or explanatory text.
            •	If a particular field is not available, set its value to "NA".
            •   Just give the JSON object without any additional text or explanation.
            '''],

    markdown=True,
    show_tool_calls=True,
    add_datetime_to_instructions=True,
    debug_mode=True,
)

# Extract the first few card names
#credit_card_names = df['card_name'].head().tolist()
credit_card_names = ['Axis Bank Magnus Credit Card', 'Indian Oil Axis Bank Credit Card']

#credit_card_names = ['Axis Bank Magnus Credit Card', 'Indian Oil Axis Bank Credit Card']
#credit_card_names = ['Indian Oil Axis Bank Credit Card', 'Rewards Credit Card', 'Axis Bank Magnus Credit Card', 'Axis Bank Privilege Credit Card', 'Flipkart Axis BankCredit Card', 'Axis Bank MY ZoneCredit Card', 'Axis Bank NeoCredit Card', 'Axis Bank SelectCredit Card', 'Axis Bank AtlasCredit Card', 'Axis Bank AURACredit Card', 'IndianOil Axis Bank PremiumCredit Card', 'Axis Bank ACECredit Card', 'Axis Bank Pride PlatinumCredit Card', 'Axis Bank Pride SignatureCredit Card', 'Axis Bank MY Zone EasyCredit Card', 'Privilege EasyCredit Card', 'Axis Bank Signature Credit Card with Lifestyle Benefits', 'PlatinumCredit Card', 'Titanium Smart TravelerCredit Card', 'Axis Bank My WingsCredit Card', 'Flipkart Axis Bank Super EliteCredit Card', 'HORIZONCredit Card', 'SpiceJet Axis Bank Voyage BlackCredit Card', 'Axis Bank ReserveCredit Card', 'Samsung Axis Bank InfiniteCredit Card', 'Fibe Axis BankCredit Card', 'Axis Bank Shoppers StopCredit Card', 'SpiceJet Axis Bank VoyageCredit Card', 'Airtel Axis BankCredit Card', 'Samsung Axis Bank SignatureCredit Card', 'Miles and More Axis BankCredit Card', 'Axis Bank FreechargeCredit Card', 'Axis Bank Freecharge PlusCredit Card', 'LIC Axis Bank SignatureCredit Card', 'LIC Axis Bank PlatinumCredit Card', 'CashbackCredit Card', 'Axis Bank VistaraCredit Card', 'Axis Bank Vistara Signature Credit Card', 'Axis Bank Vistara Infinite Credit Card']
# output_file = '/Users/aman/Welzin/Dev/credzin/KnowledgeBase/banks/AxisBank/csv/axis_credit_cards_test.csv'

for idx, card_name in enumerate(credit_card_names):
    #print(f"\n--- Report for {card_name} ---\n")
    #agent.print_response(card_name, stream=True)
    #print("\n--- End of Report ---\n")

    cards_string = agent.run(card_name, stream=False)
    #print('cards_string: ' + pprint.pformat(cards_string))
  
    cards_string_content = cards_string.content.strip()
    print('cards_string_content: ' + pprint.pformat(cards_string_content))

    # Assuming 'cards_string.content' contains the JSON string
    json_str = cards_string_content
    try:
        cards_data = json.loads(json_str, strict=False)
        df = pd.DataFrame([cards_data])  # Wrap in a list to create a DataFrame with one row
        
        # Append the DataFrame to the CSV file
        write_header = not os.path.exists(output_file) or idx == 0
        df.to_csv(output_file, mode='a', index=False, header=write_header)
        print(f"Data for '{card_name}' appended successfully.")

    except json.JSONDecodeError as e:
        print(f"JSON decoding failed: {e}")