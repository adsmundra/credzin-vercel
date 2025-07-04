
import os
import re
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig
from crawl4ai.deep_crawling import BestFirstCrawlingStrategy
from crawl4ai.deep_crawling.filters import FilterChain, DomainFilter, URLPatternFilter, ContentTypeFilter
from crawl4ai.deep_crawling.scorers import KeywordRelevanceScorer

# Output directory
OUTPUT_DIR = "Output/sites/technofino/articles_new"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Custom filter to exclude unwanted paths
class ExcludeCommunity:
    def apply(self, url, **kwargs):
        return "/community/" not in url and "/forums/" not in url

# Clean filename for saving
def sanitize_filename(title):
    filename = re.sub(r'[\\/*?:"<>|]', "", title)
    return filename.strip().replace(" ", "_")[:100] + ".md"

# Crawl a specific section
async def crawl_section(name, base_url, patterns, keywords, weight=0.8):
    collected_urls = set()

    print(f"\n--- Crawling: {name} ---")
    
    filter_chain = FilterChain([
        DomainFilter(allowed_domains=["www.technofino.in"]),
        ExcludeCommunity(),
        ContentTypeFilter(allowed_types=["text/html"]),
        URLPatternFilter(patterns=patterns),
    ])

    scorer = KeywordRelevanceScorer(keywords=keywords, weight=weight)

    config = CrawlerRunConfig(
        deep_crawl_strategy=BestFirstCrawlingStrategy(
            max_depth=3,
            include_external=False,
            filter_chain=filter_chain,
            url_scorer=scorer,
        ),
        stream=True,
        verbose=True,
    )

    async with AsyncWebCrawler() as crawler:
        async for result in await crawler.arun(base_url, config=config):
            url = result.url
            score = result.metadata.get("score", 0)
            depth = result.metadata.get("depth", 0)
            print(f"Depth: {depth} | Score: {score:.2f} | {url}")
            collected_urls.add(url)

    print(f"\nCollected {len(collected_urls)} article URLs from '{name}':")
    for url in collected_urls:
        print(url)

    return list(collected_urls)

# Extract and save article content
async def extract_and_save_article(session, url):
    try:
        async with session.get(url, timeout=30) as response:
            if response.status != 200:
                print(f"Failed to fetch: {url} (status {response.status})")
                return

            html = await response.text()
            soup = BeautifulSoup(html, "html.parser")

            # Extract title
            title_tag = soup.find("h1") or soup.title
            title = title_tag.get_text(strip=True) if title_tag else "untitled"

            # Extract main article content
            article = soup.find("div", class_="td-post-content") or soup.find("article")
            if not article:
                print(f"No article content found for {url}")
                return

            paragraphs = article.find_all("p")
            content = "\n\n".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))

            if not content.strip():
                print(f"Empty article content for {url}")
                return

            # Save to file
            filename = sanitize_filename(title)
            filepath = os.path.join(OUTPUT_DIR, filename)

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(f"# {title}\n\n")
                f.write(f"Source: {url}\n\n")
                f.write(content)

            print(f"✅ Saved: {filepath}")

    except Exception as e:
        print(f"❌ Error processing {url}: {e}")

# Process all collected article URLs
async def process_articles(urls):
    print(f"\n--- Starting article extraction from {len(urls)} URLs ---\n")
    async with aiohttp.ClientSession() as session:
        tasks = [extract_and_save_article(session, url) for url in urls]
        await asyncio.gather(*tasks)

# Main execution
async def main():
    all_links = []

    sections = [
        {
            "name": "All Posts",
            "base_url": "https://www.technofino.in/category/all-post/",
            "patterns": ["*/category/all-post/*", "*credit-card*", "*review*", "*guides*"],
            "keywords": ["credit card", "review", "rewards", "fees", "benefits", "guide", "offers"]
        },
        {
            "name": "Loyalty Guides",
            "base_url": "https://www.technofino.in/category/loyalty-guides/",
            "patterns": ["*category/loyalty-guides/*", "*loyalty*", "*airline*", "*guide*", "*rewards*"],
            "keywords": ["loyalty", "airline", "rewards", "miles", "points", "membership"]
        },
        {
            "name": "Credit Cards",
            "base_url": "https://www.technofino.in/category/credit-card/",
            "patterns": ["*category/credit-card/*", "*credit-card*", "*review*", "*comparison*", "*guide*"],
            "keywords": ["credit card", "review", "annual fee", "rewards", "joining bonus", "lounge access", "cashback"],
            "weight": 0.85
        },
        {
            "name": "Best Credit Cards",
            "base_url": "https://www.technofino.in/category/credit-card/best-credit-cards/",
            "patterns": ["*category/credit-card/best-credit-cards/*", "*best-credit-cards*", "*top*", "*credit-card*"],
            "keywords": ["best credit card", "top credit cards", "comparison", "benefits", "rewards", "cashback"],
            "weight": 0.85
        },
        {
            "name": "Airline Loyalty Guides",
            "base_url": "https://www.technofino.in/category/loyalty-guides/airline-loyalty-guides/",
            "patterns": ["*category/loyalty-guides/airline-loyalty-guides/*", "*airline*", "*miles*", "*frequent-flyer*", "*travel*", "*loyalty*"],
            "keywords": ["airline", "loyalty program", "frequent flyer", "miles", "membership", "rewards", "travel"],
            "weight": 0.85
        }
    ]

    # Crawl all sections
    for section in sections:
        links = await crawl_section(
            section["name"],
            section["base_url"],
            section["patterns"],
            section["keywords"],
            section.get("weight", 0.8)
        )
        all_links.extend(links)

    # Remove duplicates
    all_links = list(set(all_links))
    print(f"\n=== Total unique URLs collected: {len(all_links)} ===")

    # Extract and save articles
    await process_articles(all_links)

# Run the script
if __name__ == "__main__":
    asyncio.run(main())
