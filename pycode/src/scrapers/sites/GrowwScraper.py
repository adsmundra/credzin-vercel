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


import asyncio
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig
from crawl4ai.deep_crawling import BFSDeepCrawlStrategy
from crawl4ai.content_scraping_strategy import LXMLWebScrapingStrategy

async def main():
    start_url = "https://groww.in/blog"
    blog_prefix = "https://groww.in/blog"

    collection_links = set()

    # DO NOT pass `filters` here — your version doesn't support it
    strategy = BFSDeepCrawlStrategy(
        max_depth=3,
        include_external=False
    )

    config = CrawlerRunConfig(
        deep_crawl_strategy=strategy,
        scraping_strategy=LXMLWebScrapingStrategy(),
        verbose=True
    )

    async with AsyncWebCrawler() as crawler:
        results = await crawler.arun(start_url, config=config)

        print(f"\n✅ Crawled {len(results)} pages in total")

        for result in results:
            url = result.url
            # Keep only blog links
            if url.startswith(blog_prefix):
                collection_links.add(url)

        print(f"\n✅ Total blog links found: {len(collection_links)}")
        for link in list(collection_links)[:10]:  # Print first 10 links
            print(link)

if __name__ == "__main__":
    asyncio.run(main())
