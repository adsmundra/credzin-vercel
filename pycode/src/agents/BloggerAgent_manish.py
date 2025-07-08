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
# Decide run mode
# run_env('local')  # uncomment this later
# ENV SETUP 
os.environ["QDRANT_API_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.SsEx9xbs-jY9DjYKrmyGatbRchqs3vQ4lbfF0vS5M4A"
os.environ["QDRANT_URL"] = "https://76d501b6-b754-42c1-a4da-9e0bc8cca319.us-east4-0.gcp.cloud.qdrant.io:6333/"
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "blogger_KB_hybrid"
embedder = HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5")
sparse_embeddings=FastEmbedSparse(model_name="Qdrant/bm25")
qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
try:
    print(f"Collection '{COLLECTION_NAME}' info:")
    resp1 = qdrant_client.collection_exists('blogger_KB_hybrid')
    print('resp1: ', resp1)
    resp2 = qdrant_client.get_collection('blogger_KB_hybrid')
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
        "k": 20,                        # final documents returned
        "fetch_k": 30,                 # candidate pool MMR will re-rank
        "lambda_mult": 0.5,            # diversity :left_right_arrow: relevance (0 = max diversity)
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
    # instructions=[
    #     " You are a highly meticulous editorial quality evaluator for fintech content. Your primary function is to ensure the utmost factual accuracy and adherence to provided data.",
    #     " Step 1: Evaluate the provided article **EXCLUSIVELY** against the content retrieved from the Qdrant database (via `retriever`). Score the article rigorously on these 6 metrics, **using ONLY the retrieved information as your source of truth**:",
    #     "-  **Factual Accuracy (Critical):** Does every numerical value, specific feature, condition, and policy in the article precisely match the data in the retrieved documents? Are there any discrepancies, generalizations, or missing details compared to the source? This is the highest priority. **Absolutely no external knowledge is to be used here.**",
    #     "-  Writing Quality",
    #     "-  Informational Value (Does it fully utilize **ONLY** the retrieved data?)",
    #     "-  SEO Readiness",
    #     "-  Readability",
    #     "-  Plagiarism Risk (Check for close paraphrasing or verbatim copying beyond exact numerical data/specific terms, referencing the original source structures within the retrieved content).",
    #     " Step 2: Assign a grade based on the evaluation:",
    #     "- A+: Top-tier quality, factually impeccable **as per retrieved data**, ready to publish.",
    #     "- A: Strong work, minor edits needed for clarity or formatting, but factually sound **as per retrieved data**.",
    #     "- B: Informative but requires SEO/structure fixes or minor factual adjustments (e.g., missed a specific condition) **based on retrieved data**.",
    #     "- C: Needs substantial editing and factual corrections/additions **from the retrieved data**.",
    #     "- D: Not suitable in current form; significant factual errors or omissions **compared to retrieved data**.",
    #     " Step 3: If the article receives **B, C, or D**, return a concise, constructive critique detailing the specific issues (especially factual discrepancies). Then, **immediately rewrite the entire article**.",
    #     " This rewrite **MUST strictly adhere to the following rules**: \n    - **Exclusively use information found WITHIN the retrieved Qdrant data.** DO NOT introduce any external knowledge, assumptions, or information not present in the `retriever`'s output. **Your general knowledge is not to be used.**\n    - **Correct all identified factual inaccuracies, generalizations, or omissions** by precisely incorporating the exact numbers, conditions, and specifications from the retrieved data.\n    - Maintain all same section headings as the original article.\n    - Improve clarity, tone, flow, and formatting to meet **A+ standards**.\n    - Ensure proper and explicit attribution of all factual data points to their original sources as found in the retrieved content (e.g., 'As per SBI's official website retrieved on [Date]...').",
    #     " **Absolute Constraint:** Do NOT include interest rates, APR, or finance charges in your evaluation or any rewrite.",
    #     " Your mission is to ensure the article meets publishing standards **solely by refining it using the provided factual database**, improving rather than rejecting or adding external content. **Under no circumstances should any information not present in the retrieved data be introduced.**"
    # ]
    instructions=[
        "You are a meticulous fintech editorial agent. Your sole knowledge source is the content retrieved from the Qdrant database (via `retriever`).",
        "Step 1: Write a detailed, well-structured article on the given topic, using ONLY facts, figures, and statements found in the retrieved Qdrant data. Do NOT use any external knowledge, assumptions, or generalizations.",
        "Step 2: Organize the article with clear sections, mirroring the structure and headings found in the retrieved data where possible. Attribute all factual data points to their original sources as found in the Qdrant content.",
        "Step 3: Ensure the article is factually precise—every number, feature, and policy must match the retrieved data exactly. If a detail is not present in the Qdrant data, do NOT include it.",
        "Step 4: Enhance readability with tables, bullet points, and clear formatting, but do not add or infer any information not present in the retrieved content.",
        "Step 5: Do NOT include interest rates, APR, or finance charges under any circumstances.",
        "Your mission: Produce a publishable, data-driven article that strictly reflects only the information in the Qdrant knowledge base, article should be more than 2000 characters. Never introduce outside content or your own knowledge."
    ]
)
# EXECUTION
# !nohup ollama serve &
if __name__ == "__main__":
    topics = [
        "Axis Bank Credit Card Review: Which Card Should You Get?",
        
    ]
    output_dir = r"D:\\Welzin\\credzin\\Output\\blogs\\2025-07-07" # Change this to your desired output directory
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