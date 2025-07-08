# from src.utils.utils import *  # uncomment later
import os
from agno.agent import Agent
from agno.models.ollama import Ollama
from agno.team.team import Team
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.newspaper4k import Newspaper4kTools
from langchain_qdrant import QdrantVectorStore
from langchain.embeddings import HuggingFaceEmbeddings
from qdrant_client import QdrantClient
from agno.agent import Agent
from agno.models.ollama import Ollama
from agno.tools.reasoning import ReasoningTools
import re
from langchain_qdrant import FastEmbedSparse, QdrantVectorStore, RetrievalMode
from langchain_qdrant import FastEmbedSparse
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from typing import Optional, List
from langchain.schema import Document

from utils.logger import configure_logging
from utils.utilities import setup_env
from DataLoaders.QdrantDB import qdrantdb_client
# Decide run mode
# run_env('local')  # uncomment this later
# ENV SETUP 


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


reranker_model_name = "cross-encoder/ms-marco-MiniLM-L-6-v2"
reranker_tokenizer = AutoTokenizer.from_pretrained(reranker_model_name)
reranker_model = AutoModelForSequenceClassification.from_pretrained(reranker_model_name)
# --- Modified Retriever Wrapper (No Grader, only Reranker) ---
def reranked_retriever(
    query: str,
    agent: Optional[Agent] = None,
    **kwargs,
) -> List[dict]:
    # 1. Pull candidate chunks with your existing LangChain retriever
    # We fetch more documents here (fetch_k) to give the reranker a larger pool
    # to select the most relevant ones from.
    candidate_docs: List[Document] = retriever.invoke(query)
    
    # 2. Prepare documents for reranking
    # Convert LangChain Documents to the dictionary format expected by the reranking logic
    docs_to_rerank = []
    for doc in candidate_docs:
        docs_to_rerank.append({
            "content": doc.page_content,
            "metadata": doc.metadata or {},
            "original_doc": doc # Keep original doc for now if needed, though not strictly required
        })
    
    # Fallback – give at least one chunk so AGNO doesn't crash
    if not docs_to_rerank and candidate_docs:
        print("No documents retrieved, falling back to first candidate document (though this case should be rare with fetch_k > 0).")
        d = candidate_docs[0]
        docs_to_rerank = [{"content": d.page_content, "metadata": d.metadata or {}, "original_doc": d}]
    elif not docs_to_rerank:
        print("No documents retrieved at all.")
        return [] # Return empty if no documents found
    # 3. Rerank the documents
    if docs_to_rerank:
        # Prepare pairs for reranker: [query, document_content]
        sentence_pairs = [[query, item["content"]] for item in docs_to_rerank]
        
        # Tokenize and get scores
        features = reranker_tokenizer(sentence_pairs, padding=True, truncation=True, return_tensors='pt')
        reranker_model.eval() # Set model to evaluation mode
        with torch.no_grad():
            scores = reranker_model(**features).logits.squeeze().tolist()
        # Combine documents with their scores and sort
        reranked_docs_with_scores = []
        for i, item in enumerate(docs_to_rerank):
            reranked_docs_with_scores.append({
                "score": scores[i],
                "doc": item # 'doc' here is the dictionary we prepared earlier
            })
        
        # Sort by score in descending order
        reranked_docs_with_scores.sort(key=lambda x: x["score"], reverse=True)
        print(f"Reranked {len(reranked_docs_with_scores)} candidate documents.")
        print("--- Reranked Document Scores ---")
        print("SCORE     | DOCUMENT CONTENT (first 100 chars)")
        print("--------------------------------------------------")
        # Print top N documents for a cleaner log
        num_docs_to_print = min(5, len(reranked_docs_with_scores)) # Print top 5 or fewer if less are available
        for i in range(num_docs_to_print):
            doc_content_preview = reranked_docs_with_scores[i]['doc']['content'].replace('\n', ' ')[:100]
            print(f"{reranked_docs_with_scores[i]['score']:.4f}  | {doc_content_preview}...")
        print("--------------------------------------------------")
        # Extract the top 'k' reranked documents in the desired format for Agno
        # Using retriever.search_kwargs["k"] to determine the final number of docs
        final_reranked_docs = []
        for item in reranked_docs_with_scores[:retriever.search_kwargs["k"]]:
            final_reranked_docs.append({
                "content": item["doc"]["content"],
                "metadata": item["doc"]["metadata"]
            })
        
        print(f"Returning top {len(final_reranked_docs)} documents to the agent.")
        return final_reranked_docs
    else:
        print("No documents available for reranking.")
        return [] # Return an empty list if no documents retrieved
#MODEL SETUP
ollama_model = Ollama(
    id = "llama3.2",
    options={"temperature":0.3, "top_p":0.95}
)
# Agent
main_agent = Agent(
    name="main",
    role="Objectively scores and improves the article",
    model=ollama_model,
    retriever=reranked_retriever,
    search_knowledge=True,
    tools=[ReasoningTools(add_instructions=True)],
    add_datetime_to_instructions=True,
    debug_mode=True,
    markdown=True,
    instructions=[
        "Task Instructions:",

        "Step 1: Write the Article"
        "Create a detailed, engaging, and informative article on the given topic. Use only the content from the retrieved Qdrant data. ", 
        "- Do NOT include any facts, figures, features, or descriptions that are not explicitly stated in the data.",  
        "- The article must be more than 2000 characters in length.",

        "Step 2: Structure Clearly",  
        "Organize your content using headings and subheadings that reflect the structure and flow of the original retrieved data.",  
        "- Maintain logical order and readability.",  
        "- If the source data includes sections like “Features,” “Benefits,” or “Eligibility,” replicate those sections accordingly.",

        "Step 3: Attribute Precisely",  
        "Ensure every fact, feature, number, or quote is matched exactly as it appears in the source.",  
        "- Attribute data points to their original context or source text as presented in Qdrant.",  
        "- Avoid any rounding, paraphrasing, or altering of facts.",

        "Step 4: Improve Readability",  
        "Use formatting tools like:",  
        "- Bullet points for features or benefits",  
        "- Tables for structured comparisons",  
        "- Bold text for key highlights",  
        "Keep the tone professional, clear, and objective.",

        "Step 5: Important Constraints",  
        "mention or include interest rates, APRs, or finance charges.",  
        "Never use your own knowledge or publicly known information.",  
        "Never infer or guess missing details—if it's not in the retrieved content, leave it out.",

        "Goal:",  
        "Deliver a data-backed, publishable fintech article that reflects only what is present in the Qdrant database. The content should be trustworthy, verifiable, and strictly source-based—nothing more, nothing less.",

    ]
    # instructions=[
    #     "You are a meticulous fintech editorial agent. Your sole knowledge source is the content retrieved from the Qdrant database (via `retriever`).",
    #     "Step 1: Write a detailed, well-structured article on the given topic, using ONLY facts, figures, and statements found in the retrieved Qdrant data. Do NOT use any external knowledge, assumptions, or generalizations.",
    #     "Step 2: Organize the article with clear sections, mirroring the structure and headings found in the retrieved data where possible. Attribute all factual data points to their original sources as found in the Qdrant content.",
    #     "Step 3: Ensure the article is factually precise—every number, feature, and policy must match the retrieved data exactly. If a detail is not present in the Qdrant data, do NOT include it.",
    #     "Step 4: Enhance readability with tables, bullet points, and clear formatting, but do not add or infer any information not present in the retrieved content.",
    #     "Step 5: Do NOT include interest rates, APR, or finance charges under any circumstances.",
    #     "Your mission: Produce a publishable, data-driven article that strictly reflects only the information in the Qdrant knowledge base, article should be more than 2000 characters. Never introduce outside content or your own knowledge."
    # ]
)
# EXECUTION
# !nohup ollama serve &
if __name__ == "__main__":
    topics = [
        "Axis Bank Credit Card Review: Which Card Should You Get?",
        
    ]
    output_dir = r"D:\\Welzin\\credzin\\Output\\blogs\\2025-07-08" # Change this to your desired output directory
    os.makedirs(output_dir, exist_ok=True)  # Ensure the output directory exists
    for topic in topics:
        print(f"\nGenerating article for: {topic}")
        response = main_agent.run(f"Write a detailed article about {topic}.")
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