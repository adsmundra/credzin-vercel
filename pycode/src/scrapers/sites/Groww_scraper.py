# import asyncio
# import aiohttp
# from bs4 import BeautifulSoup

# BASE_URL = "https://groww.in"
# BLOG_LISTING_URL = BASE_URL + "/blog?page={}"
# TOTAL_PAGES = 236  # You can adjust this if needed

# # Extract article links from a given blog listing page
# async def fetch_article_links(session, page_number):
#     url = BLOG_LISTING_URL.format(page_number)
#     try:
#         async with session.get(url, timeout=20) as response:
#             if response.status != 200:
#                 print(f"Failed to fetch page {page_number}")
#                 return set()

#             html = await response.text()
#             soup = BeautifulSoup(html, "html.parser")

#             # Collect all blog links
#             links = {
#                 BASE_URL + a["href"].split("?")[0]
#                 for a in soup.select("a[href^='/blog/']")
#                 if not a["href"].startswith("/blog?page=")
#             }

#             print(f"Page {page_number}: {len(links)} links")
#             return links

#     except Exception as e:
#         print(f"Error fetching page {page_number}: {e}")
#         return set()

# # Entrypoint
# async def main():
#     all_links = set()

#     async with aiohttp.ClientSession() as session:
#         tasks = [fetch_article_links(session, page) for page in range(1, TOTAL_PAGES + 1)]
#         results = await asyncio.gather(*tasks)

#         for page_links in results:
#             all_links.update(page_links)

#     print(f"\n=== Total unique blog article links collected: {len(all_links)} ===")
#     # Print all links (optional)
#     for link in sorted(all_links):
#         print(link)

# if __name__ == "__main__":
#     asyncio.run(main())




# import asyncio
# from crawl4ai import AsyncWebCrawler, CrawlerRunConfig
# from crawl4ai.deep_crawling import BestFirstCrawlingStrategy
# from crawl4ai.deep_crawling.filters import FilterChain, DomainFilter, ContentTypeFilter

# BASE_URL = "https://groww.in/blog"

# async def main():
#     # Crawler settings
#     run_config = CrawlerRunConfig(
#         max_pages=1,
#         exclude_external_links=True,
#         scan_full_page=True,
#     )

#     # Apply domain and content-type filters
#     filters = FilterChain(filters=[
#         DomainFilter(domains=["groww.in"]),
#         ContentTypeFilter(allowed_content_types=["text/html"]),
#     ])

#     # Use Best-First deep crawl strategy
#     strategy = BestFirstCrawlingStrategy(
#         run_config=run_config,
#         filter_chain=filters
#     )

#     # Set to collect all unique links
#     unique_links = set()

#     async with AsyncWebCrawler(strategy=strategy) as crawler:
#         results = await crawler.arun(seed_urls=[BASE_URL])

#         for page_result in results:
#             if page_result.success:
#                 print(f"\n📄 Page: {page_result.url}")
#                 links = page_result.links.get("internal", []) + page_result.links.get("external", [])
#                 for link in links:
#                     href = link['href']
#                     if href.startswith("http"):
#                         unique_links.add(href)
#                         print(f"  🔗 {href}")
#             else:
#                 print(f"❌ Failed to crawl {page_result.url}: {page_result.error_message}")

#     # Final summary
#     print(f"\n✅ Total unique links collected: {len(unique_links)}")
#     for link in sorted(unique_links):
#         print(link)

# if __name__ == "__main__":
#     asyncio.run(main())


import os
import re
import asyncio
from urllib.parse import urlparse
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig
from crawl4ai.deep_crawling import BestFirstCrawlingStrategy
from crawl4ai.deep_crawling.filters import (
    FilterChain,
    DomainFilter,
    URLPatternFilter,
    ContentTypeFilter
)

START_URL = "https://groww.in/blog"
OUTPUT_DIR = "D:\\Welzin\\credzin\\KnowledgeBase\\sites\\Groww\\articles"

def sanitize_filename(text):
    text = text.strip().lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

async def save_markdown_from_url(url, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    parsed_url = urlparse(url)
    slug = parsed_url.path.strip('/').replace("/", "-")
    if not slug:
        slug = f"article-{hash(url)}"
    filename = sanitize_filename(slug) + ".md"
    file_path = os.path.join(output_dir, filename)

    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url=url)
        # Use crawl4ai's markdown output (full text, best structure)
        content = getattr(result, "markdown", None)
        if not content or not content.strip():
            print(f"Skipped (no markdown content): {url}")
            return
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Saved: {file_path}")

async def main():
    # First, collect all blog article links using crawl4ai
    filter_chain = FilterChain([
        DomainFilter(allowed_domains=["groww.in"]),
        URLPatternFilter(patterns=["https://groww.in/blog/*"]),
        ContentTypeFilter(allowed_types=["text/html"]),
    ])

    config = CrawlerRunConfig(
        deep_crawl_strategy=BestFirstCrawlingStrategy(
            max_depth=5,
            include_external=False,
            filter_chain=filter_chain
        ),
        stream=True,
        verbose=True
    )

    article_links = set()
    async with AsyncWebCrawler() as crawler:
        async for result in await crawler.arun(START_URL, config=config):
            if result.url.startswith("https://groww.in/blog"):
                article_links.add(result.url)

    print(f"\n✅ Total unique blog article links collected: {len(article_links)}")

    # Now, for each link, get the markdown and save it
    for url in article_links:
        await save_markdown_from_url(url, OUTPUT_DIR)

if __name__ == "__main__":
    asyncio.run(main())