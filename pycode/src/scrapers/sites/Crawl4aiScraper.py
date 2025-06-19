import crawl4ai
print(crawl4ai.__version__.__version__)

import asyncio
import os
import re
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig
from crawl4ai.deep_crawling import BFSDeepCrawlStrategy
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.content_filter_strategy import PruningContentFilter

# Define the base URL and output directory
#BASE_URL = "https://cardinsider.com/"
#OUTPUT_DIR = "/Users/aman/Welzin/dev/credzin/output/sites/cardinsider/articles/"

BASE_URL = "https://www.technofino.in/category/credit-card/credit-card-reviews/"
OUTPUT_DIR = "/Users/aman/Welzin/dev/credzin/output/sites/technofino/articles/"

# Ensure the output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Function to sanitize filenames
def sanitize_filename(title):
    # Remove invalid characters and limit length
    filename = re.sub(r'[\\/*?:"<>|]', "", title)
    return filename.strip().replace(" ", "_")[:100] + ".md"

async def main():
    # Initialize the crawler
    async with AsyncWebCrawler() as crawler:
        # Set up the crawling configuration
        config = CrawlerRunConfig(
            deep_crawl_strategy=BFSDeepCrawlStrategy(
                max_depth=1,               # Adjust depth as needed
                include_external=False     # Stay within the same domain
            ),
            markdown_generator=DefaultMarkdownGenerator(
                content_filter=PruningContentFilter()
            ),
            verbose=True
        )

        # Start the crawling process
        results = await crawler.arun(BASE_URL, config=config)

        print(f"Total pages crawled: {len(results)}")

        # Process each crawled page
        for result in results:
            # Skip non-article pages based on URL pattern
            if not result.url.startswith("https://www.technofino.in/category/credit-card/credit-card-reviews/"):
                continue

            # Extract the title and content
            title = result.metadata.get("title", "untitled")
            content = result.markdown or ""

            # Sanitize the filename
            filename = sanitize_filename(title)

            # Define the full path for the output file
            file_path = os.path.join(OUTPUT_DIR, filename)

            # Write the content to the Markdown file
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(f"# {title}\n\n")
                f.write(content)

            print(f"Saved article: {file_path}")

# Run the asynchronous main function
if __name__ == "__main__":
    asyncio.run(main())