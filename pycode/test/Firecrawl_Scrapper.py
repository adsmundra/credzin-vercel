!pip install firecrawl-py phi langchain langchain-community
!pip install ollama requests
!pip install beautifulsoup4 phidata --upgrade openai
!pip install duckduckgo-search newspaper4k lxml_html_clean ollama
!pip install gspread google-auth google-auth-oauthlib google-auth-httplib2

# import modules
from bs4 import BeautifulSoup
import requests

from pydantic import BaseModel, Field
from typing import Optional

from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from dotenv import load_dotenv
from langchain import PromptTemplate
from langchain.chains import LLMChain
from langchain.llms.ollama import Ollama
import requests
from bs4 import BeautifulSoup
import json
import re
import pandas as pd
import csv

from phi.agent import Agent
from phi.model.openai import OpenAIChat
from phi.tools.duckduckgo import DuckDuckGo
from phi.tools.newspaper4k import Newspaper4k
from phi.model.ollama import Ollama

from google.colab import drive
import pprint

# Install and Import Libraries for google spreadsheet
from google.colab import auth
from google.auth import default
import gspread
import pandas as pd


# Mount google drive
drive.mount('/content/drive')

# Authenticate your Google account to grant Colab access to your Google Sheets
auth.authenticate_user()
creds, _ = default()
gc = gspread.authorize(creds)

# Install Ollama and CUDA drivers
import os
!curl https://ollama.ai/install.sh | sh
!echo 'debconf debconf/frontend select Noninteractive' | sudo debconf-set-selections
!sudo apt-get update && sudo apt-get install -y cuda-drivers

# Set LD_LIBRARY_PATH so the system NVIDIA library
os.environ.update({'LD_LIBRARY_PATH': '/usr/lib64-nvidia'})

#Run Ollama server
!nohup ollama serve &
!ollama ps

!ollama pull deepseek-r1:14b  #[deepseek-r1:1.5b, deepseek-r1:7b, deepseek-r1:32b]

#pull llama3.1 model
# !ollama pull llama3.1

#show list
!ollama list

# Open the Google Sheet
sh = gc.open('credit_card_details')

# Access a Worksheet
worksheet = sh.worksheet('card_issuers') #access sheet named card_issuers

# Get Data
# data = worksheet.get_all_values()

# Convert to Pandas DataFrame
df = pd.DataFrame(worksheet.get_all_records())

# Print DataFrame
# df

# Store Credit card url and bank name in lists
credit_card_url_list = df['credit_card_url'].to_list()
bank_name_list = df['bank_name'].to_list()
print("credit_card_url_list : ", credit_card_url_list)
print("bank_name_list : ", bank_name_list)

# Firecrawl API Setup
Firecrawl_api_key = "fc-a87fe4adcbe4469aa138fb1fe9d5e6d9"
Firecrawl_api_url = "https://api.firecrawl.dev/v1/scrape"
headers = {"Authorization": f"Bearer {Firecrawl_api_key}", "Content-Type": "application/json"}

# Open the Google Sheet
sh = gc.open('credit_card_details')
worksheet = sh.worksheet('card_issuers')
df = pd.DataFrame(worksheet.get_all_records())

# Extract URLs and bank names
credit_card_url_list = df['credit_card_url'].to_list()
bank_name_list = df['bank_name'].to_list()

output_directory = "/content/drive/MyDrive"
os.makedirs(output_directory, exist_ok=True)

def sanitize_json_string(raw_str):
    print("🔧 Starting JSON sanitization...")
    json_match = re.search(r'(\{.*?\})', raw_str, re.DOTALL)
    if json_match:
        raw_str = json_match.group(1)
        print("📝 Extracted JSON block from response")
    raw_str = '\n'.join(line.lstrip() for line in raw_str.splitlines())
    raw_str = re.sub(r'\n(?!\s*["}])', ' ', raw_str)
    raw_str = re.sub(r'"https":\s*"//([^\"]+?)"', r'"https://\1"', raw_str)
    raw_str = re.sub(r'"know_more_link":\s*""https":\s*"//([^\"]+)"', r'"know_more_link": "https://\1"', raw_str)
    raw_str = re.sub(r':\s*True\b', ': true', raw_str)
    raw_str = re.sub(r':\s*False\b', ': false', raw_str)
    raw_str = re.sub(r':\s*NA\b', ': null', raw_str)
    raw_str = re.sub(r':\s*"null"', ': null', raw_str)
    raw_str = re.sub(r':\s*([0-9.]+%)', r': "\1"', raw_str)
    raw_str = re.sub(r':\s*([0-9.]+\s*[+\-*/]\s*[0-9.%]+[%]?)', r': "\1"', raw_str)
    raw_str = re.sub(r':\s*([^",\{\}\[\]\n]+)(?=\s*[,\}\]\n])', lambda m: f': "{m.group(1).strip()}"', raw_str)

    # Convert stringified "null", "true", "false" to native JSON types
    raw_str = re.sub(r':\s*"null"(?=\s*[,\}])', ': null', raw_str)
    raw_str = re.sub(r':\s*"true"(?=\s*[,\}])', ': true', raw_str)
    raw_str = re.sub(r':\s*"false"(?=\s*[,\}])', ': false', raw_str)


    raw_str = re.sub(
    r'"(eligibility_criteria|full_card_description|terms_and_conditions)":\s*"([^"]*?)"([^,}]*)',
    lambda m: '"{}": "{}"{}'.format(
        m.group(1),
        m.group(2).replace('"', '\\"'),
        m.group(3)
    ),
    raw_str
    )

    raw_str = re.sub(r';\s*"', ', "', raw_str)
    raw_str = re.sub(r',\s*}', '}', raw_str)
    raw_str = re.sub(r',\s*]', ']', raw_str)
    # TEMP FIX: Flatten incorrect nesting under "security_features"
    # This handles cases where unrelated fields are wrongly nested
    match = re.search(r'"security_features":\s*\{(.*?)\}', raw_str, re.DOTALL)
    if match:
        block = match.group(1)
        entries = block.split('",')
        for entry in entries:
            if ':' not in entry:
                continue
            key, val = entry.split(':', 1)
            key = key.strip().replace('"', '')
            val = val.strip().rstrip(',') + (',' if not val.strip().endswith(',') else '')
            raw_str += f'\n"{key}": {val}'
        # Remove original security_features block completely
        raw_str = re.sub(r'"security_features":\s*\{.*?\},?', '', raw_str, flags=re.DOTALL)

    raw_str = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', raw_str)
    print("✅ JSON sanitization completed")
    return raw_str.strip()

for bank_name, target_url in zip(bank_name_list, credit_card_url_list):
    payload = {
        "url": target_url,
        "formats": ["json"],
        "jsonOptions": {
            "prompt": "Extract all name and image url of cards available on the page. "
                      "Output should be in simple format and without any sign value. "
                      "Provide the extracted information in a JSON format with the following keys: name, image_url"
        }
    }

    response = requests.post(Firecrawl_api_url, json=payload, headers=headers)

    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=4))
        if "data" in data and "json" in data["data"] and "cards" in data["data"]["json"]:
            credit_cards_raw = data["data"]["json"]["cards"]
            credit_cards = [{"card_name": card["name"].strip(), "image_url": card["image_url"].strip()} for card in credit_cards_raw]
        else:
            print("Error: 'cards' data not found in the Firecrawl response.")
            credit_cards = []
    else:
        print(f"Error: {response.status_code}, {response.text}")
        credit_cards = []

    print(len(credit_cards))

    filename_initial = f"{bank_name}_credit_cards_initial.csv"

    if credit_cards:
        with open(filename_initial, 'w', newline='') as csvfile:
            fieldnames = ['card_name', 'image_url']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(credit_cards)
        print(f"CSV file '{filename_initial}' created successfully.")
    else:
        print(f"No credit card data received from Firecrawl. '{filename_initial}' not created.")
        exit()

    # AI Agent setup
    agent = Agent(
        name="Credit Card Analyzer",
        model=Ollama(id="deepseek-r1:14b"),  #deepseek-r1:14b
        tools=[DuckDuckGo(), Newspaper4k()],
        description="You are an Indian credit card analysis expert. You analyze credit cards and extract detailed information.",
        instructions=[
            "You are an expert in analyzing Indian credit cards.",
            "For the credit card named in the input, perform the following steps:",
            "1. Search the web for detailed information about the specific credit card.",
            "2. Extract relevant details such as joining fee, annual fee, benefits, features, and links.",
            "3. Provide the extracted information in a JSON format with the following keys:",
            "card_type, card_category, card_usp, know_more_link, apply_now_link, joining_fee, annual_fee, annual_fee_waiver, "
            "add_on_card_fee, interest_rate_pa, card_replacement_fee, cash_payment_fee, duplicate_statement_fee, outstation_cheque_fee, "
            "hostlisting_charges, cash_withdrawal_fee, overdue_penalty_fee, over_limit_penalty, foreign_currency_transaction_fee, "
            "reward_point_redemption_fee, dynamic_currency_conversion_markup, education_transaction_fee, wallet_load_transaction_fee, "
            "fuel_transaction_fee, utility_transaction_fee, rewards_program, cashback_with_every_transaction, spend_based_reversal, "
            "flexipay, reward_points, rewards, features, returns_rate, welcome_benefit, welcome_points, milestone_benefit, bonus_points, "
            "fuel_benefits, dining_benefits, culinary_treats, travel_benefits, movie_benefits, OTT_benefits, cashback_offers, "
            "voucher_offers, mobile_app_benefits, stay_benefits, lifestyle_benefits, e-commerce, lounge_access, concierge_service, "
            "insurance, fraud_protection, health_and_wellness_benefits, security_features, international_use, full_card_description, "
            "eligibility_criteria, terms_and_conditions",
            "IMPORTANT: All string values must be enclosed in double quotes. Use 'null' instead of 'NA'. Use 'true'/'false' instead of 'True'/'False'.",
            "If specific information is not found, use null (without quotes) for it",
            "Do not include any introductory or concluding remarks in your response. Output only valid JSON.",
            "Every output value should be properly quoted if it's a string, and use proper JSON boolean/null values",
        ],
        markdown=True,
        show_tool_calls=True,
        add_datetime_to_instructions=True,
    )

    final_file_path = f"/content/drive/My Drive/{bank_name}_Bank_credit_cards_details.csv"
    all_card_details = []
    initial_df = pd.read_csv(filename_initial)

    for index, row in initial_df.iterrows():
        card_name = row['card_name']
        image_url = row['image_url']
        print(f"\n--- Analyzing {card_name} ---\n")
        agent_response = agent.run(card_name, stream=False)
        print("Agent Response Content:")
        pprint.pprint(agent_response.content)

        json_match = re.search(r"\{[\s\S]*\}", agent_response.content)
        if json_match:
            raw_json = json_match.group(0)
            print(f"🔍 Raw JSON found for {card_name}")
            
            cleaned_json = sanitize_json_string(raw_json)
            print(f"🧼 Cleaned JSON: {cleaned_json[:200]}...")
            
            try:
                card_data = json.loads(cleaned_json)
                card_data['card_name'] = card_name
                card_data['image_url'] = image_url
                card_data['bank_name'] = bank_name
                all_card_details.append(card_data)
                print(f"✅ Successfully parsed JSON for {card_name}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON decoding failed for {card_name}: {e}")
                print("🔍 Raw JSON:", raw_json[:500] + "..." if len(raw_json) > 500 else raw_json)
                print("🧼 Cleaned JSON:", cleaned_json[:500] + "..." if len(cleaned_json) > 500 else cleaned_json)
                
                # Try to manually fix common issues as a last resort
                try:
                    # Additional cleanup for stubborn cases
                    manual_fix = cleaned_json
                    
                    # Fix any remaining unquoted strings with specific patterns
                    manual_fix = re.sub(r':\s*([^",{\[\]}\n]+)\s*(?=,|\})', r': "\1"', manual_fix)
                    
                    # Fix double quotes around already quoted strings
                    manual_fix = re.sub(r':\s*""\s*([^"]+)\s*""\s*', r': "\1"', manual_fix)
                    
                    print("🔧 Attempting manual fix...")
                    card_data = json.loads(manual_fix)
                    card_data['card_name'] = card_name
                    card_data['image_url'] = image_url
                    card_data['bank_name'] = bank_name
                    all_card_details.append(card_data)
                    print(f"✅ Manual fix successful for {card_name}")
                except json.JSONDecodeError as e2:
                    print(f"❌ Manual fix also failed for {card_name}: {e2}")
                    print("⚠️ Skipping this card...")
        else:
            print(f"❌ No JSON found for {card_name}")

    if all_card_details:
        final_df = pd.DataFrame(all_card_details)
        column_order = ["card_name", "bank_name", "image_url", "card_type", "card_category", "card_usp", "know_more_link", "apply_now_link",
                        "joining_fee", "annual_fee", "annual_fee_waiver", "add_on_card_fee", "interest_rate_pa", "card_replacement_fee",
                        "cash_payment_fee", "duplicate_statement_fee", "outstation_cheque_fee", "hostlisting_charges", "cash_withdrawal_fee",
                        "overdue_penalty_fee", "over_limit_penalty", "foreign_currency_transaction_fee", "reward_point_redemption_fee",
                        "dynamic_currency_conversion_markup", "education_transaction_fee", "wallet_load_transaction_fee",
                        "fuel_transaction_fee", "utility_transaction_fee", "rewards_program", "cashback_with_every_transaction",
                        "spend_based_reversal", "flexipay", "reward_points", "rewards", "features", "returns_rate", "welcome_benefit",
                        "welcome_points", "milestone_benefit", "bonus_points", "fuel_benefits", "dining_benefits", "culinary_treats",
                        "travel_benefits", "movie_benefits", "OTT_benefits", "cashback_offers", "voucher_offers", "mobile_app_benefits",
                        "stay_benefits", "lifestyle_benefits", "e-commerce", "lounge_access", "concierge_service", "insurance",
                        "fraud_protection", "health_and_wellness_benefits", "security_features", "international_use",
                        "full_card_description", "eligibility_criteria", "terms_and_conditions"]

        final_df = final_df.reindex(columns=[col for col in column_order if col in final_df.columns])
        final_df.to_csv(final_file_path, index=False)
        print(f"\n✅ Detailed credit card information saved to {final_file_path}")
        print(f"📊 Total cards processed: {len(all_card_details)}")
    else:
        print("\n❌ No detailed credit card information extracted.")