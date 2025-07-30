from comet_ml import Experiment

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

# Updated Opik and Comet imports
import opik
from opik import Opik, track
from opik.evaluation import evaluate
from opik.evaluation.metrics import Hallucination
from comet_ml import Experiment

from utils.logger import configure_logging
from utils.utilities import setup_env
from DataLoaders.QdrantDB import qdrantdb_client

import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)


# === Setup ===
logger = configure_logging("BloggerAgent")
setup_env()

# === Opik Configuration ===
os.environ["OPIK_API_KEY"] = "OoELaezFSqRJFAzN5VyQx2ODc" 
os.environ["OPIK_WORKSPACE"] = "hub-welzin"

# === Comet ML Configuration ===
experiment = Experiment(
    api_key="OoELaezFSqRJFAzN5VyQx2ODc",  # Replace with your actual Comet API key
    project_name="fintech-articles",
    workspace="hub-welzin"  # Replace with your actual Comet workspace
)

# === Comet ML Configuration ===
experiment = Experiment(
    api_key="V26aYJ5ji7OScGEifvpnhRIe5",  # Replace with your actual Comet API key
    project_name="fintech-articles",
    workspace="vikram-kumawat"  # Replace with your actual Comet workspace
)

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

# Updated Custom Quality Metric Function
def article_quality_metric(article: str, topic: str, sources: List[str]) -> float:
    """Enhanced article quality scoring"""
    try:
        # Base score from length and sources
        length_score = min(len(article) / 3000, 1.0)  # Target 3000+ chars
        sources_score = len(sources) * 0.1
        
        # Structure scoring
        required_sections = [
            "introduction", "credit card", "tier", "features", 
            "fees", "bonus", "reward", "comparison", "conclusion"
        ]
        article_lower = article.lower()
        structure_score = sum(1 for section in required_sections if section in article_lower) / len(required_sections)
        
        # Content quality indicators
        key_elements = [
            "annual fee", "reward", "eligibility", "benefit", 
            "welcome bonus", "cashback", "points"
        ]
        content_score = sum(1 for element in key_elements if element in article_lower) / len(key_elements)
        
        # Readability features
        has_formatting = any(marker in article for marker in ["|", "#", "•", "-"])
        readability_score = 0.2 if has_formatting else 0.0
        
        # Calculate final score
        final_score = (length_score * 0.3 + sources_score * 0.2 + structure_score * 0.3 + 
                      content_score * 0.15 + readability_score * 0.05)
        
        return min(final_score, 1.0)
        
    except Exception as e:
        logger.error(f"Error in article quality metric: {e}")
        return 0.5  # Default score on error

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
            "- If the source data includes sections like: Features, Benefits, or Eligibility, replicate those sections accordingly.",
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

# Updated evaluation function
@track(name="evaluate_article_with_opik")
def evaluate_article_with_opik(article: str, topic: str, sources: List[str], context: str = ""):
    """Evaluate article using Opik's built-in metrics and custom scoring"""
    evaluation_data = [{
        "input": {
            "question": topic,
            "context": context
        },
        "output": article,
        "expected_output": f"High-quality article about {topic}",
        "metadata": {
            "sources_count": len(sources),
            "article_length": len(article),
            "topic": topic
        }
    }]
    
    try:
        # Evaluate with Opik using Hallucination metric
        evaluation_results = evaluate(
            dataset=evaluation_data,
            task="text-generation for financial article",
            scoring_metrics=[Hallucination()]
        )
    except Exception as e:
        logger.error(f"Opik evaluation failed: {e}")
        evaluation_results = []
    
    # Calculate custom quality score
    quality_score = article_quality_metric(article, topic, sources)
    
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

# Updated main article generation function
@track(name="generate_article_with_evaluation")
def generate_article_with_evaluation(topic: str, output_dir: str):
    """Main function to generate and evaluate article with enhanced logging"""
    logger.info(f"Generating article for: {topic}")
    
    # Generate article using the editor team
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

    # Retrieve context and sources for evaluation
    try:
        retrieved_docs: List[Document] = combined_retriever(topic)
        retrieved_context = "\n\n".join([doc.page_content for doc in retrieved_docs])
        sources = [doc.metadata.get("source", "unknown") for doc in retrieved_docs]
    except Exception as e:
        logger.error(f"Error retrieving context: {e}")
        retrieved_context = ""
        sources = []

    # Evaluate article
    try:
        evaluation_results = evaluate_article_with_opik(
            article=article_content,
            topic=topic,
            sources=sources,
            context=retrieved_context
        )
        logger.info("=== OPIK EVALUATION RESULTS ===")
        logger.info(f"Custom Quality Score: {evaluation_results['custom_quality_score']}")
        logger.info(f"Opik Evaluation: {evaluation_results['opik_evaluation']}")
    except Exception as eval_error:
        logger.error(f"Evaluation failed: {eval_error}")
        evaluation_results = {
            "custom_quality_score": 0,
            "opik_evaluation": "Evaluation failed",
            "metadata": {
                "article_length": len(article_content),
                "sources_used": len(sources),
                "evaluation_timestamp": datetime.now().isoformat()
            }
        }

    # Save article to file
    filename = re.sub(r'[\\/*?:"<>|]', "", topic).replace(" ", "_") + ".md"
    file_path = os.path.join(output_dir, filename)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(article_content)

    # Log to Comet ML
    try:
        experiment.log_text(article_content, metadata={"topic": topic, "file_path": file_path})
        experiment.log_metric("custom_quality_score", evaluation_results["custom_quality_score"])
        experiment.log_metric("article_length", len(article_content))
        experiment.log_metric("sources_count", len(sources))
        
        # Log Opik evaluation results if available
        if evaluation_results["opik_evaluation"] and isinstance(evaluation_results["opik_evaluation"], list):
            # Flatten if nested list
            flat_results = []
            for item in evaluation_results["opik_evaluation"]:
                if isinstance(item, list):
                    flat_results.extend(item)
                else:
                    flat_results.append(item)

            for result in flat_results:
                if isinstance(result, dict):
                    experiment.log_metric(result.get("name", "unknown_metric"), result.get("value", 0))
                    if "reason" in result:
                        experiment.log_text(result["reason"], metadata={
                            "topic": topic, 
                            "metric_type": result.get("name", "unknown"),
                            "reason_type": "evaluation_reason"
                        })

        
        logger.info("Successfully logged to Comet ML")
    except Exception as comet_error:
        logger.error(f"Failed to log to Comet ML: {comet_error}")

    logger.info(f"Enhanced article with evaluation saved to {file_path}")
    return evaluation_results

# EXECUTION
if __name__ == "__main__":
    date_str = datetime.now().strftime('%Y-%m-%d')
    base_dir = r"D:\\Welzin\\credzin"
    output_dir = os.path.join(base_dir, "Output", "blogs", date_str)
    os.makedirs(output_dir, exist_ok=True)

    topics = ["How to use Credit card effectively",]

    for topic in topics:
        try:
            evaluation_results = generate_article_with_evaluation(topic, output_dir)
            logger.info(f"\n=== FINAL EVALUATION FOR: {topic} ===")
            logger.info(f"Overall Quality Score: {evaluation_results['custom_quality_score']}")
            logger.info("=" * 50)
        except Exception as e:
            logger.error(f"Error processing topic '{topic}': {str(e)}")
            continue

    # End the Comet experiment
    experiment.end()