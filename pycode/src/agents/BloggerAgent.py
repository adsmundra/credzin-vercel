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
import opik
from opik import Opik, track
from opik.evaluation import evaluate_prompt, evaluate
from opik.evaluation.metrics import Hallucination, AnswerRelevance, Moderation

from utils.logger import configure_logging
from utils.utilities import setup_env
from DataLoaders.QdrantDB import qdrantdb_client

# === Setup ===
logger = configure_logging("BloggerAgent")
setup_env()

# === Opik Configuration ===
os.environ["OPIK_API_KEY"] = "V26aYJ5ji7OScGEifvpnhRIe5" 
os.environ["OPIK_WORKSPACE"] = "vikram-kumawat"

# === Qdrant setup for both collections ===
qdrant_client = qdrantdb_client()
embedder = HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5")
sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")

# Collection 1: knowledge_base_hybrid1
vectorstore1 = QdrantVectorStore(
    client=qdrant_client,
    collection_name="knowledge_base_hybrid1",
    embedding=embedder,
    sparse_embedding=sparse_embeddings,
    retrieval_mode=RetrievalMode.HYBRID,
    vector_name="vector",
    sparse_vector_name="sparse-vector",
    content_payload_key="content"
)
retriever1 = vectorstore1.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 20,
        "fetch_k": 10,
        "lambda_mult": 0.5,
    },
)

# Collection 2: blogger_KB_hybrid
vectorstore2 = QdrantVectorStore(
    client=qdrant_client,
    collection_name="blogger_KB_hybrid",
    embedding=embedder,
    sparse_embedding=sparse_embeddings,
    retrieval_mode=RetrievalMode.HYBRID,
    vector_name="vector",
    sparse_vector_name="sparse-vector",
    content_payload_key="content"
)
retriever2 = vectorstore2.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 20,
        "fetch_k": 10,
        "lambda_mult": 0.5,
    },
)

# Combined retriever: merges results from both collections, tags source, and deduplicates by content
def combined_retriever(query: str, **kwargs):
    docs1 = retriever1.invoke(query)
    docs2 = retriever2.invoke(query)
    # Tag source
    for doc in docs1:
        doc.metadata = getattr(doc, "metadata", {}) or {}
        doc.metadata["source_collection"] = "knowledge_base_hybrid1"
    for doc in docs2:
        doc.metadata = getattr(doc, "metadata", {}) or {}
        doc.metadata["source_collection"] = "blogger_KB_hybrid"
    all_docs = docs1 + docs2
    seen = set()
    unique_docs = []
    for doc in all_docs:
        content = getattr(doc, "page_content", None) or doc.get("content")
        if content and content not in seen:
            seen.add(content)
            unique_docs.append(doc)
    return unique_docs

# MODEL SETUP
ollama_model = Ollama(
    id="llama3.2",
    options={"temperature": 0, "top_p": 0.95}
)

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
            if any(domain in article.lower() for domain in ["SBI", "HDFC", "Axis", "ICICI", "Amex","Yes", "IDFC", "AU", "IDBI", "IndusInd", "RBL", "HSBC", "Standard Chartered", "BOBCARD", "Kotak", "Federal"]):
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
        knowledge=combined_retriever,
        search_knowledge=True,
        tools=[DuckDuckGoTools()],
        add_datetime_to_instructions=True,
        instructions=[
            "You are a search strategist specializing in fintech. Your task is to equip a finance writer with the most credible, recent, and original sources on **credit cards in India**.",
            "🧭 Step 1: Design 7–10 precise, **non-overlapping search queries** based on the topic. Use diverse angles: customer benefits, card tiers, issuer-specific features, annual fees, eligibility rules, and government regulations.",
            "🔍 Step 2: Use DuckDuckGo to search. Prioritize **diversity and credibility**: official bank sites.",
            "✅ Step 3: Return 5 **unique, high-authority URLs** offering fresh factual data: fees, welcome bonuses, reward systems, usage tiers, issuer policies.",
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
        knowledge=combined_retriever,
        search_knowledge=True,
        tools=[],
        add_datetime_to_instructions=True,
        description="You are a senior finance writer who writes professional-grade articles.",
        instructions=[
            "🎯 Goal: Write a **long-form editorial article** (>3000 characters).",
            "🛠 Step 1: Extract structured facts using `read_article`. Focus on: card tiers, benefits, welcome bonuses, reward systems, issuer policies, and eligibility.",
            "📄 Step 2: Organize with clear sections: Introduction, Credit Card Tiers, Key Features, User Profiles, Annual Fees, Welcome Bonuses, Reward Structures, Comparison Table, Final Thoughts.",
            "✨ Enhance readability with tables, highlight boxes, bullet points, and mobile-friendly formatting.",
            "✅ Tone: professional, objective, data-driven. No marketing fluff.",
            "📌 Attribute sources softly: 'As per SBI's official website…'",
            "🚫 Do NOT include interest rates, APR, or finance charges unless they are present in collection's.",
            "Article should have more than 2000 characters"
        ]
    )

@track(name="grader_agent")
def create_grader_agent():
    return Agent(
        name="Grader",
        role="Objectively scores and improves the article",
        model=ollama_model,
        knowledge=combined_retriever,
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
        knowledge=combined_retriever,
        search_knowledge=True,
        tools=[DuckDuckGoTools()],
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
        members=[searcher, grader, writer, evaluator],
        show_tool_calls=True,
        markdown=True,
        debug_mode=True,
        show_members_responses=True,
        add_datetime_to_instructions=True,
        description="Final gatekeeper to ensure article is polished and ready for publication.",
        instructions=[
            "Task Instructions:",
            "Step 1: Write the Article. Create a detailed, engaging, and informative article on the given topic. Use only the content from the retrieved Qdrant data.",
            "- Do NOT include any facts, figures, features, or descriptions that are not explicitly stated in the data.",
            "- The article must be more than 2000 characters in length.",
            "Step 2: Structure Clearly. Organize your content using headings and subheadings that reflect the structure and flow of the original retrieved data.",
            "- Maintain logical order and readability.",
            "- If the source data includes sections like “Features,” “Benefits,” or “Eligibility,” replicate those sections accordingly.",
            "Step 3: Attribute Precisely. Ensure every fact, feature, number, or quote is matched exactly as it appears in the source.",
            "- Attribute data points to their original context or source text as presented in Qdrant.",
            "- Avoid any rounding, paraphrasing, or altering of facts.",
            "Step 4: Improve Readability. Use formatting tools like:",
            "- Bullet points for features or benefits",
            "- Tables for structured comparisons",
            "- Bold text for key highlights",
            "Keep the tone professional, clear, and objective.",
            "Step 5: Important Constraints. For any mention or inclusion of APRs, finance charges, Features, Benefits, Eligibility, or any numeric value related to a bank or card, Avoid interest rate, Never use your own knowledge or publicly known information. Never infer or guess missing details—if it's not in the retrieved content, leave it out.",
            "Goal: Deliver a data-backed, publishable fintech article that reflects only what is present in the Qdrant database. The content should be trustworthy, verifiable, and strictly source-based—nothing more, nothing less.",
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
        task="text-generation for financial article",
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
    response_list = editor.run(f"Write a detailed article about {topic}.")
    # Find the Writer's response
    writer_response = None
    if isinstance(response_list, list):
        for resp in response_list:
            if getattr(resp, "name", "") == "Writer":
                writer_response = resp
                break
    else:
        writer_response = response_list  # fallback if not a list

    if writer_response is None:
        logger.error("Writer response not found!")
        article_content = ""
    else:
        article_content = writer_response.content


    sources = []  # Optionally extract from writer_response if available

    try:
        evaluation_results = evaluate_article_with_opik(
            article=article_content,
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
                "article_length": len(response_list.content),
                "sources_used": len(sources),
                "evaluation_timestamp": datetime.now().isoformat()
            }
        }

    filename = re.sub(r'[\\/*?:"<>|]', "", topic).replace(" ", "_") + ".md"
    file_path = os.path.join(output_dir, filename)

    # Ensure the output directory exists
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(article_content)

    logger.info(f"Enhanced article with evaluation saved to {file_path}")
    return evaluation_results

# EXECUTION
if __name__ == "__main__":
    date_str = datetime.now().strftime('%Y-%m-%d')
    base_dir = r"D:\\Welzin\\credzin"
    output_dir = os.path.join(base_dir, "Output", "blogs", date_str)
    os.makedirs(output_dir, exist_ok=True)

    topics = ["SBI credit card for different user profiles in India 2025"]

    for topic in topics:
        try:
            evaluation_results = generate_article_with_evaluation(topic, output_dir)
            logger.info(f"\n=== FINAL EVALUATION FOR: {topic} ===")
            logger.info(f"Overall Quality Score: {evaluation_results['custom_quality_score']['value']}")
            logger.info("=" * 50)
        except Exception as e:
            logger.error(f"Error processing topic '{topic}': {str(e)}")
            continue


        