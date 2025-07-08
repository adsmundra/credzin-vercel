# import os
# import re
# from datetime import datetime

# from agno.agent import Agent
# from agno.models.ollama import Ollama
# from agno.team.team import Team
# from agno.tools.duckduckgo import DuckDuckGoTools
# from agno.tools.newspaper4k import Newspaper4kTools
# from langchain_core.documents import Document

# from langchain_qdrant import QdrantVectorStore, FastEmbedSparse, RetrievalMode
# from langchain_community.embeddings import HuggingFaceEmbeddings

# from utils.logger import configure_logging
# from utils.utilities import setup_env
# from DataLoaders.QdrantDB import qdrantdb_client

# # === Setup ===
# logger = configure_logging("BloggerAgent")
# setup_env()

# COLLECTION_NAME = "blogger_KB_hybrid"  # Use your existing collection

# # === Qdrant setup ===
# qdrant_client = qdrantdb_client()
# embedder = HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5")
# sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")

# # === Initialize VectorStore and Retriever ===
# vectorstore = QdrantVectorStore(
#     client=qdrant_client,
#     collection_name=COLLECTION_NAME,
#     embedding=embedder,
#     sparse_embedding=sparse_embeddings,
#     retrieval_mode=RetrievalMode.HYBRID,
#     vector_name="vector",
#     sparse_vector_name="sparse-vector",
#     content_payload_key="content"
# )
# retriever = vectorstore.as_retriever(
#     search_type="mmr",
#     search_kwargs={
#         "k": 10,
#         "fetch_k": 20,
#         "lambda_mult": 0.5,
#     },
# )


# #MODEL SETUP
# ollama_model = Ollama(
#     id = "llama3.2",
#     options={"temperature":0.5, "top_p":0.95}
# )

# def is_trusted_url(url):
#     return any(domain in url for domain in [
#     # Major Banks & Card Issuers
#     "hdfcbank.com",
#     "sbicard.com",
#     "sbi.co.in",
#     "icicibank.com",
#     "axisbank.com",
#     "kotak.com",
#     "yesbank.in",
#     "indusind.com",
#     "idfcfirstbank.com",
#     "bankofbaroda.in",
#     "bobfinancial.com",  # BOB credit card arm
#     "aubank.in",
#     "federalbank.co.in",
#     "rblbank.com",
#     "hsbc.co.in",
#     "citi.com",  # Citi India (still active via Axis tie-up)

#     # Regulatory / Government
#     "rbi.org.in",
#     "npci.org.in",
#     "uidai.gov.in",      # Aadhaar / identity norms
#     "finmin.nic.in",     # Ministry of Finance
#     "mca.gov.in",        # Corporate disclosures

#     # Card networks (for fee rules, tier info)
#     "visa.co.in",
#     "mastercard.co.in",
#     "americanexpress.com",  # Amex India

#     # Trusted Fintech/Media Sources
#     "livemint.com",
#     "economictimes.indiatimes.com",
#     "moneycontrol.com",
#     "businesstoday.in",
#     "timesofindia.indiatimes.com",
#     "hindustantimes.com",
#     "financialexpress.com",
#     "thehindu.com",
#     "yourstory.com",  # For fintech startup insights
#     "entrackr.com",

#     # Aggregators & Tools (limited inclusion)
#     "etmoney.com",   # Trustworthy aggregator
#     "bankbazaar.com",  # Use cautiously, mostly for factual info
# ])

# def filter_urls(tool_result):
#     """Filter function for DuckDuckGo search results"""
#     if isinstance(tool_result, list):
#         return [url for url in tool_result if is_trusted_url(url)]
#     return tool_result



# # AGENTS
# # Searcher Agent
# searcher = Agent(
#     name="Searcher",
#     role="Searches the top URLs for a topic",
#     model=ollama_model,
#     knowledge=retriever,
#     search_knowledge=True,
#     tools=[DuckDuckGoTools()],
#     # tool_output_filter=filter_urls,
#     add_datetime_to_instructions=True,
#     instructions=[
#         "You are a search strategist specializing in fintech. Your task is to equip a finance writer with the most credible, recent, and original sources on **credit cards in India**.",
#         "🧭 Step 1: Design 7–10 precise, **non-overlapping search queries** based on the topic. Use diverse angles: customer benefits, card tiers, issuer-specific features, annual fees, eligibility rules, and government regulations. Example: 'top credit cards with no annual fee 2025 site:sbicard.com'.",
#         "🔍 Step 2: Use DuckDuckGo to search. Prioritize **diversity and credibility**: official bank sites (HDFC, SBI, ICICI, Axis), fintech portals (ET Money, Mint, Business Today), and regulatory bodies (RBI, NPCI).",
#         "✅ Step 3: Return 10 **unique, high-authority URLs** offering fresh factual data: fees, welcome bonuses, reward systems, usage tiers, issuer policies. Do not include sites with AI-generated blogs, affiliate links, low-authority content, or user opinions.",
#         "🚫 Avoid interest rate information entirely.",
#         "⚠️ Eliminate any redundancy or duplicate-type results — each URL must add **unique factual value**.",
#     ]
# )
# # Writer Agent
# writer = Agent(
#     name="Writer",
#     role="Writes a high-quality article",
#     model=ollama_model,
#     knowledge=retriever,
#     search_knowledge=True,
#     tools=[Newspaper4kTools()],
#     add_datetime_to_instructions=True,
#     description=(
#         "You are a senior finance writer."
#         "write a professional-grade article."
#         "Utilize both provided web articles and the knowledge base for information."
#     ),
#     instructions=[
#         "🎯 Goal: Write a **long-form editorial article** (10+ paragraphs, >3000 characters) on **credit cards in India (2025)** for an educated urban digital audience.",
#         "🛠 Step 1: Extract structured facts using `read_article`. Focus on: card tiers, benefits, welcome bonuses, reward systems, issuer policies, and eligibility. Exclude interest rate details entirely.",
#         "🧠 Step 2: Fully restructure and rephrase all information. Do not paraphrase original sentence structures. Present insights in your own unique tone.",
#         "📄 Step 3: Organize the article with these clear sections: \n\n1. Introduction\n2. Credit Card Tiers in India\n3. Key Features by Tier\n4. Ideal User Profiles\n5. Annual Fees Overview\n6. Welcome Bonuses Snapshot\n7. Reward Structures Breakdown\n8. Comparison Table (use markdown)\n9. Final Thoughts and Expert Summary",
#         "✨ Enhance readability with: \n- Tables (for card comparisons)\n- Highlight boxes (for tips or facts)\n- Bullet points (where needed)\n- Mobile-friendly formatting",
#         "✅ Tone must be: professional, objective, data-driven. No marketing fluff or subjectivity.",
#         "📌 Attribute sources softly: e.g., 'As per SBI's official website…' or 'According to Mint (2025)...'",
#         "🚫 Do NOT include interest rates, APR, or finance charges.",
#         "🚫 Avoid copy-paste, close paraphrasing, or using bullet formats from source URLs.",
#         "Article should be have more than 2000 characters"
#     ]
# )


# # --- GRADER AGENT ---
# grader = Agent(
#     name="Grader",
#     role="Objectively scores and improves the article",
#     model=ollama_model,
#     knowledge=retriever,
#     search_knowledge=False,
#     tools=[],
#     add_datetime_to_instructions=True,
#     instructions=[
#         "🎓 You are an editorial quality evaluator for fintech content.",
#         "🧪 Step 1: Evaluate the article on these 6 metrics:\n- 🔍 Factual Accuracy\n- ✍️ Writing Quality\n- 🧠 Informational Value\n- 🎯 SEO Readiness\n- 📚 Readability\n- 🚫 Plagiarism Risk",
#         "🏷️ Step 2: Assign a grade:\n- A+: Top-tier quality, ready to publish.\n- A: Strong work, minor edits needed.\n- B: Informative but requires SEO/structure fixes.\n- C: Needs substantial editing.\n- D: Not suitable in current form.",
#         "♻️ Step 3: If the article receives **B, C, or D**, return a short critique, then automatically rewrite the article to meet **A+ standards** using all same section headings and original research, but with improved clarity, tone, flow, and formatting.",
#         # "✅ Do NOT include interest rates in your rewrite.",
#         # "🎯 Your mission is to ensure the article meets publishing standards by improving rather than rejecting.",
#     ]
# )


# # --- EVALUATOR AGENT ---
# evaluator = Agent(
#     name="Evaluator",
#     role="Fact-verifies and validates article data",
#     model=ollama_model,
#     knowledge=retriever,
#     search_knowledge=True,
#     tools=[DuckDuckGoTools(), Newspaper4kTools()],
#     add_datetime_to_instructions=True,
#     instructions=[
#         "🎯 You are a fact-checker ensuring financial accuracy before publication.",
#         # "🧐 Step 1: Review the full article and verify:\n- Card Names\n- Annual Fees\n- Reward Systems\n- Eligibility Rules\n- Issuer-specific Benefits\n(🚫 Do not verify interest rates)",
#         # "🔎 Step 2: Use DuckDuckGo, bank sites (e.g., sbicard.com, hdfcbank.com), rbi.org.in, and trusted fintech media (Mint, ET Money).",
#         # "🧾 Step 3: Return your evaluation in this structure:\n- ✅ Verified: [List of correct claims]\n- ⚠️ Issues: [Flag outdated or incorrect data]\n- 📌 Verdict: PASS if no critical errors, otherwise FAIL\n- 🛠️ Suggestions: [Corrections for each flagged issue]",
#         # "🚫 Never assume accuracy. Everything must be cross-verified.",
#     ]
# )


# # Editor Agent (Team)
# editor = Team(
#     name="Editor",
#     mode="parallel",
#     model=ollama_model,
#     members=[searcher, writer, grader, evaluator],
#     show_tool_calls=True,
#     markdown=True,
#     debug_mode=True,
#     show_members_responses=True,
#     add_datetime_to_instructions=True,
#     description="Final gatekeeper to ensure article is polished and ready for publication.",
#     instructions=[
#         "🧭 Step 1: Initiate Searcher to gather 10 verified sources.",
#         "✍️ Step 2: Pass URLs to Writer to create the article as per structure and tone.",
#         "🕵️ Step 3: Once written, simultaneously activate Evaluator and Grader.",
#         "✅ Step 4: Only approve the article if:\n- Evaluator verdict is PASS\n- Grader gives A or A+ (after rewrite if needed)",
#         "📄 Step 5: Publish-ready output must include:\n- ✅ Final version of the full article\n- 📊 At least one markdown-formatted table\n- 📌 Evaluation Summary\n- 📝 Grading Feedback (with rewrite if B or below)",
#         "🎨 Final article must be:\n- Fully original\n- Visually appealing (tables, bullet points, boxes)\n- Mobile-friendly\n- Free of interest rate details\n- Concise, objective, and informative for urban fintech readers",
#          "Article should be have more than 2000 characters"
#     ]
# )


# # EXECUTION
# # !nohup ollama serve &
# if __name__ == "__main__":
#     date_str = datetime.now().strftime('%Y-%m-%d')
#     base_dir = r"D:\\Welzin\\credzin"
#     output_dir = os.path.join(base_dir, "Output", "blogs", date_str)
#     os.makedirs(output_dir, exist_ok=True)

#     topics = ["Axis Bank Credit Card Review 2025: Which Card Should You Get?",]

#     for topic in topics:
#         logger.info(f"\nGenerating article for: {topic}")
#         response = editor.run(f"Write a detailed article about {topic}.")

#         # Print the raw content to understand its structure
#         logger.info("\n--- Raw Response Content ---")
#         logger.info(response.content)
#         logger.info("----------------------------")

#         # Generate a filename-safe version of the topic
#         filename = re.sub(r'[\\/*?:"<>|]', "", topic).replace(" ", "_") + ".md"
#         file_path = os.path.join(output_dir, filename)

#         with open(file_path, "w", encoding="utf-8") as f:
#             f.write(response.content)
#         logger.info(f"Raw article content saved to {file_path}")



# import os
# import re
# from datetime import datetime
# from typing import List, Dict, Any

# from agno.agent import Agent
# from agno.models.ollama import Ollama
# from agno.team.team import Team
# from agno.tools.duckduckgo import DuckDuckGoTools
# from agno.tools.newspaper4k import Newspaper4kTools
# from langchain_core.documents import Document

# from langchain_qdrant import QdrantVectorStore, FastEmbedSparse, RetrievalMode
# from langchain_community.embeddings import HuggingFaceEmbeddings

# # Opik imports
# from opik import Opik, track
# from opik.evaluation import evaluate
# from opik.evaluation.metrics import Hallucination, AnswerRelevance, Moderation

# from utils.logger import configure_logging
# from utils.utilities import setup_env
# from DataLoaders.QdrantDB import qdrantdb_client

# os.environ["OPIK_API_KEY"] = "OoELaezFSqRJFAzN5VyQx2ODc"

# # === Setup ===
# logger = configure_logging("BloggerAgent")
# setup_env()

# # Initialize Opik client
# opik_client = Opik()

# COLLECTION_NAME = "blogger_KB_hybrid"  # Use your existing collection

# # === Qdrant setup ===
# qdrant_client = qdrantdb_client()
# embedder = HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5")
# sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")

# # === Initialize VectorStore and Retriever ===
# vectorstore = QdrantVectorStore(
#     client=qdrant_client,
#     collection_name=COLLECTION_NAME,
#     embedding=embedder,
#     sparse_embedding=sparse_embeddings,
#     retrieval_mode=RetrievalMode.HYBRID,
#     vector_name="vector",
#     sparse_vector_name="sparse-vector",
#     content_payload_key="content"
# )
# retriever = vectorstore.as_retriever(
#     search_type="mmr",
#     search_kwargs={
#         "k": 10,
#         "fetch_k": 20,
#         "lambda_mult": 0.5,
#     },
# )

# # MODEL SETUP
# ollama_model = Ollama(
#     id="llama3.2",
#     options={"temperature": 0.5, "top_p": 0.95}
# )

# def is_trusted_url(url):
#     return any(domain in url for domain in [
#         # Major Banks & Card Issuers
#         "hdfcbank.com", "sbicard.com", "sbi.co.in", "icicibank.com", "axisbank.com",
#         "kotak.com", "yesbank.in", "indusind.com", "idfcfirstbank.com", "bankofbaroda.in",
#         "bobfinancial.com", "aubank.in", "federalbank.co.in", "rblbank.com", "hsbc.co.in",
#         "citi.com",
#         # Regulatory / Government
#         "rbi.org.in", "npci.org.in", "uidai.gov.in", "finmin.nic.in", "mca.gov.in",
#         # Card networks
#         "visa.co.in", "mastercard.co.in", "americanexpress.com",
#         # Trusted Fintech/Media Sources
#         "livemint.com", "economictimes.indiatimes.com", "moneycontrol.com",
#         "businesstoday.in", "timesofindia.indiatimes.com", "hindustantimes.com",
#         "financialexpress.com", "thehindu.com", "yourstory.com", "entrackr.com",
#         # Aggregators & Tools
#         "etmoney.com", "bankbazaar.com"
#     ])

# def filter_urls(tool_result):
#     """Filter function for DuckDuckGo search results"""
#     if isinstance(tool_result, list):
#         return [url for url in tool_result if is_trusted_url(url)]
#     return tool_result

# # Custom Opik Evaluation Metrics
# class ArticleQualityMetric:
#     """Custom metric for evaluating article quality"""
    
#     def __init__(self):
#         self.name = "article_quality"
    
#     def score(self, article: str, topic: str, sources: List[str]) -> Dict[str, Any]:
#         """Score article based on quality metrics"""
#         score_data = {
#             "length_score": min(len(article) / 3000, 1.0),  # Target 3000+ chars
#             "structure_score": self._evaluate_structure(article),
#             "factual_coverage": self._evaluate_factual_coverage(article),
#             "readability_score": self._evaluate_readability(article),
#             "source_integration": self._evaluate_source_integration(article, sources)
#         }
        
#         overall_score = sum(score_data.values()) / len(score_data)
#         score_data["overall_score"] = overall_score
        
#         return {
#             "value": overall_score,
#             "reason": f"Article quality assessment: {score_data}"
#         }
    
#     def _evaluate_structure(self, article: str) -> float:
#         """Evaluate article structure"""
#         required_sections = [
#             "introduction", "credit card", "tier", "features", 
#             "fees", "bonus", "reward", "comparison", "conclusion"
#         ]
#         article_lower = article.lower()
#         found_sections = sum(1 for section in required_sections if section in article_lower)
#         return found_sections / len(required_sections)
    
#     def _evaluate_factual_coverage(self, article: str) -> float:
#         """Evaluate factual coverage"""
#         key_elements = [
#             "annual fee", "reward", "eligibility", "benefit", 
#             "welcome bonus", "cashback", "points"
#         ]
#         article_lower = article.lower()
#         found_elements = sum(1 for element in key_elements if element in article_lower)
#         return found_elements / len(key_elements)
    
#     def _evaluate_readability(self, article: str) -> float:
#         """Basic readability assessment"""
#         has_tables = "|" in article or "markdown" in article.lower()
#         has_bullets = "•" in article or "-" in article
#         has_headers = "#" in article
        
#         readability_features = [has_tables, has_bullets, has_headers]
#         return sum(readability_features) / len(readability_features)
    
#     def _evaluate_source_integration(self, article: str, sources: List[str]) -> float:
#         """Evaluate how well sources are integrated"""
#         if not sources:
#             return 0.0
        
#         source_mentions = 0
#         for source in sources:
#             if any(domain in article.lower() for domain in ["sbi", "hdfc", "axis", "icici", "mint", "rbi"]):
#                 source_mentions += 1
        
#         return min(source_mentions / len(sources), 1.0)

# # Initialize custom metric
# article_quality_metric = ArticleQualityMetric()

# # AGENTS with Opik tracking
# # Searcher Agent
# @track(name="searcher_agent")
# def create_searcher_agent():
#     return Agent(
#         name="Searcher",
#         role="Searches the top URLs for a topic",
#         model=ollama_model,
#         knowledge=retriever,
#         search_knowledge=True,
#         tools=[DuckDuckGoTools()],
#         add_datetime_to_instructions=True,
#         instructions=[
#             "You are a search strategist specializing in fintech. Your task is to equip a finance writer with the most credible, recent, and original sources on **credit cards in India**.",
#             "🧭 Step 1: Design 7–10 precise, **non-overlapping search queries** based on the topic. Use diverse angles: customer benefits, card tiers, issuer-specific features, annual fees, eligibility rules, and government regulations.",
#             "🔍 Step 2: Use DuckDuckGo to search. Prioritize **diversity and credibility**: official bank sites (HDFC, SBI, ICICI, Axis), fintech portals (ET Money, Mint, Business Today), and regulatory bodies (RBI, NPCI).",
#             "✅ Step 3: Return 10 **unique, high-authority URLs** offering fresh factual data: fees, welcome bonuses, reward systems, usage tiers, issuer policies.",
#             "🚫 Avoid interest rate information entirely.",
#             "⚠️ Eliminate any redundancy or duplicate-type results — each URL must add **unique factual value**.",
#         ]
#     )

# # Writer Agent
# @track(name="writer_agent")
# def create_writer_agent():
#     return Agent(
#         name="Writer",
#         role="Writes a high-quality article",
#         model=ollama_model,
#         knowledge=retriever,
#         search_knowledge=True,
#         tools=[Newspaper4kTools()],
#         add_datetime_to_instructions=True,
#         description="You are a senior finance writer who writes professional-grade articles.",
#         instructions=[
#             "🎯 Goal: Write a **long-form editorial article** (10+ paragraphs, >3000 characters) on **credit cards in India (2025)** for an educated urban digital audience.",
#             "🛠 Step 1: Extract structured facts using `read_article`. Focus on: card tiers, benefits, welcome bonuses, reward systems, issuer policies, and eligibility.",
#             "🧠 Step 2: Fully restructure and rephrase all information. Present insights in your own unique tone.",
#             "📄 Step 3: Organize with clear sections: Introduction, Credit Card Tiers, Key Features, User Profiles, Annual Fees, Welcome Bonuses, Reward Structures, Comparison Table, Final Thoughts.",
#             "✨ Enhance readability with tables, highlight boxes, bullet points, and mobile-friendly formatting.",
#             "✅ Tone: professional, objective, data-driven. No marketing fluff.",
#             "📌 Attribute sources softly: 'As per SBI's official website…'",
#             "🚫 Do NOT include interest rates, APR, or finance charges.",
#             "Article should have more than 2000 characters"
#         ]
#     )

# # Grader Agent
# @track(name="grader_agent")
# def create_grader_agent():
#     return Agent(
#         name="Grader",
#         role="Objectively scores and improves the article",
#         model=ollama_model,
#         knowledge=retriever,
#         search_knowledge=False,
#         tools=[],
#         add_datetime_to_instructions=True,
#         instructions=[
#             "🎓 You are an editorial quality evaluator for fintech content.",
#             "🧪 Step 1: Evaluate the article on: Factual Accuracy, Writing Quality, Informational Value, SEO Readiness, Readability, Plagiarism Risk",
#             "🏷️ Step 2: Assign a grade: A+, A, B, C, or D",
#             "♻️ Step 3: If B, C, or D, provide critique and rewrite to A+ standards.",
#         ]
#     )

# # Evaluator Agent
# @track(name="evaluator_agent")
# def create_evaluator_agent():
#     return Agent(
#         name="Evaluator",
#         role="Fact-verifies and validates article data",
#         model=ollama_model,
#         knowledge=retriever,
#         search_knowledge=True,
#         tools=[DuckDuckGoTools(), Newspaper4kTools()],
#         add_datetime_to_instructions=True,
#         instructions=[
#             "🎯 You are a fact-checker ensuring financial accuracy before publication.",
#             "🧐 Review and verify: Card Names, Annual Fees, Reward Systems, Eligibility Rules, Issuer-specific Benefits",
#             "🔎 Use DuckDuckGo, bank sites, and trusted fintech media for verification.",
#             "🧾 Return: Verified claims, Issues found, PASS/FAIL verdict, Correction suggestions",
#         ]
#     )

# # Create agent instances
# searcher = create_searcher_agent()
# writer = create_writer_agent()
# grader = create_grader_agent()
# evaluator = create_evaluator_agent()

# # Editor Team with Opik tracking
# @track(name="editor_team")
# def create_editor_team():
#     return Team(
#         name="Editor",
#         mode="parallel",
#         model=ollama_model,
#         members=[searcher, writer, grader, evaluator],
#         show_tool_calls=True,
#         markdown=True,
#         debug_mode=True,
#         show_members_responses=True,
#         add_datetime_to_instructions=True,
#         description="Final gatekeeper to ensure article is polished and ready for publication.",
#         instructions=[
#             "🧭 Step 1: Initiate Searcher to gather 10 verified sources.",
#             "✍️ Step 2: Pass URLs to Writer to create the article.",
#             "🕵️ Step 3: Activate Evaluator and Grader simultaneously.",
#             "✅ Step 4: Approve only if Evaluator verdict is PASS and Grader gives A or A+",
#             "📄 Step 5: Final output must include complete article with markdown table, evaluation summary, and grading feedback.",
#             "Article should have more than 2000 characters"
#         ]
#     )

# @track(name="evaluate_article_with_opik")
# def evaluate_article_with_opik(article: str, topic: str, sources: List[str], context: str = ""):
#     """Evaluate article using Opik's built-in and custom metrics"""
    
#     # Prepare evaluation dataset
#     evaluation_data = [{
#         "input": topic,
#         "output": article,
#         "expected_output": f"High-quality article about {topic}",
#         "context": context,
#         "metadata": {
#             "sources_count": len(sources),
#             "article_length": len(article),
#             "topic": topic
#         }
#     }]
    
#     # Built-in Opik metrics
#     hallucination_metric = Hallucination()
#     relevance_metric = AnswerRelevance()
#     moderation_metric = Moderation()
#     factual_consistency_metric = FactualConsistency()
    
#     # Run evaluation
#     evaluation_results = evaluate(
#         dataset=evaluation_data,
#         metrics=[
#             hallucination_metric,
#             relevance_metric,
#             moderation_metric,
#             factual_consistency_metric
#         ],
#         task=lambda x: x["output"]  # The article is already generated
#     )
    
#     # Add custom quality evaluation
#     quality_score = article_quality_metric.score(article, topic, sources)
    
#     # Combine results
#     results = {
#         "opik_evaluation": evaluation_results,
#         "custom_quality_score": quality_score,
#         "metadata": {
#             "article_length": len(article),
#             "sources_used": len(sources),
#             "evaluation_timestamp": datetime.now().isoformat()
#         }
#     }
    
#     return results

# @track(name="main_article_generation")
# def generate_article_with_evaluation(topic: str, output_dir: str):
#     """Main function to generate and evaluate article"""
    
#     logger.info(f"Generating article for: {topic}")
    
#     # Create editor team
#     editor = create_editor_team()
    
#     # Generate article
#     response = editor.run(f"Write a detailed article about {topic}.")
    
#     # Extract sources from response (you might need to modify this based on your response structure)
#     sources = []  # You'll need to extract this from the searcher agent's response
    
#     # Evaluate the article
#     evaluation_results = evaluate_article_with_opik(
#         article=response.content,
#         topic=topic,
#         sources=sources,
#         context="Credit card article for Indian market"
#     )
    
#     # Log evaluation results
#     logger.info("=== OPIK EVALUATION RESULTS ===")
#     logger.info(f"Custom Quality Score: {evaluation_results['custom_quality_score']}")
#     logger.info(f"Opik Evaluation: {evaluation_results['opik_evaluation']}")
    
#     # Save article
#     filename = re.sub(r'[\\/*?:"<>|]', "", topic).replace(" ", "_") + ".md"
#     file_path = os.path.join(output_dir, filename)
    
#     # Enhanced article content with evaluation summary
#     enhanced_content = f"""# {topic}

# {response.content}

# ---

# ## Evaluation Summary

# **Custom Quality Score:** {evaluation_results['custom_quality_score']['value']:.2f}

# **Quality Breakdown:**
# {evaluation_results['custom_quality_score']['reason']}

# **Article Metrics:**
# - Length: {evaluation_results['metadata']['article_length']} characters
# - Sources Used: {evaluation_results['metadata']['sources_used']}
# - Evaluation Date: {evaluation_results['metadata']['evaluation_timestamp']}

# **Opik Evaluation Results:**
# {evaluation_results['opik_evaluation']}
# """
    
#     with open(file_path, "w", encoding="utf-8") as f:
#         f.write(enhanced_content)
    
#     logger.info(f"Enhanced article with evaluation saved to {file_path}")
    
#     return evaluation_results

# # EXECUTION
# if __name__ == "__main__":
#     date_str = datetime.now().strftime('%Y-%m-%d')
#     base_dir = r"D:\\Welzin\\credzin"
#     output_dir = os.path.join(base_dir, "Output", "blogs", date_str)
#     os.makedirs(output_dir, exist_ok=True)

#     topics = ["Axis Bank Credit Card Review 2025: Which Card Should You Get?"]

#     for topic in topics:
#         try:
#             evaluation_results = generate_article_with_evaluation(topic, output_dir)
            
#             # Log final evaluation summary
#             logger.info(f"\n=== FINAL EVALUATION FOR: {topic} ===")
#             logger.info(f"Overall Quality Score: {evaluation_results['custom_quality_score']['value']:.2f}")
#             logger.info("=" * 50)
            
#         except Exception as e:
#             logger.error(f"Error processing topic '{topic}': {str(e)}")
#             continue



import os
import re
from datetime import datetime
from typing import List, Dict, Any

from agno.agent import Agent
from agno.models.ollama import Ollama
from agno.team.team import Team
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.newspaper4k import Newspaper4kTools
from langchain_core.documents import Document

from langchain_qdrant import QdrantVectorStore, FastEmbedSparse, RetrievalMode
from langchain_community.embeddings import HuggingFaceEmbeddings

# Opik imports
os.environ["OPIK_API_KEY"] = "OoELaezFSqRJFAzN5VyQx2ODc"
from opik import Opik, track
from opik.evaluation import evaluate
from opik.evaluation.metrics import Hallucination, AnswerRelevance, Moderation

from utils.logger import configure_logging
from utils.utilities import setup_env
from DataLoaders.QdrantDB import qdrantdb_client

# === Setup ===
logger = configure_logging("BloggerAgent")
setup_env()

# Initialize Opik client
opik_client = Opik()

COLLECTION_NAME = "blogger_KB_hybrid"  # Use your existing collection

# === Qdrant setup ===
qdrant_client = qdrantdb_client()
embedder = HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5")
sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")

# === Initialize VectorStore and Retriever ===
vectorstore = QdrantVectorStore(
    client=qdrant_client,
    collection_name=COLLECTION_NAME,
    embedding=embedder,
    sparse_embedding=sparse_embeddings,
    retrieval_mode=RetrievalMode.HYBRID,
    vector_name="vector",
    sparse_vector_name="sparse-vector",
    content_payload_key="content"
)
retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 10,
        "fetch_k": 20,
        "lambda_mult": 0.5,
    },
)

# MODEL SETUP
ollama_model = Ollama(
    id="llama3.2",
    options={"temperature": 0.5, "top_p": 0.95}
)

def is_trusted_url(url):
    return any(domain in url for domain in [
        "hdfcbank.com", "sbicard.com", "sbi.co.in", "icicibank.com", "axisbank.com",
        "kotak.com", "yesbank.in", "indusind.com", "idfcfirstbank.com", "bankofbaroda.in",
        "bobfinancial.com", "aubank.in", "federalbank.co.in", "rblbank.com", "hsbc.co.in",
        "citi.com",
        "rbi.org.in", "npci.org.in", "uidai.gov.in", "finmin.nic.in", "mca.gov.in",
        "visa.co.in", "mastercard.co.in", "americanexpress.com",
        "livemint.com", "economictimes.indiatimes.com", "moneycontrol.com",
        "businesstoday.in", "timesofindia.indiatimes.com", "hindustantimes.com",
        "financialexpress.com", "thehindu.com", "yourstory.com", "entrackr.com",
        "etmoney.com", "bankbazaar.com"
    ])

def filter_urls(tool_result):
    """Filter function for DuckDuckGo search results"""
    if isinstance(tool_result, list):
        return [url for url in tool_result if is_trusted_url(url)]
    return tool_result

# Custom Opik Evaluation Metrics
class ArticleQualityMetric:
    """Custom metric for evaluating article quality"""
    def __init__(self):
        self.name = "article_quality"

    def score(self, article: str, topic: str, sources: List[str]) -> Dict[str, Any]:
        """Score article based on quality metrics"""
        score_data = {
            "length_score": min(len(article) / 3000, 1.0),  # Target 3000+ chars
            "structure_score": self._evaluate_structure(article),
            "factual_coverage": self._evaluate_factual_coverage(article),
            "readability_score": self._evaluate_readability(article),
            "source_integration": self._evaluate_source_integration(article, sources)
        }
        overall_score = sum(score_data.values()) / len(score_data)
        score_data["overall_score"] = overall_score
        return {
            "value": overall_score,
            "reason": f"Article quality assessment: {score_data}"
        }

    def _evaluate_structure(self, article: str) -> float:
        """Evaluate article structure"""
        required_sections = [
            "introduction", "credit card", "tier", "features", 
            "fees", "bonus", "reward", "comparison", "conclusion"
        ]
        article_lower = article.lower()
        found_sections = sum(1 for section in required_sections if section in article_lower)
        return found_sections / len(required_sections)

    def _evaluate_factual_coverage(self, article: str) -> float:
        """Evaluate factual coverage"""
        key_elements = [
            "annual fee", "reward", "eligibility", "benefit", 
            "welcome bonus", "cashback", "points"
        ]
        article_lower = article.lower()
        found_elements = sum(1 for element in key_elements if element in article_lower)
        return found_elements / len(key_elements)

    def _evaluate_readability(self, article: str) -> float:
        """Basic readability assessment"""
        has_tables = "|" in article or "markdown" in article.lower()
        has_bullets = "•" in article or "-" in article
        has_headers = "#" in article
        readability_features = [has_tables, has_bullets, has_headers]
        return sum(readability_features) / len(readability_features)

    def _evaluate_source_integration(self, article: str, sources: List[str]) -> float:
        """Evaluate how well sources are integrated"""
        if not sources:
            return 0.0
        source_mentions = 0
        for source in sources:
            if any(domain in article.lower() for domain in ["sbi", "hdfc", "axis", "icici", "mint", "rbi"]):
                source_mentions += 1
        return min(source_mentions / len(sources), 1.0)

# Initialize custom metric
article_quality_metric = ArticleQualityMetric()

# AGENTS with Opik tracking
@track(name="searcher_agent")
def create_searcher_agent():
    return Agent(
        name="Searcher",
        role="Searches the top URLs for a topic",
        model=ollama_model,
        knowledge=retriever,
        search_knowledge=True,
        tools=[DuckDuckGoTools()],
        add_datetime_to_instructions=True,
        instructions=[
            "You are a search strategist specializing in fintech. Your task is to equip a finance writer with the most credible, recent, and original sources on **credit cards in India**.",
            "🧭 Step 1: Design 7–10 precise, **non-overlapping search queries** based on the topic. Use diverse angles: customer benefits, card tiers, issuer-specific features, annual fees, eligibility rules, and government regulations.",
            "🔍 Step 2: Use DuckDuckGo to search. Prioritize **diversity and credibility**: official bank sites (HDFC, SBI, ICICI, Axis), fintech portals (ET Money, Mint, Business Today), and regulatory bodies (RBI, NPCI).",
            "✅ Step 3: Return 10 **unique, high-authority URLs** offering fresh factual data: fees, welcome bonuses, reward systems, usage tiers, issuer policies.",
            "🚫 Avoid interest rate information entirely.",
            "⚠️ Eliminate any redundancy or duplicate-type results — each URL must add **unique factual value**.",
        ]
    )

@track(name="writer_agent")
def create_writer_agent():
    return Agent(
        name="Writer",
        role="Writes a high-quality article",
        model=ollama_model,
        knowledge=retriever,
        search_knowledge=True,
        tools=[Newspaper4kTools()],
        add_datetime_to_instructions=True,
        description="You are a senior finance writer who writes professional-grade articles.",
        instructions=[
            "🎯 Goal: Write a **long-form editorial article** (7+ paragraphs, >3000 characters) on **credit cards in India (2025)** for an educated urban digital audience.",
            "🛠 Step 1: Extract structured facts using `read_article`. Focus on: card tiers, benefits, welcome bonuses, reward systems, issuer policies, and eligibility.",
            "🧠 Step 2: Fully restructure and rephrase all information. Present insights in your own unique tone.",
            "📄 Step 3: Organize with clear sections: Introduction, Credit Card Tiers, Key Features, User Profiles, Annual Fees, Welcome Bonuses, Reward Structures, Comparison Table, Final Thoughts.",
            "✨ Enhance readability with tables, highlight boxes, bullet points, and mobile-friendly formatting.",
            "✅ Tone: professional, objective, data-driven. No marketing fluff.",
            "📌 Attribute sources softly: 'As per SBI's official website…'",
            "🚫 Do NOT include interest rates, APR, or finance charges.",
            "Article should have more than 2000 characters"
        ]
    )

@track(name="grader_agent")
def create_grader_agent():
    return Agent(
        name="Grader",
        role="Objectively scores and improves the article",
        model=ollama_model,
        knowledge=retriever,
        search_knowledge=False,
        tools=[],
        add_datetime_to_instructions=True,
        instructions=[
            "🎓 You are an editorial quality evaluator for fintech content.",
            "🧪 Step 1: Evaluate the article on: Factual Accuracy, Writing Quality, Informational Value, SEO Readiness, Readability, Plagiarism Risk",
            "🏷️ Step 2: Assign a grade: A+, A, B, C, or D",
            "♻️ Step 3: If B, C, or D, provide critique and rewrite to A+ standards.",
        ]
    )

@track(name="evaluator_agent")
def create_evaluator_agent():
    return Agent(
        name="Evaluator",
        role="Fact-verifies and validates article data",
        model=ollama_model,
        knowledge=retriever,
        search_knowledge=True,
        tools=[DuckDuckGoTools(), Newspaper4kTools()],
        add_datetime_to_instructions=True,
        instructions=[
            "🎯 You are a fact-checker ensuring financial accuracy before publication.",
            "🧐 Review and verify: Card Names, Annual Fees, Reward Systems, Eligibility Rules, Issuer-specific Benefits",
            "🔎 Use DuckDuckGo, bank sites, and trusted fintech media for verification.",
            "🧾 Return: Verified claims, Issues found, PASS/FAIL verdict, Correction suggestions",
        ]
    )

# Create agent instances
searcher = create_searcher_agent()
writer = create_writer_agent()
grader = create_grader_agent()
evaluator = create_evaluator_agent()

# Editor Team with Opik tracking
@track(name="editor_team")
def create_editor_team():
    return Team(
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
            "✍️ Step 2: Pass URLs to Writer to create the article.",
            "🕵️ Step 3: Activate Evaluator and Grader simultaneously.",
            "✅ Step 4: Approve only if Evaluator verdict is PASS and Grader gives A or A+",
            "📄 Step 5: Final output must include complete article with markdown table, evaluation summary, and grading feedback.",
            "Article should have more than 2000 characters",
            "In article do not include steps, it should be neat and clean without any steps or instructions.",
        ]
    )

@track(name="evaluate_article_with_opik")
def evaluate_article_with_opik(article: str, topic: str, sources: List[str], context: str = ""):
    """Evaluate article using Opik's built-in and custom metrics"""
    evaluation_data = [{
        "input": topic,
        "output": article,
        "expected_output": f"High-quality article about {topic}",
        "context": context,
        "metadata": {
            "sources_count": len(sources),
            "article_length": len(article),
            "topic": topic
        }
    }]
    # Only use task argument, no metrics argument
    evaluation_results = evaluate(
        dataset=evaluation_data,
        task=lambda x: x["output"]
    )
    quality_score = article_quality_metric.score(article, topic, sources)
    results = {
        "opik_evaluation": evaluation_results,
        "custom_quality_score": quality_score,
        "metadata": {
            "article_length": len(article),
            "sources_used": len(sources),
            "evaluation_timestamp": datetime.now().isoformat()
        }
    }
    return results

@track(name="main_article_generation")
def generate_article_with_evaluation(topic: str, output_dir: str):
    """Main function to generate and evaluate article"""
    logger.info(f"Generating article for: {topic}")
    editor = create_editor_team()
    response = editor.run(f"Write a detailed article about {topic}.")
    sources = []  # Optionally extract from response if available

    # Always try to evaluate, but save article even if evaluation fails
    try:
        evaluation_results = evaluate_article_with_opik(
            article=response.content,
            topic=topic,
            sources=sources,
            context="Credit card article for Indian market"
        )
        logger.info("=== OPIK EVALUATION RESULTS ===")
        logger.info(f"Custom Quality Score: {evaluation_results['custom_quality_score']}")
        logger.info(f"Opik Evaluation: {evaluation_results['opik_evaluation']}")
    except Exception as eval_error:
        logger.error(f"Evaluation failed: {eval_error}")
        evaluation_results = {
            "custom_quality_score": {"value": 0, "reason": "Evaluation failed"},
            "opik_evaluation": "Evaluation failed",
            "metadata": {
                "article_length": len(response.content),
                "sources_used": len(sources),
                "evaluation_timestamp": datetime.now().isoformat()
            }
        }

    filename = re.sub(r'[\\/*?:"<>|]', "", topic).replace(" ", "_") + ".md"
    file_path = os.path.join(output_dir, filename)

#     enhanced_content = f"""# {topic}

# {response.content}

# ---

# ## Evaluation Summary

# **Custom Quality Score:** {evaluation_results['custom_quality_score']['value']}

# **Quality Breakdown:**
# {evaluation_results['custom_quality_score']['reason']}

# **Article Metrics:**
# - Length: {evaluation_results['metadata']['article_length']} characters
# - Sources Used: {evaluation_results['metadata']['sources_used']}
# - Evaluation Date: {evaluation_results['metadata']['evaluation_timestamp']}

# **Opik Evaluation Results:**
# {evaluation_results['opik_evaluation']}
# """

    # with open(file_path, "w", encoding="utf-8") as f:
    #     f.write(enhanced_content)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(response.content)

    logger.info(f"Enhanced article with evaluation saved to {file_path}")
    return evaluation_results

# EXECUTION
if __name__ == "__main__":
    date_str = datetime.now().strftime('%Y-%m-%d')
    base_dir = r"D:\\Welzin\\credzin"
    output_dir = os.path.join(base_dir, "Output", "blogs", date_str)
    os.makedirs(output_dir, exist_ok=True)

    topics = ["Axis Bank Credit Card Review 2025: Which Card Should You Get?"]

    for topic in topics:
        try:
            evaluation_results = generate_article_with_evaluation(topic, output_dir)
            logger.info(f"\n=== FINAL EVALUATION FOR: {topic} ===")
            logger.info(f"Overall Quality Score: {evaluation_results['custom_quality_score']['value']}")
            logger.info("=" * 50)
        except Exception as e:
            logger.error(f"Error processing topic '{topic}': {str(e)}")
            continue