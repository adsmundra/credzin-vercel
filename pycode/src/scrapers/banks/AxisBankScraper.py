from src.utils.utils import logger

import csv
import os
from bs4 import BeautifulSoup
import requests
from urllib.parse import urljoin

class AxisBankScraper:
    """
    Scraper for Axis Bank credit cards.
    """
    logger.info("Loading Axis Bank credit cards class")

    def __init__(self):
        self.BANK_URL = "https://www.axisbank.com/retail/cards/credit-card"
        self.APPLY_NOW_LINK = "https://web.axisbank.co.in/DigitalChannel/WebForm/?index6&utm_content=cclisting&utm_campaign=cciocl&utm_source=website&axisreferralcode=iocllisting"
        self.CSV_FILE = '/Users/aman/Welzin/Dev/credzin/output/banks/axis_bank_credit_cards.csv'

    def scrape_reward_information(self, url):
        # Fetch the "Know More" page
        response = requests.get(url)
        if response.status_code != 200:
            logger.error(f"Failed to retrieve the page: {url}. Status code: {response.status_code}")
            return []

        # Parse the HTML content
        soup = BeautifulSoup(response.content, 'html.parser')

        # Find all reward cards
        reward_cards = soup.find_all('div', class_='temp1-card swiper-slide')

        # Create a list to store reward data
        rewards_data = []

        # Loop through each reward card and extract details
        for card in reward_cards:
            try:
                # Extract the reward title
                title_tag = card.find('h3')
                title = title_tag.text.strip() if title_tag else "N/A"

                # Extract the reward description
                description_tag = card.find('div', class_='moreCont')
                description = description_tag.text.strip() if description_tag else "N/A"

                # Extract the terms and conditions link (if available)
                terms_link_tag = card.find('a', class_='pdf-data')
                terms_link = urljoin(url, terms_link_tag['href']) if terms_link_tag and 'href' in terms_link_tag.attrs else "No link available"

                # Add reward data to the list
                rewards_data.append({
                    'Title': title,
                    'Description': description,
                    'Terms and Conditions Link': terms_link
                })
            except Exception as e:
                logger.error(f"Error processing reward card: {e}")

        return rewards_data

    def scrape_bank_credit_cards(self, url):
        # Send a GET request to fetch the page content
        response = requests.get(url)
        if response.status_code != 200:
            logger.error(f"Failed to retrieve the page: {url}. Status code: {response.status_code}")
            return []

        # Parse the HTML content
        soup = BeautifulSoup(response.content, 'html.parser')

        # Find all credit card items
        card_items = soup.find_all('div', class_='card-item')

        # Create a list to store card data
        cards_data = []

        # Loop through each card item and extract details
        for card in card_items:
            try:
                # Extract card name
                card_name_tag = card.find('h3')
                card_name = card_name_tag.get_text(strip=True).replace('\n', ' ') if card_name_tag else "N/A"

                # Extract features (list items)
                features = [li.get_text(strip=True) for li in card.find_all('li')]

                # Extract joining fee
                joining_fee_tag = card.find('p', string=lambda x: x and 'Joining Fee' in x)
                if joining_fee_tag:
                    joining_fee = joining_fee_tag.find('strong').get_text(strip=True) if joining_fee_tag.find('strong') else joining_fee_tag.get_text(strip=True)
                else:
                    # Alternative approach: Search for text containing "Joining Fee"
                    joining_fee_text = card.find(string=lambda x: x and 'Joining Fee' in x)
                    if joining_fee_text:
                        joining_fee = joining_fee_text.find_next('strong').get_text(strip=True) if joining_fee_text.find_next('strong') else joining_fee_text.strip()
                    else:
                        joining_fee = "N/A"

                # Extract annual fee
                annual_fee_tag = card.find('p', string=lambda x: x and 'Annual Fee' in x)
                if annual_fee_tag:
                    annual_fee = annual_fee_tag.find('strong').get_text(strip=True) if annual_fee_tag.find('strong') else annual_fee_tag.get_text(strip=True)
                else:
                    # Alternative approach: Search for text containing "Annual Fee"
                    annual_fee_text = card.find(string=lambda x: x and 'Annual Fee' in x)
                    if annual_fee_text:
                        annual_fee = annual_fee_text.find_next('strong').get_text(strip=True) if annual_fee_text.find_next('strong') else annual_fee_text.strip()
                    else:
                        annual_fee = "N/A"

                # Extract "Know More" link
                know_more_link_tag = card.find('a', class_='btn1')
                know_more_link = urljoin(url, know_more_link_tag['href']) if know_more_link_tag else "N/A"

                # Use the hardcoded Apply Now link
                apply_now_link = self.APPLY_NOW_LINK

                # Extract credit card image URL
                image_div = card.find('div', class_='cards-img')
                if image_div:
                    image_tag = image_div.find('img')
                    if image_tag and 'src' in image_tag.attrs:
                        image_url = urljoin(url, image_tag['src'])  # Convert relative URL to absolute URL
                    else:
                        image_url = "N/A"
                else:
                    image_url = "N/A"

                # Scrape reward information from the "Know More" page
                rewards = []
                if know_more_link != "N/A":
                    rewards = self.scrape_reward_information(know_more_link)

                # Add card data to the list
                cards_data.append({
                    'Card Name': card_name,
                    'Features': features,  # Keep features as a list for now
                    'Joining Fee': joining_fee,
                    'Annual Fee': annual_fee,
                    'Know More Link': know_more_link,
                    'Apply Now Link': apply_now_link,
                    'Image URL': image_url,
                    'Rewards': rewards  # Add rewards as a list of dictionaries
                })
            except Exception as e:
                logger.error(f"Error processing card: {e}")

        return cards_data

    def scrape(self):
        # Check if the CSV file already exists
        if os.path.exists(self.CSV_FILE):
            # Read existing data to avoid duplicates
            existing_card_names = set()
            with open(self.CSV_FILE, 'r', newline='', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    existing_card_names.add(row['Card Name'])

            # Open the CSV file in append mode
            with open(self.CSV_FILE, 'a', newline='', encoding='utf-8') as file:
                writer = csv.DictWriter(file, fieldnames=['Card Name', 'Features', 'Joining Fee', 'Annual Fee', 'Know More Link', 'Apply Now Link', 'Image URL', 'Rewards'])

                # Scrape data from Axis Bank
                logger.info(f"Scraping data from: {self.BANK_URL}")
                new_cards_data = self.scrape_bank_credit_cards(self.BANK_URL)

                # Append only new cards
                for card in new_cards_data:
                    if card['Card Name'] not in existing_card_names:
                        # Convert features and rewards lists to strings enclosed in quotes
                        card['Features'] = '"' + ', '.join(card['Features']) + '"'
                        card['Rewards'] = '"' + str(card['Rewards']) + '"'
                        writer.writerow(card)
                        logger.info(f"Added: {card['Card Name']}")
                    else:
                        logger.info(f"⚠️ Skipped (already exists): {card['Card Name']}")
        else:
            # Create a new CSV file and write the header
            with open(self.CSV_FILE, 'w', newline='', encoding='utf-8') as file:
                writer = csv.DictWriter(file, fieldnames=['Card Name', 'Features', 'Joining Fee', 'Annual Fee', 'Know More Link', 'Apply Now Link', 'Image URL', 'Rewards'])
                writer.writeheader()  # Write the header row

                # Scrape data from Axis Bank
                logger.info(f"Scraping data from: {self.BANK_URL}")
                new_cards_data = self.scrape_bank_credit_cards(self.BANK_URL)

                # Write all new cards
                for card in new_cards_data:
                    # Convert features and rewards lists to strings enclosed in quotes
                    card['Features'] = '"' + ', '.join(card['Features']) + '"'
                    card['Rewards'] = '"' + str(card['Rewards']) + '"'
                    writer.writerow(card)
                    logger.info(f"Added: {card['Card Name']}")