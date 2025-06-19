from src.utils.utils import logger
import csv
import requests
from bs4 import BeautifulSoup
import os
import time

class SBIBankScraper:
    """
    Scraper for SBI Bank credit cards.
    """
    logger.info("Loading SBI Bank credit cards class")
    
    def __init__(self):
        self.CSV_FILE = '/Users/aman/Welzin/Dev/credzin/output/banks/sbi_bank_credit_cards.csv'
        self.MAIN_URL = "https://www.sbicard.com/en/personal/credit-cards.page"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
        logger.info("Initialized SBI Bank Scraper")

    def get_existing_card_names(self):
        if not os.path.exists(self.CSV_FILE):
            logger.info(f"CSV file {self.CSV_FILE} does not exist. Will create new file.")
            return set()

        existing_cards = set()
        try:
            with open(self.CSV_FILE, mode="r", encoding="utf-8") as file:
                reader = csv.reader(file)
                next(reader, None)  # Skip header
                for row in reader:
                    if row:
                        existing_cards.add(row[0])  # Card Name is the first column
            logger.info(f"Found {len(existing_cards)} existing cards in CSV file")
        except Exception as e:
            logger.error(f"Error reading existing cards: {str(e)}")
        return existing_cards

    def extract_features(self, learn_more_url):
        try:
            logger.info(f"Extracting features from: {learn_more_url}")
            response = requests.get(learn_more_url, headers=self.headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try different possible selectors for features
            features = {}
            
            # Method 1: Look for tab-content section
            tab_content = soup.find('div', class_='tab-inner-content', id='feature-1-tab')
            if tab_content:
                logger.info("Found features in tab-content section")
                for feature in tab_content.find_all('li'):
                    heading = feature.find('h3')
                    if heading:
                        feature_name = heading.text.strip()
                        feature_details = [detail.text.strip() for detail in feature.find_all('li')]
                        features[feature_name] = feature_details
            
            # Method 2: Look for features in card details
            if not features:
                features_section = soup.find('div', class_='card-details')
                if features_section:
                    logger.info("Found features in card-details section")
                    for feature in features_section.find_all(['h3', 'h4']):
                        feature_name = feature.text.strip()
                        feature_details = []
                        next_elem = feature.find_next(['ul', 'p'])
                        if next_elem:
                            if next_elem.name == 'ul':
                                feature_details = [li.text.strip() for li in next_elem.find_all('li')]
                            else:
                                feature_details = [next_elem.text.strip()]
                        features[feature_name] = feature_details
            
            if features:
                logger.info(f"Successfully extracted {len(features)} features")
            else:
                logger.warning("No features found")
            
            return features if features else None
            
        except Exception as e:
            logger.error(f"Error extracting features from {learn_more_url}: {str(e)}")
            return None

    def extract_fees(self, learn_more_url):
        try:
            logger.info(f"Extracting fees from: {learn_more_url}")
            response = requests.get(learn_more_url, headers=self.headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            fees = {}
            
            # Try different possible selectors for fees
            # Method 1: Look for fees tab
            fees_section = soup.find('div', class_='tab-inner-content', id='feature-2-tab')
            if fees_section:
                logger.info("Found fees in tab-content section")
                fees_list = fees_section.find('h3', string="Fees")
                if fees_list:
                    fee_items = fees_list.find_next('ul')
                    if fee_items:
                        fees["Fees"] = [li.get_text(strip=True) for li in fee_items.find_all('li')]
            
            # Method 2: Look for fees in card details
            if not fees:
                fees_section = soup.find('div', class_='card-details')
                if fees_section:
                    logger.info("Found fees in card-details section")
                    fees_heading = fees_section.find(['h3', 'h4'], string=lambda x: x and 'fee' in x.lower())
                    if fees_heading:
                        fees_list = fees_heading.find_next('ul')
                        if fees_list:
                            fees["Fees"] = [li.get_text(strip=True) for li in fees_list.find_all('li')]
            
            if fees:
                logger.info(f"Successfully extracted {len(fees.get('Fees', []))} fee items")
            else:
                logger.warning("No fees found")
            
            return fees if fees else None
            
        except Exception as e:
            logger.error(f"Error extracting fees from {learn_more_url}: {str(e)}")
            return None

    def scrape(self):
        logger.info("Starting SBI Bank credit card scraping...")
        
        try:
            # Send a GET request to the main webpage with retries
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    logger.info(f"Attempting to fetch {self.MAIN_URL} (Attempt {attempt + 1}/{max_retries})")
                    response = requests.get(self.MAIN_URL, headers=self.headers)
                    response.raise_for_status()
                    logger.info("Successfully fetched the webpage")
                    break
                except requests.exceptions.RequestException as e:
                    if attempt == max_retries - 1:
                        raise
                    logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                    time.sleep(2)  # Wait before retrying

            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try different possible selectors for card containers
            card_containers = soup.find_all('div', class_='grid col-2')
            if not card_containers:
                logger.info("Trying alternative selector: credit-card-item")
                card_containers = soup.find_all('div', class_='credit-card-item')
            if not card_containers:
                logger.info("Trying alternative selector: card-container")
                card_containers = soup.find_all('div', class_='card-container')
            
            if not card_containers:
                logger.error("No card containers found. The page structure may have changed.")
                return

            logger.info(f"Found {len(card_containers)} card containers")

            # Load existing cards
            existing_cards = self.get_existing_card_names()

            # Create output directory if it doesn't exist
            os.makedirs(os.path.dirname(self.CSV_FILE), exist_ok=True)
            logger.info(f"Ensured output directory exists: {os.path.dirname(self.CSV_FILE)}")

            # Open CSV file in append mode
            with open(self.CSV_FILE, mode="a", newline="", encoding="utf-8") as file:
                writer = csv.writer(file)

                # Write header only if file is empty
                if os.stat(self.CSV_FILE).st_size == 0:
                    writer.writerow(["Card Name", "Benefits", "Features", "Fees", "Learn More URL", "Apply Now URL", "Front Image URL", "Back Image URL"])
                    logger.info("Created new CSV file with headers")

                # Loop through each card container
                for container in card_containers:
                    try:
                        # Try different possible selectors for card name
                        card_name_tag = container.find(['h4', 'h3', 'h2'])
                        if not card_name_tag:
                            logger.warning("Could not find card name in container")
                            continue
                            
                        card_name = card_name_tag.text.strip()
                        logger.info(f"Processing card: {card_name}")

                        # Skip if already added
                        if card_name in existing_cards:
                            logger.info(f"⚠️ Skipping {card_name} (Already in CSV)")
                            continue

                        # Try different possible selectors for learn more link
                        learn_more_link = None
                        for link_class in ['learn-more-link', 'know-more', 'details-link']:
                            link = container.find('a', class_=link_class)
                            if link and 'href' in link.attrs:
                                learn_more_link = link['href']
                                logger.info(f"Found learn more link with class: {link_class}")
                                break
                                
                        if not learn_more_link:
                            logger.warning(f"No learn more link found for {card_name}")
                            continue
                            
                        learn_more_url = f"https://www.sbicard.com{learn_more_link}" if not learn_more_link.startswith('http') else learn_more_link

                        # Extract Apply Now URL
                        apply_now_url = "N/A"
                        for button_class in ['button primary', 'apply-now', 'apply-button']:
                            apply_link = container.find('a', class_=button_class)
                            if apply_link and 'href' in apply_link.attrs:
                                apply_now_url = f"https://www.sbicard.com{apply_link['href']}" if not apply_link['href'].startswith('http') else apply_link['href']
                                logger.info(f"Found apply now link with class: {button_class}")
                                break

                        # Extract Card Images
                        front_image = "N/A"
                        back_image = "N/A"
                        
                        # Try different possible selectors for front image
                        img_container = container.find(['picture', 'div', 'img'])
                        if img_container:
                            if img_container.name == 'picture':
                                source = img_container.find('source')
                                if source and 'srcset' in source.attrs:
                                    front_image = source['srcset']
                                    logger.info("Found front image in picture source")
                            elif img_container.name == 'img':
                                front_image = img_container.get('src', 'N/A')
                                logger.info("Found front image in img tag")
                            else:
                                img = img_container.find('img')
                                if img and 'src' in img.attrs:
                                    front_image = img['src']
                                    logger.info("Found front image in nested img tag")
                                    
                        # Try to find back image
                        back_img = container.find('div', class_=['card-features back', 'card-back'])
                        if back_img:
                            img = back_img.find('img')
                            if img and 'src' in img.attrs:
                                back_image = img['src']
                                logger.info("Found back image")

                        # Extract Benefits
                        benefits = []
                        benefits_section = container.find(['ul', 'div'], class_=['benefits', 'features'])
                        if benefits_section:
                            benefits = [li.get_text(strip=True).replace('Rs.', 'Rs. ') for li in benefits_section.find_all('li')]
                            logger.info(f"Found {len(benefits)} benefits")

                        # Extract Features & Fees from "Learn More" page
                        features = self.extract_features(learn_more_url)
                        fees = self.extract_fees(learn_more_url)

                        # Log extracted details for debugging
                        logger.info(f"✅ Successfully processed {card_name}")
                        logger.info(f"Learn More URL: {learn_more_url}")
                        logger.info(f"Apply Now URL: {apply_now_url}")
                        logger.info(f"Front Image URL: {front_image}")
                        logger.info(f"Back Image URL: {back_image}")

                        if benefits:
                            logger.info("\n**Benefits**")
                            for benefit in benefits:
                                logger.info(f"  - {benefit}")

                        if features:
                            logger.info("\n**Features**")
                            for feature, details in features.items():
                                logger.info(f"{feature}:")
                                for detail in details:
                                    logger.info(f"  - {detail}")

                        if fees and "Fees" in fees:
                            logger.info("\n**Fees**")
                            for detail in fees["Fees"]:
                                logger.info(f"  - {detail}")

                        logger.info("-" * 50)

                        # Write new data to CSV file
                        writer.writerow([
                            card_name,
                            ", ".join(benefits),
                            str(features) if features else "N/A",
                            str(fees["Fees"]) if fees and "Fees" in fees else "N/A",
                            learn_more_url,
                            apply_now_url,
                            front_image,
                            back_image
                        ])
                        logger.info(f"Successfully wrote {card_name} to CSV")
                        
                    except Exception as e:
                        logger.error(f"Error processing card container: {str(e)}")
                        continue

            logger.info(f"\n✅ Data successfully saved to {self.CSV_FILE}")

        except Exception as e:
            logger.error(f"❌ Error during scraping: {str(e)}")
            raise