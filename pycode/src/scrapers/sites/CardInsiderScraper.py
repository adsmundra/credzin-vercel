from src.Utils.utils import logger
import requests
from bs4 import BeautifulSoup
import json
import re
import csv
import pandas as pd

class CardInsiderScraper:
    """
    Scraper for CardInsider credit cards.
    """
    logger.info("Loading CardInsider credit cards class")
    
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        }

    def get_bank_url(self, bank_name):
        """Get the CardInsider URL for a specific bank."""
        return f'https://cardinsider.com/{bank_name.lower()}-bank/'

    def clean_text(self, text):
        """Clean text by removing extra whitespace and newlines."""
        return re.sub(r"[\n\t]+", " ", text).strip()

    def scrape_bank_cards(self, bank_name):
        """Scrape credit cards for a specific bank."""
        url = self.get_bank_url(bank_name)
        response = requests.get(url, headers=self.headers)
        soup = BeautifulSoup(response.content, 'html.parser')
        cards = soup.find_all('div', class_='single_credit_card_box')
        logger.info(f"Found {len(cards)} cards for {bank_name}")

        card_data = []
        for card in cards:
            card_name_tag = card.find('h3', class_='single-card-title')
            if card_name_tag:
                card_name = card_name_tag.text.strip()
                know_more_link = card_name_tag.find('a')['href'] if card_name_tag.find('a') else "N/A"
            else:
                card_name = "N/A"
                know_more_link = "N/A"

            img_tag = card.find('img', class_='img-fluid image-ovrlay')
            if img_tag and 'data-lazy-src' in img_tag.attrs:
                card_image = img_tag['data-lazy-src']
            elif img_tag and 'src' in img_tag.attrs:
                card_image = img_tag['src']
            else:
                card_image = "N/A"

            # Fees
            fees = card.find_all('div', class_='col-md-9')
            joining_fee = fees[0].text.strip() if len(fees) > 0 else "N/A"
            renewal_fee = fees[1].text.strip() if len(fees) > 1 else "N/A"

            # Best Suited For
            best_suited_for = card.find('h4', text='Best Suited For')
            best_suited_for = best_suited_for.find_next('p').text.strip() if best_suited_for else "N/A"

            # Reward Type
            reward_type = card.find('h4', text='Reward Type')
            reward_type = reward_type.find_next('p').text.strip() if reward_type else "N/A"

            # Welcome Benefits
            welcome_benefits = card.find('h4', text='Welcome Benefits')
            welcome_benefits = welcome_benefits.find_next('div').text.strip() if welcome_benefits else "N/A"

            card_data.append({
                "card_name": self.clean_text(card_name),
                "Image Link": card_image,
                "Know More Link": know_more_link,
                "Joining Fee": self.clean_text(joining_fee),
                "Renewal Fee": self.clean_text(renewal_fee),
                "Best Suited For": self.clean_text(best_suited_for),
                "Reward Type": self.clean_text(reward_type),
                "Welcome Benefits": self.clean_text(welcome_benefits)
            })

        return card_data

    def get_card_benefits(self, link):
        """Get detailed benefits for a specific card."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Referer": "https://www.google.com/"
        }

        try:
            response = requests.get(link, headers=headers)
            if response.status_code != 200:
                logger.error(f"Failed to retrieve the page: {link}. Status code: {response.status_code}")
                return None

            soup = BeautifulSoup(response.content, 'html.parser')

            card_details = {
                'card_name': 'N/A',
                'benefits': {},
                'additional_info': []
            }

            card_name_tag = soup.find('h2', class_='title_list_link') or soup.find('h1', class_='single-card-title')
            if card_name_tag:
                card_details['card_name'] = card_name_tag.text.strip()

            rewards_section = soup.find('div', id='rewards-and-benefits')
            if not rewards_section:
                rewards_section = soup.find('div', class_='card-body row')

            if rewards_section:
                benefit_items = rewards_section.find_all('div', class_=lambda x: x and any(cls in x.split() for cls in ['col-xs-12', 'col-sm-6', 'col-lg-6']))

                for item in benefit_items:
                    title = item.find('h4', class_='list_credit_title')
                    description = item.find('p', class_='list_credit_dec')

                    if title and description:
                        title_text = title.get_text(strip=True)
                        desc_text = description.get_text(strip=True)
                        card_details['benefits'][title_text] = desc_text

            combined_benefits = []
            for title, desc in card_details['benefits'].items():
                combined_benefits.append(f"{title}\n{desc}")
            all_benefits = "\n\n".join(combined_benefits)

            additional_sections = soup.find_all(['div', 'section'], class_=lambda x: x and any(cls in x.split() for cls in ['col-md-12', 'btm-dec', 'entry-content', 'card-features']))

            for section in additional_sections:
                if section == rewards_section:
                    continue

                for element in section.find_all(['p', 'h2', 'h3', 'h4', 'li']):
                    text = element.get_text(' ', strip=True)
                    if text and text not in card_details['additional_info']:
                        card_details['additional_info'].append(text)

            formatted_additional_info = "\n".join(card_details['additional_info'])

            return {
                'card_name': card_details['card_name'],
                'all_benefits': all_benefits,
                'benefits_dict': card_details['benefits'],
                'additional_info': formatted_additional_info
            }

        except Exception as e:
            logger.error(f"Error processing {link}: {str(e)}")
            return None

    def save_to_csv(self, data, filename):
        """Save data to a CSV file."""
        if not data:
            logger.warning("No data to save")
            return

        try:
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = data[0].keys()
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)

            logger.info(f"Data successfully saved to {filename}")
        except Exception as e:
            logger.error(f"Error saving to CSV: {e}")

    def merge_csv_files(self, file1_path, file2_path, output_path):
        """Merge two CSV files based on the 'card name' column."""
        try:
            df1 = pd.read_csv(file1_path)
            df2 = pd.read_csv(file2_path)

            if 'card_name' not in df1.columns or 'card_name' not in df2.columns:
                raise ValueError("Both CSV files must contain a 'card name' column")

            merged_df = pd.merge(df1, df2, on='card_name', how='outer')
            merged_df.to_csv(output_path, index=False)

            logger.info(f"Successfully merged files. Output saved to {output_path}")
            logger.info(f"Merged file contains {len(merged_df)} rows")

        except Exception as e:
            logger.error(f"An error occurred: {str(e)}")

    def scrape(self, bank_names):
        """Main scraping method that handles the entire process for multiple banks."""
        for bank in bank_names:
            logger.info(f"Scraping {bank.upper()} Bank cards from CardInsider...")
            
            # Scrape basic card information
            card_data = self.scrape_bank_cards(bank)
            if not card_data:
                logger.warning(f"No cards found for {bank.upper()} Bank")
                continue

            # Save basic card information
            basic_csv = f"/Users/aman/Welzin/Dev/credzin/output/sites/cardinsider/credit_cards_{bank.upper()}_BANK.csv"
            self.save_to_csv(card_data, basic_csv)

            # Get detailed benefits for each card
            all_card_data = []
            for card in card_data:
                if card['Know More Link'] != "N/A":
                    card_details = self.get_card_benefits(card['Know More Link'])
                    if card_details:
                        card_details['source_url'] = card['Know More Link']
                        all_card_data.append(card_details)
                        logger.info(f"Processed: {card['Know More Link']}")
                        logger.info(f"Card Name: {card_details['card_name']}")
                        logger.info("---")

            # Save detailed card information
            if all_card_data:
                detail_csv = f"/Users/aman/Welzin/Dev/credzin/output/sites/cardinsider/credit_cards_{bank.upper()}_BANK_detail.csv"
                fieldnames = ['card_name', 'source_url', 'all_benefits', 'additional_info']
                
                with open(detail_csv, 'w', newline='', encoding='utf-8') as file:
                    writer = csv.DictWriter(file, fieldnames=fieldnames)
                    writer.writeheader()
                    for card in all_card_data:
                        if 'benefits_dict' in card:
                            card['benefits_dict'] = "\n".join(
                                f"{k}: {v}" for k, v in card['benefits_dict'].items()
                            )
                        row = {field: card.get(field, "") for field in fieldnames}
                        writer.writerow(row)

                # Merge basic and detailed information
                output_file = f'/Users/aman/Welzin/Dev/credzin/output/sites/cardinsider/Final_card_Inside_{bank.upper()}_bank.csv'
                self.merge_csv_files(basic_csv, detail_csv, output_file)
