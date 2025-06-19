from src.utils.utils import logger
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import csv
import pandas as pd

class ICICIBankScraper:
    """
    Scraper for ICICI Bank credit cards.
    """
    logger.info("Loading ICICI Bank credit cards class")

    def __init__(self):
        self.BASE_URL = 'https://www.icicibank.com'
        self.CREDIT_CARDS_URL = urljoin(self.BASE_URL, '/personal-banking/cards/credit-card')
        self.CSV_FILE = '/Users/aman/Welzin/Dev/credzin/output/banks/icici_bank_credit_cards.csv'
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        }

    def get_absolute_url(self, url):
        """Convert relative URLs to absolute URLs"""
        if url and not url.startswith(('http://', 'https://')):
            return urljoin(self.BASE_URL, url)
        return url

    def scrape_icici_credit_cards(self):
        try:
            # Fetch the credit cards page
            response = requests.get(self.CREDIT_CARDS_URL, headers=self.headers)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Find all credit card containers
            cards = soup.find_all('div', class_='account-variants-card-with-img')

            if not cards:
                logger.warning("No credit cards found. The page structure may have changed.")
                return []

            logger.info(f"Found {len(cards)} credit cards")

            # Prepare data list
            card_data = []

            for card in cards:
                # Card name
                name_tag = card.find('h3') or card.find('h4')
                name = name_tag.get_text(strip=True) if name_tag else "N/A"

                # Image URL
                img_tag = card.find('img')
                img_url = self.get_absolute_url(img_tag['src']) if img_tag and 'src' in img_tag.attrs else "N/A"
                img_alt = img_tag.get('alt', '') if img_tag else ""

                # Know more link
                know_more_tag = card.find('a', class_='ic-more')
                know_more_url = self.get_absolute_url(know_more_tag['href']) if know_more_tag and 'href' in know_more_tag.attrs else "N/A"

                # Append to data list
                card_data.append({
                    'Card Name': name,
                    'Image URL': img_url,
                    'Image Alt Text': img_alt,
                    'Know More Link': know_more_url
                })

            return card_data

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching data: {e}")
            return []
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            return []

    def save_to_csv(self, data):
        if not data:
            logger.warning("No data to save")
            return

        try:
            with open(self.CSV_FILE, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['Card Name', 'Image URL', 'Image Alt Text', 'Know More Link']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

                writer.writeheader()
                writer.writerows(data)

            logger.info(f"Data successfully saved to {self.CSV_FILE}")
        except Exception as e:
            logger.error(f"Error saving to CSV: {e}")

    def scrape(self):
        card_data = self.scrape_icici_credit_cards()
        if card_data:
            self.save_to_csv(card_data) 