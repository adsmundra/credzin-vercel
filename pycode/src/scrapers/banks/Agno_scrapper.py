!pip install agno duckduckgo-search ollama
import os
!curl https://ollama.ai/install.sh | sh
!echo 'debconf debconf/frontend select Noninteractive' | sudo debconf-set-selections
!sudo apt-get update && sudo apt-get install -y cuda-drivers
# Set LD_LIBRARY_PATH so the system NVIDIA library
os.environ.update({'LD_LIBRARY_PATH': '/usr/lib64-nvidia'})

!nohup ollama serve &
!ollama ps
# !ollama pull mistral-small3.1
!ollama pull llama3.2
!ollama list

from agno.agent import Agent
from agno.models.ollama import Ollama
from agno.tools.duckduckgo import DuckDuckGoTools

import json
import pandas as pd
import os
import pprint

agent = Agent(
    name = "Card Agent",
    model=Ollama(id="llama3.2:latest"),   #[gemma3:4b, llama3.2]
    tools=[DuckDuckGoTools()],
    description="You are a credit card data scraping expert. You analyze credit cards and extract detailed information about the card features and benefits (62 fields).",
    instructions=[
        '''
        	1.	Role Assignment:
                You are a professional agent specializing in gathering detailed information about credit cards.

            2.	Task Overview:
                Given a specific bank and credit card name, perform the following tasks:
            •	Use web search to find the top 10 relevant and up-to-date links about the specified credit card.
            •	From each working link, extract pertinent information, including fees, benefits, features, card image URLs, and offers.
            •	Consolidate all descriptions from the gathered links into a comprehensive and detailed credit card description.
            •	Summarize the findings into a clean, structured JSON object.

            3.	Data Fields to Capture:
                Ensure the JSON object includes the following fields in the specified order:

                1. bank_name which describes The name of the financial institution that issues the respective credit card.
                2. card_name which describes The official name of the credit card.
                3. card_type which describes The card’s primary classification based on its target user or function (e.g., Retail,Business).
                4. card_category which describes The main spending focus or benefit area the card is designed for (e.g., Fuel,Shopping).
                5. card_usp which describes The Unique Selling Proposition the distinctive feature, benefit, or value proposition that sets this card apart from competitors and other cards in the market (e.g., Unlimited free airport lounge access worldwide).
                6. card_image_url which describes  Direct URL(s) to images of the credit card for visual identification.
                7. know_more_link which describes Official webpage with detailed information about the card.
                8. apply_now_link which describes Direct link to the online application form for the card.
                9. joining_fee which describes The one-time upfront fee charged when the credit card is first issued/activated.
                10. annual_fee which describes The recurring yearly maintenance fee charged for keeping the credit card active and accessing its benefits.
                11. annual_fee_waiver which describes Specific conditions, spending thresholds, or promotional terms under which the annual fee is waived or reversed. (e.g., minimum spend).
                12. add_on_card_fee which describes Fee for issuing supplementary or additional cards linked to the primary cardholder's account.
                13. interest_rate_pa which describes The Annual interest rate that is charged on outstanding balances that are not paid.
                14. card_replacement_fee which describes Fee for replacing a lost, stolen, damaged, or expired credit card.
                15. cash_payment_fee which describes Fee for making credit card bill payments in cash.
                16. duplicate_statement_fee which describes Fee for extra copies of statements.
                17. outstation_cheque_fee which describes Fee for processing credit card payments made using cheques drawn on banks from different cities or states than the cardholder's registered address.
                18. hostlisting_charges which describes Fee for blocking a lost/stolen card.
                19. cash_withdrawal_fee which describes Fee for withdrawing cash using the credit card.
                20. overdue_penalty_fee which describes Fee imposed when payments are made after the due date or when minimum amount due is not paid.
                21. over_limit_penalty which describes Fee for exceeding the assigned credit limit.
                22. foreign_currency_transaction_fee which describes Fee for transactions made in foreign currencies(e.g., non-INR transactions).
                23. reward_point_redemption_fee which describes Fee for redeeming reward points.
                24. dynamic_currency_conversion_markup which describes Additional fee charged when merchants offer to convert foreign currency transactions to Indian Rupees at the point of sale abroad(e.g., currency conversion at POS).
                25. education_transaction_fee which describes Specific charges for education-related payments (e.g., school/college fees, exam fees, educational course payments).
                26. wallet_load_transaction_fee which describes Charges for loading money into digital wallets using the card.
                27. fuel_transaction_fee which describes Charges for fuel purchases.
                28. utility_transaction_fee which describes Charges for utility bill payments.
                29. rewards_program which describes Details of the card’s rewards program structure (e.g., Earn 2 points per ₹100 spent).
                30. cashback_with_every_transaction which describes Indicates whether the card provides cashback rewards on all purchases or only specific categories (e.g., 1% cashback on all spends).
                31. spend_based_reversal which describes Fee waivers or reversals based on achieving specific spending milestones within defined time periods (e.g.,  Annual fee reversed if spends > ₹1 lakh/year).
                32. flexipay which describes Availability of EMI or balance transfer availability (e.g., Yes, on spends above ₹2,500).
                33. reward_points which describes The system by which cardholders earn points for spending (e.g., 4 points per ₹150 spent).
                34. rewards which describes List of general rewards and benefits offered by the card (e.g., Free movie tickets, shopping vouchers).
                35. features which describes Summary of key features and benefits of the card (e.g., Contactless payments, lounge access).
                36. returns_rate which describes The effective percentage return or value back from spending.
                37. welcome_benefit which describes Special benefits or gifts provided upon card activation (e.g., ₹1,000 Amazon voucher).
                38. welcome_points which describes Specific bonus reward points credited when the card is issued, activated, or upon meeting initial spending requirements within the first few months (e.g., 2,500 points on first transaction).
                39. milestone_benefit which describes Benefits or rewards for reaching specific spending milestones (e.g., Free flight ticket on spends above ₹5 lakh/year).
                40. bonus_points which describes Additional points awarded under specific conditions/promotions (e.g., 500 points on birthday month).
                41. fuel_benefits which describes Discounts, cashback, or rewards for fuel purchases (e.g., 1% fuel surcharge waiver).
                42. dining_benefits which describes Offers, discounts, or rewards at restaurants (e.g., 20% off at select restaurants).
                43. culinary_treats which describes Access to exclusive dining experiences or events (e.g., Chef’s table invitations).
                44. travel_benefits which describes Benefits related to travel such as discounts, insurance, or exclusive offers (e.g., Free travel insurance, airport transfers).
                45. movie_benefits which describes Offers or rewards for movie ticket purchases (e.g., Buy 1 Get 1 free ticket monthly).
                46. OTT_benefits which describes Complimentary or discounted access to OTT (Over-the-Top) streaming services (e.g., 3 months free Netflix).
                47. cashback_offers which describes Specific cashback promotions for eligible transactions.
                48. voucher_offers which describes Offers involving gift vouchers or shopping vouchers (e.g., ₹500 Myntra voucher on spends > ₹50,000).
                49. mobile_app_benefits which describes Exclusive benefits available through the card’s mobile app (e.g., Extra points on app transactions).
                50. stay_benefits which describes Discounts or offers on hotel stays or accommodations (e.g., 10% off at partner hotels).
                51. lifestyle_benefits which describes Perks related to shopping, wellness, or lifestyle services (e.g., Free gym membership).
                52. e-commerce which describes Offers or rewards for online shopping transactions (e.g., 2% cashback on Amazon/Flipkart).
                53. lounge_access which describes Details of complimentary or discounted airport lounge access (domestic/international) (e.g., 8 free domestic lounge visits per year).
                54. concierge_service which describes Availability of personal concierge services (e.g., 24x7 concierge for travel bookings).
                55. insurance which describes Types of insurance coverage provided (e.g., air accident cover, travel insurance).
                56. fraud_protection which describes Protection against unauthorized/fraudulent transactions or Fraud liability protection (e.g., Zero liability if reported within 24 hours).
                57. health_and_wellness_benefits which describes Health-related perks(e.g. medical insurance,wellness programs).
                58. security_features which describes Security mechanisms (e.g., chip & PIN, contactless, 2FA).
                59. international_use which describes Indicates if the card is suitable for international transactions and Global acceptance status (e.g., Yes, accepted worldwide).
                60. full_card_description which describes Comprehensive summary of benefits and features (e.g., This card offers premium travel, shopping, and lifestyle benefits, including lounge access, high rewards, and robust insurance, making it ideal for frequent travelers).
                61. eligibility_criteria which describes Requirements for applicants  (e.g., age, income, credit score).
                62. terms_and_conditions which describes Official terms, rules, and conditions governing card usage(e.g., All dues must be paid on time; rewards program subject to change).

            4.	Formatting Guidelines:
            •	The output must be a valid JSON object, starting with { and ending with }.
            •	All string values should be enclosed in double quotes.
            •	Do not include any markdown formatting, code blocks, or explanatory text.
            •	If a particular field is not available, set its value to "NILL".
            • Just give the JSON object without any additional text or explanation.
            '''],

    markdown=True,
    show_tool_calls=True,
    add_datetime_to_instructions=True,
    debug_mode=True,
)

credit_card_names = ['Axis Bank Magnus Credit Card', 'SBI Card PRIME']
#credit_card_names = ['Indian Oil Axis Bank Credit Card', 'Rewards Credit Card', 'Axis Bank Magnus Credit Card', 'Axis Bank Privilege Credit Card', 'Flipkart Axis BankCredit Card', 'Axis Bank MY ZoneCredit Card', 'Axis Bank NeoCredit Card', 'Axis Bank SelectCredit Card', 'Axis Bank AtlasCredit Card', 'Axis Bank AURACredit Card', 'IndianOil Axis Bank PremiumCredit Card', 'Axis Bank ACECredit Card', 'Axis Bank Pride PlatinumCredit Card', 'Axis Bank Pride SignatureCredit Card', 'Axis Bank MY Zone EasyCredit Card', 'Privilege EasyCredit Card', 'Axis Bank Signature Credit Card with Lifestyle Benefits', 'PlatinumCredit Card', 'Titanium Smart TravelerCredit Card', 'Axis Bank My WingsCredit Card', 'Flipkart Axis Bank Super EliteCredit Card', 'HORIZONCredit Card', 'SpiceJet Axis Bank Voyage BlackCredit Card', 'Axis Bank ReserveCredit Card', 'Samsung Axis Bank InfiniteCredit Card', 'Fibe Axis BankCredit Card', 'Axis Bank Shoppers StopCredit Card', 'SpiceJet Axis Bank VoyageCredit Card', 'Airtel Axis BankCredit Card', 'Samsung Axis Bank SignatureCredit Card', 'Miles and More Axis BankCredit Card', 'Axis Bank FreechargeCredit Card', 'Axis Bank Freecharge PlusCredit Card', 'LIC Axis Bank SignatureCredit Card', 'LIC Axis Bank PlatinumCredit Card', 'CashbackCredit Card', 'Axis Bank VistaraCredit Card', 'Axis Bank Vistara Signature Credit Card', 'Axis Bank Vistara Infinite Credit Card']
output_file = 'credit_card_data.csv'

if not os.path.exists(output_file):
  print("No path like this")


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
        df

        df.to_csv(output_file, mode='a', index = False, header= False)

        # # Append the DataFrame to the CSV file
        # write_header = not os.path.exists(output_file) or idx == 0
        # df.to_csv(output_file, mode='a', index=False, header=write_header)
        # print(f"Data for '{card_name}' appended successfully.")

    except json.JSONDecodeError as e:
        print(f"JSON decoding failed: {e}")