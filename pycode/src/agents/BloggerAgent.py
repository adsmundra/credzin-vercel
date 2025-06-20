import sys
sys.path.append("pycode")

import os
import sys
from pathlib import Path
import re

from agno.agent import Agent
from agno.models.ollama import Ollama
from agno.team.team import Team
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.newspaper4k import Newspaper4kTools

from langchain_qdrant import QdrantVectorStore
from langchain.embeddings import HuggingFaceEmbeddings
from langchain_qdrant import FastEmbedSparse, QdrantVectorStore, RetrievalMode

from qdrant_client import QdrantClient

# Get the parent directory (one level up from current file)
# base_path = Path(__file__).resolve().parent.parent.parent  # Two levels up
# sys.path.append(str(base_path))

from pycode.src.utils.utilities import setup_env
from src.DataLoaders.QdrantDB import qdrantdb_client

# Decide Run mode
setup_env()

# ENV SETUP 
# os.environ["QDRANT_API_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.SsEx9xbs-jY9DjYKrmyGatbRchqs3vQ4lbfF0vS5M4A"
# os.environ["QDRANT_URL"] = "https://76d501b6-b754-42c1-a4da-9e0bc8cca319.us-east4-0.gcp.cloud.qdrant.io:6333/"
# QDRANT_URL = os.getenv("QDRANT_URL")
# QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

COLLECTION_NAME = "knowledge_base_hybrid1"
embedder = HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5")
sparse_embeddings=FastEmbedSparse(model_name="Qdrant/bm25")

#qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
qdrant_client = qdrantdb_client()

try:
    print(f"Collection '{COLLECTION_NAME}' info:")
    resp1 = qdrant_client.collection_exists('knowledge_base_hybrid2')
    print('resp1: ', resp1)
    resp2 = qdrant_client.get_collection('knowledge_base_hybrid1')
    print('resp2: ', resp2)
except Exception as e:
    print(f"Error checking collection: {str(e)}")
    print(f"Error type: {type(e).__name__}")
# Correctly use QdrantVectorStore from langchain_qdrant
vectorstore = QdrantVectorStore(
    client=QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY),
    collection_name=COLLECTION_NAME,
    embedding=embedder,
    sparse_embedding=sparse_embeddings,
    retrieval_mode=RetrievalMode.HYBRID,
    vector_name="vector",
    sparse_vector_name="sparse-vector",
    content_payload_key="content"  
)
retriever = retriever = vectorstore.as_retriever(
    search_type="mmr",                 # ← important
    search_kwargs={
        "k": 10,                        # final documents returned
        "fetch_k": 20,                 # candidate pool MMR will re-rank
        "lambda_mult": 0.5,            # diversity :left_right_arrow: relevance (0 = max diversity)
    },
)

print("\n--- Direct Retriever Test ---")
test_query = "tell me about axis bank" # Or another relevant query
def validate_document(doc):
    """Validate and clean document content"""
    if doc is None:
        return False
    if getattr(doc, 'page_content', None) is None:
        return False
    if not isinstance(doc.page_content, str):
        return False
    return True
try:
    # Using the retriever directly
    retrieved_docs = retriever.invoke(test_query)
    # Using vectorstore directly (might return more raw data, good for debugging)
    # retrieved_docs = vectorstore.similarity_search(test_query, k=5)
    valid_docs = [doc for doc in retrieved_docs if validate_document(doc)]
    if valid_docs:
    #if retrieved_docs:
        print(f":white_check_mark: Directly retrieved {len(retrieved_docs)} documents for query: '{test_query}'")
        for i, doc in enumerate(retrieved_docs):
            print(f"--- Doc {i+1} ---")
            print(f"Content: {doc.page_content[:200]}...") # Print first 200 chars
            if doc.metadata:
                print(f"Metadata: {doc.metadata}")
    else:
        print(f":x: No documents retrieved by direct retriever for query: '{test_query}'")
except Exception as e:
    print(f"Error during retrieval: {str(e)}")
    print(f"Error type: {type(e).__name__}")
print("---------------------------\n")



#MODEL SETUP
ollama_model = Ollama(
    id = "llama3.2",
    options={"temperature":0.5, "top_p":0.95}
)




def is_trusted_url(url):
    return any(domain in url for domain in [
    # Major Banks & Card Issuers
    "hdfcbank.com",
    "sbicard.com",
    "sbi.co.in",
    "icicibank.com",
    "axisbank.com",
    "kotak.com",
    "yesbank.in",
    "indusind.com",
    "idfcfirstbank.com",
    "bankofbaroda.in",
    "bobfinancial.com",  # BOB credit card arm
    "aubank.in",
    "federalbank.co.in",
    "rblbank.com",
    "hsbc.co.in",
    "citi.com",  # Citi India (still active via Axis tie-up)

    # Regulatory / Government
    "rbi.org.in",
    "npci.org.in",
    "uidai.gov.in",      # Aadhaar / identity norms
    "finmin.nic.in",     # Ministry of Finance
    "mca.gov.in",        # Corporate disclosures

    # Card networks (for fee rules, tier info)
    "visa.co.in",
    "mastercard.co.in",
    "americanexpress.com",  # Amex India

    # Trusted Fintech/Media Sources
    "livemint.com",
    "economictimes.indiatimes.com",
    "moneycontrol.com",
    "businesstoday.in",
    "timesofindia.indiatimes.com",
    "hindustantimes.com",
    "financialexpress.com",
    "thehindu.com",
    "yourstory.com",  # For fintech startup insights
    "entrackr.com",

    # Aggregators & Tools (limited inclusion)
    "etmoney.com",   # Trustworthy aggregator
    "bankbazaar.com",  # Use cautiously, mostly for factual info
])

def filter_urls(tool_result):
    """Filter function for DuckDuckGo search results"""
    if isinstance(tool_result, list):
        return [url for url in tool_result if is_trusted_url(url)]
    return tool_result



# AGENTS
# Searcher Agent
searcher = Agent(
    name="Searcher",
    role="Searches the top URLs for a topic",
    model=ollama_model,
    knowledge=retriever,
    search_knowledge=True,
    tools=[DuckDuckGoTools()],
    # tool_output_filter=filter_urls,
    add_datetime_to_instructions=True,
    instructions=[
        "You are a search strategist specializing in fintech. Your task is to equip a finance writer with the most credible, recent, and original sources on **credit cards in India**.",
        "🧭 Step 1: Design 7–10 precise, **non-overlapping search queries** based on the topic. Use diverse angles: customer benefits, card tiers, issuer-specific features, annual fees, eligibility rules, and government regulations. Example: 'top credit cards with no annual fee 2025 site:sbicard.com'.",
        "🔍 Step 2: Use DuckDuckGo to search. Prioritize **diversity and credibility**: official bank sites (HDFC, SBI, ICICI, Axis), fintech portals (ET Money, Mint, Business Today), and regulatory bodies (RBI, NPCI).",
        "✅ Step 3: Return 10 **unique, high-authority URLs** offering fresh factual data: fees, welcome bonuses, reward systems, usage tiers, issuer policies. Do not include sites with AI-generated blogs, affiliate links, low-authority content, or user opinions.",
        "🚫 Avoid interest rate information entirely.",
        "⚠️ Eliminate any redundancy or duplicate-type results — each URL must add **unique factual value**.",
    ]
)
# Writer Agent
writer = Agent(
    name="Writer",
    role="Writes a high-quality article",
    model=ollama_model,
    knowledge=retriever,
    search_knowledge=True,
    tools=[Newspaper4kTools()],
    add_datetime_to_instructions=True,
    description=(
        "You are a senior finance writer."
        "write a professional-grade article."
        "Utilize both provided web articles and the knowledge base for information."
    ),
    instructions=[
        "🎯 Goal: Write a **long-form editorial article** (10+ paragraphs, >3000 characters) on **credit cards in India (2025)** for an educated urban digital audience.",
        "🛠 Step 1: Extract structured facts using `read_article`. Focus on: card tiers, benefits, welcome bonuses, reward systems, issuer policies, and eligibility. Exclude interest rate details entirely.",
        "🧠 Step 2: Fully restructure and rephrase all information. Do not paraphrase original sentence structures. Present insights in your own unique tone.",
        "📄 Step 3: Organize the article with these clear sections: \n\n1. Introduction\n2. Credit Card Tiers in India\n3. Key Features by Tier\n4. Ideal User Profiles\n5. Annual Fees Overview\n6. Welcome Bonuses Snapshot\n7. Reward Structures Breakdown\n8. Comparison Table (use markdown)\n9. Final Thoughts and Expert Summary",
        "✨ Enhance readability with: \n- Tables (for card comparisons)\n- Highlight boxes (for tips or facts)\n- Bullet points (where needed)\n- Mobile-friendly formatting",
        "✅ Tone must be: professional, objective, data-driven. No marketing fluff or subjectivity.",
        "📌 Attribute sources softly: e.g., 'As per SBI's official website…' or 'According to Mint (2025)...'",
        "🚫 Do NOT include interest rates, APR, or finance charges.",
        "🚫 Avoid copy-paste, close paraphrasing, or using bullet formats from source URLs.",
        "Article should be have more than 2000 characters"
    ]
)



# --- GRADER AGENT ---
grader = Agent(
    name="Grader",
    role="Objectively scores and improves the article",
    model=ollama_model,
    knowledge=retriever,
    search_knowledge=False,
    tools=[],
    add_datetime_to_instructions=True,
    instructions=[
        "🎓 You are an editorial quality evaluator for fintech content.",
        "🧪 Step 1: Evaluate the article on these 6 metrics:\n- 🔍 Factual Accuracy\n- ✍️ Writing Quality\n- 🧠 Informational Value\n- 🎯 SEO Readiness\n- 📚 Readability\n- 🚫 Plagiarism Risk",
        "🏷️ Step 2: Assign a grade:\n- A+: Top-tier quality, ready to publish.\n- A: Strong work, minor edits needed.\n- B: Informative but requires SEO/structure fixes.\n- C: Needs substantial editing.\n- D: Not suitable in current form.",
        "♻️ Step 3: If the article receives **B, C, or D**, return a short critique, then automatically rewrite the article to meet **A+ standards** using all same section headings and original research, but with improved clarity, tone, flow, and formatting.",
        # "✅ Do NOT include interest rates in your rewrite.",
        # "🎯 Your mission is to ensure the article meets publishing standards by improving rather than rejecting.",
    ]
)


# --- EVALUATOR AGENT ---
evaluator = Agent(
    name="Evaluator",
    role="Fact-verifies and validates article data",
    model=ollama_model,
    knowledge=retriever,
    search_knowledge=True,
    tools=[DuckDuckGoTools(), Newspaper4kTools()],
    add_datetime_to_instructions=True,
    instructions=[
        "🎯 You are a fact-checker ensuring financial accuracy before publication.",
        # "🧐 Step 1: Review the full article and verify:\n- Card Names\n- Annual Fees\n- Reward Systems\n- Eligibility Rules\n- Issuer-specific Benefits\n(🚫 Do not verify interest rates)",
        # "🔎 Step 2: Use DuckDuckGo, bank sites (e.g., sbicard.com, hdfcbank.com), rbi.org.in, and trusted fintech media (Mint, ET Money).",
        # "🧾 Step 3: Return your evaluation in this structure:\n- ✅ Verified: [List of correct claims]\n- ⚠️ Issues: [Flag outdated or incorrect data]\n- 📌 Verdict: PASS if no critical errors, otherwise FAIL\n- 🛠️ Suggestions: [Corrections for each flagged issue]",
        # "🚫 Never assume accuracy. Everything must be cross-verified.",
    ]
)


# Editor Agent (Team)
editor = Team(
    name="Editor",
    mode="parallel",
    model=ollama_model,
    members=[searcher, writer, grader, evaluator],
    show_tool_calls=True,
    markdown=True,
    debug_mode=True,
    show_members_responses=True,
    add_datetime_to_instructions=True,
    description="Final gatekeeper to ensure article is polished and ready for publication.",
    instructions=[
        "🧭 Step 1: Initiate Searcher to gather 10 verified sources.",
        "✍️ Step 2: Pass URLs to Writer to create the article as per structure and tone.",
        "🕵️ Step 3: Once written, simultaneously activate Evaluator and Grader.",
        "✅ Step 4: Only approve the article if:\n- Evaluator verdict is PASS\n- Grader gives A or A+ (after rewrite if needed)",
        "📄 Step 5: Publish-ready output must include:\n- ✅ Final version of the full article\n- 📊 At least one markdown-formatted table\n- 📌 Evaluation Summary\n- 📝 Grading Feedback (with rewrite if B or below)",
        "🎨 Final article must be:\n- Fully original\n- Visually appealing (tables, bullet points, boxes)\n- Mobile-friendly\n- Free of interest rate details\n- Concise, objective, and informative for urban fintech readers",
         "Article should be have more than 2000 characters"
    ]
)


# EXECUTION
# !nohup ollama serve &
if __name__ == "__main__":
    topics = [
        "Axis bank Vs SBI bank credit cards, which one is better",
        
    ]
    output_dir = r"D:\\Welzin\\credzin\\Output\\Articles" # Change this to your desired output directory
    os.makedirs(output_dir, exist_ok=True)  # Ensure the output directory exists

    for topic in topics:
        print(f"\nGenerating article for: {topic}")
        response = editor.run(f"Write a detailed article about {topic}.")

        # Print the raw content to understand its structure
        print("\n--- Raw Response Content ---")
        print(response.content)
        print("----------------------------")

        # Generate a filename-safe version of the topic
        safe_title = re.sub(r'[^\w\s-]', '', topic).strip().lower()
        safe_title = re.sub(r'[\s-]+', '_', safe_title)
        filename = f"{safe_title}.md"
        file_path = os.path.join(output_dir, filename)
        # Save the article (for now, saving the raw content)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(response.content)
        print(f"Raw article content saved to {file_path}")