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

async def save_as_markdown(result, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    parsed_url = urlparse(result.url)
    slug = parsed_url.path.strip('/').replace("/", "-")
    if not slug:
        slug = f"article-{hash(result.url)}"
    filename = sanitize_filename(slug) + ".md"
    file_path = os.path.join(output_dir, filename)

    # Use crawl4ai's extracted_content (plain text)
    content = result.extracted_content or ""
    if not content.strip():
        print(f"Skipped (no content): {result.url}")
        return

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(f"# {result.metadata.get('title', 'Untitled')}\n\n")
        f.write(content)
    print(f"Saved: {file_path}")

async def main():
    filter_chain = FilterChain([
        DomainFilter(allowed_domains=["groww.in"]),
        URLPatternFilter(patterns=["https://groww.in/blog/*"]),  # <-- more inclusive for articles
        ContentTypeFilter(allowed_types=["text/html"]),
    ])

    config = CrawlerRunConfig(
        deep_crawl_strategy=BestFirstCrawlingStrategy(
            max_depth=5,  # Increase depth to ensure all articles are reached
            include_external=False,
            filter_chain=filter_chain
        ),
        stream=True,
        verbose=True
    )

    results = []
    async with AsyncWebCrawler() as crawler:
        async for result in await crawler.arun(START_URL, config=config):
            # Only save if the URL starts with the blog prefix
            if result.url.startswith("https://groww.in/blog"):
                results.append(result)
                await save_as_markdown(result, OUTPUT_DIR)

    print(f"\n✅ Total Articles Saved: {len(results)}")

if __name__ == "__main__":
    asyncio.run(main())