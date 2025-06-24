import sys
sys.path.append("pycode")

import os
import pandas as pd
import PyPDF2
from pathlib import Path
import time
from typing import Optional, List

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

from agno.knowledge.langchain import LangChainKnowledgeBase
import gradio as gr
from langchain_qdrant import Qdrant
from langchain_huggingface import HuggingFaceEmbeddings
from agno.agent import Agent
from agno.models.ollama import Ollama
from agno.tools.reasoning import ReasoningTools

import asyncio
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_qdrant import QdrantVectorStore, RetrievalMode
from langchain_qdrant import FastEmbedSparse

from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

from src.DataLoaders.QdrantDB import qdrantdb_client

# os.environ["QDRANT_API_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.SsEx9xbs-jY9DjYKrmyGatbRchqs3vQ4lbfF0vS5M4A"
# os.environ["QDRANT_URL"] = "https://76d501b6-b754-42c1-a4da-9e0bc8cca319.us-east4-0.gcp.cloud.qdrant.io:6333/"

# QDRANT_URL = os.getenv("QDRANT_URL")
# QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

COLLECTION_NAME = "knowledge_base_hybrid1"


## This code is for ingestion



# Folder paths
# PDF_FOLDER = "PDFs"
# CSV_FOLDER = "CSVs"
# MD_FOLDER = "MDs"

# # Initialize clients
# print(" Initializing system...")
# client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
# embedding_model = SentenceTransformer('BAAI/bge-large-en-v1.5', trust_remote_code=True)

# # Text splitter
# text_splitter = RecursiveCharacterTextSplitter(
#     chunk_size=768,
#     chunk_overlap=128,
#     length_function=len,
#     separators=["\n\n", "\n", " ", ""]
# )

# sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")

# def setup_collection():
#     """Create or verify Qdrant collection"""
#     try:
#         collection_info = client.get_collection(COLLECTION_NAME)
#         has_dense_config = "vector" in collection_info.config.vectors_config.config_by_name
#         has_sparse_config = "sparse_vector" in collection_info.config.vectors_config.config_by_name

#         if has_dense_config and has_sparse_config:
#             print(f"Collection '{COLLECTION_NAME}' already exists with dense and sparse vector configurations.")
#             create_new_collection = False
#         else:
#             print(f"Collection '{COLLECTION_NAME}' exists but needs update for hybrid search. Recreating...")
#             client.delete_collection(collection_name=COLLECTION_NAME)
#             create_new_collection = True

#     except:
#         print(f"Collection '{COLLECTION_NAME}' not found. Creating a new one for hybrid search.")
#         create_new_collection = True

#     if create_new_collection:
#         client.create_collection(
#             collection_name=COLLECTION_NAME,
#             vectors_config={
#                 "vector": VectorParams(size=1024, distance=Distance.COSINE)  # Must match model output: 1536
#             },
#             sparse_vectors_config={
#                 "sparse-vector": SparseVectorParams()
#             }
#         )
#         print(f"Created collection '{COLLECTION_NAME}' with dense and sparse vector configurations.")

# def extract_pdf_documents():
#     """Extract all PDF documents from PDF folder"""
#     documents = []
#     pdf_folder = Path(PDF_FOLDER)

#     if not pdf_folder.exists():
#         print(f"PDF folder '{PDF_FOLDER}' not found")
#         return documents

#     pdf_files = list(pdf_folder.glob("*.pdf"))
#     print(f"Found {len(pdf_files)} PDF files")

#     for pdf_path in pdf_files:
#         try:
#             print(f"Processing: {pdf_path.name}")
#             with open(pdf_path, 'rb') as file:
#                 reader = PyPDF2.PdfReader(file)
#                 full_text = ""

#                 for page_num, page in enumerate(reader.pages):
#                     page_text = page.extract_text()
#                     full_text += f"\n--- Page {page_num + 1} ---\n{page_text}"

#                 if full_text.strip():
#                     doc = Document(
#                         page_content=full_text,
#                         metadata={
#                             "source": str(pdf_path),
#                             "type": "pdf",
#                             "filename": pdf_path.name,
#                             "pages": len(reader.pages)
#                         }
#                     )
#                     documents.append(doc)
#                     print(f"Extracted {len(reader.pages)} pages")

#         except Exception as e:
#             print(f"Error: {e}")

#     return documents

# def extract_csv_documents():
#     """Extract all spreadsheet (CSV and XLSX) documents"""
#     documents = []
#     csv_folder = Path(CSV_FOLDER)

#     if not csv_folder.exists():
#         print(f"Folder '{CSV_FOLDER}' not found")
#         return documents

#     spreadsheet_files = list(csv_folder.glob("*.csv")) + list(csv_folder.glob("*.xlsx"))
#     print(f"Found {len(spreadsheet_files)} spreadsheet files")

#     for file_path in spreadsheet_files:
#         try:
#             if file_path.suffix == ".csv":
#                 print(f"Processing CSV: {file_path.name}")
#                 df = pd.read_csv(file_path)

#                 spreadsheet_text = f"Spreadsheet File: {file_path.name}\n"
#                 spreadsheet_text += f"Columns: {', '.join(df.columns.tolist())}\n"
#                 spreadsheet_text += f"Total Rows: {len(df)}\n\n"

#                 for idx, row in df.iterrows():
#                     row_parts = [f"{col}={val}" for col, val in row.items() if pd.notna(val)]
#                     spreadsheet_text += f"Row {idx + 1}: " + " | ".join(row_parts) + "\n"

#                 doc = Document(
#                     page_content=spreadsheet_text,
#                     metadata={
#                         "source": str(file_path),
#                         "type": "csv",
#                         "filename": file_path.name,
#                         "rows": len(df),
#                         "columns": list(df.columns)
#                     }
#                 )
#                 documents.append(doc)

#             elif file_path.suffix == ".xlsx":
#                 print(f"Processing XLSX: {file_path.name}")
#                 try:
#                     xls = pd.ExcelFile(file_path)
#                     for sheet_name in xls.sheet_names:
#                         df = pd.read_excel(xls, sheet_name=sheet_name)

#                         spreadsheet_text = f"Excel File: {file_path.name} | Sheet: {sheet_name}\n"
#                         spreadsheet_text += f"Columns: {', '.join(df.columns.tolist())}\n"
#                         spreadsheet_text += f"Total Rows: {len(df)}\n\n"

#                         for idx, row in df.iterrows():
#                             row_parts = [f"{col}={val}" for col, val in row.items() if pd.notna(val)]
#                             spreadsheet_text += f"Row {idx + 1}: " + " | ".join(row_parts) + "\n"

#                         doc = Document(
#                             page_content=spreadsheet_text,
#                             metadata={
#                                 "source": str(file_path),
#                                 "type": "xlsx",
#                                 "filename": file_path.name,
#                                 "sheet": sheet_name,
#                                 "rows": len(df),
#                                 "columns": list(df.columns)
#                             }
#                         )
#                         documents.append(doc)
#                 except ImportError:
#                     print(f"Error: openpyxl not installed. Skipping {file_path.name}")
#                     continue

#         except Exception as e:
#             print(f"Error processing {file_path.name}: {e}")

#     print(f"Extracted {len(documents)} documents from spreadsheets")
#     return documents

# def extract_md_documents():
#     """Extract all Markdown documents from MD folder"""
#     documents = []
#     md_folder = Path(MD_FOLDER)

#     if not md_folder.exists():
#         print(f"MD folder '{MD_FOLDER}' not found")
#         return documents

#     md_files = list(md_folder.glob("*.md"))
#     print(f"Found {len(md_files)} Markdown files")

#     for md_path in md_files:
#         try:
#             print(f"Processing: {md_path.name}")
#             with open(md_path, 'r', encoding='utf-8') as file:
#                 content = file.read()

#                 if content.strip():
#                     doc = Document(
#                         page_content=content,
#                         metadata={
#                             "source": str(md_path),
#                             "type": "markdown",
#                             "filename": md_path.name
#                         }
#                     )
#                     documents.append(doc)
#                     print(f"Extracted content ({len(content)} chars)")

#         except Exception as e:
#             print(f"Error: {e}")

#     return documents

# def chunk_documents(documents):
#     """Split documents into chunks"""
#     print(f"Splitting {len(documents)} documents into chunks...")
#     all_chunks = []

#     for doc in documents:
#         chunks = text_splitter.split_documents([doc])
#         all_chunks.extend(chunks)

#     print(f"Created {len(all_chunks)} chunks")
#     return all_chunks

# def insert_chunks(chunks, batch_size=1):
#     total_inserted = 0
#     for i in range(0, len(chunks), batch_size):
#         batch = chunks[i:i+batch_size]

#         dense_embeddings = embedding_model.encode(
#             [f"passage: {c.page_content}" for c in batch],
#             normalize_embeddings=True,
#             show_progress_bar=False
#         )
#         sparse_embs = sparse_embeddings.embed_documents([c.page_content for c in batch])

#         points = []
#         for j, chunk in enumerate(batch):
#             dense_vec = dense_embeddings[j].tolist()
#             se = sparse_embs[j]

#             # This is the corrected section
#             point = PointStruct(
#                 id=i + j,
#                 vector={
#                     "vector": dense_vec,
#                     "sparse-vector": SparseVector(
#                         # Removed .tolist() from the next two lines
#                         indices=se.indices,
#                         values=se.values
#                     )
#                 },
#                 payload={
#                     "content": chunk.page_content,
#                     "source": chunk.metadata.get("source", ""),
#                     "type": chunk.metadata.get("type", ""),
#                     "filename": chunk.metadata.get("filename", ""),
#                     "chunk_id": i + j,
#                     "metadata": chunk.metadata
#                 }
#             )
#             points.append(point)

#         client.upsert(collection_name=COLLECTION_NAME, points=points, wait=True)
#         total_inserted += len(points)
#         print(f"Inserted batch {i//batch_size + 1}, total so far {total_inserted}")
#         time.sleep(0.1)

#     return total_inserted

# def search_knowledge_base(query, top_k=5):
#     """Search the knowledge base"""
#     print(f"Performing hybrid search for: '{query}'")

#     # Generate dense query embeddings
#     query_text_dense = f"query: {query}"
#     query_embedding_dense = embedding_model.encode([query_text_dense], normalize_embeddings=True)[0]

#     # Handle dense embedding format
#     if hasattr(query_embedding_dense, 'tolist'):
#         query_embedding_dense = query_embedding_dense.tolist()
#     elif isinstance(query_embedding_dense, np.ndarray):
#         query_embedding_dense = query_embedding_dense.tolist()

#     # Generate sparse query embedding
#     query_embedding_sparse = sparse_embeddings.embed_query(query)

#     # Handle sparse embedding format
#     sparse_indices = query_embedding_sparse.indices
#     sparse_values = query_embedding_sparse.values

#     if hasattr(sparse_indices, 'tolist'):
#         sparse_indices = sparse_indices.tolist()
#     if hasattr(sparse_values, 'tolist'):
#         sparse_values = sparse_values.tolist()

#     query_sparse_data = {
#         "indices": sparse_indices,
#         "values": sparse_values
#     }

#     try:
#         # Perform hybrid search using the new Query API
#         results = client.search(
#             collection_name=COLLECTION_NAME,
#             query=Query(
#                 fusion=Fusion.RRF,
#                 query_vectors={
#                     "vector": query_embedding_dense,
#                     "sparse-vector": query_sparse_data
#                 }
#             ),
#             limit=top_k,
#             with_payload=True
#         )

#         search_results = []
#         for hit in results.points:
#             search_results.append({
#                 "content": hit.payload["page_content"],
#                 "score": hit.score,
#                 "source": hit.payload.get("source", ""),
#                 "type": hit.payload.get("type", ""),
#                 "filename": hit.payload.get("filename", "")
#             })

#         return search_results

#     except Exception as e:
#         print(f"Search error: {e}")
#         return []

# def get_collection_stats():
#     """Get collection statistics"""
#     try:
#         count = client.count(COLLECTION_NAME)
#         return count.count
#     except:
#         return 0

# def main():
#     """Main ingestion process"""
#     print("🚀 Starting Document Ingestion Process")
#     print("=" * 50)

#     # Setup collection
#     setup_collection()

#     # Extract documents from all folders
#     print("\n📂 Extracting documents...")
#     all_documents = []

#     # Extract PDFs
#     pdf_docs = extract_pdf_documents()
#     all_documents.extend(pdf_docs)

#     # Extract CSVs
#     csv_docs = extract_csv_documents()
#     all_documents.extend(csv_docs)

#     # Extract Markdown
#     md_docs = extract_md_documents()
#     all_documents.extend(md_docs)

#     if not all_documents:
#         print("❌ No documents found! Please check your folder structure.")
#         return

#     print(f"\n📊 Summary:")
#     print(f"  - PDFs: {len(pdf_docs)} files")
#     print(f"  - CSVs: {len(csv_docs)} files")
#     print(f"  - Markdown: {len(md_docs)} files")
#     print(f"  - Total: {len(all_documents)} documents")

#     # Chunk documents
#     chunks = chunk_documents(all_documents)

#     # Insert into Qdrant
#     total_inserted = insert_chunks(chunks)

#     # Final stats
#     print(f"\n🎉 Ingestion Complete!")
#     print(f"  - Documents processed: {len(all_documents)}")
#     print(f"  - Chunks created: {len(chunks)}")
#     print(f"  - Successfully inserted: {total_inserted}")
#     print(f"  - Total in collection: {get_collection_stats()}")

# if __name__ == "__main__":
#     main()

embedder = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-en-v1.5"
)
sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")
#qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
qdrant_client = qdrantdb_client()

try:
    print(f"Collection '{COLLECTION_NAME}' info:")
    resp1 = qdrant_client.collection_exists('knowledge_base_hybrid')
    print('resp1: ', resp1)
    resp2 = qdrant_client.get_collection('knowledge_base_hybrid')
    print('resp2: ', resp2)
except Exception as e:
    print(f"Error checking collection: {str(e)}")
    print(f"Error type: {type(e).__name__}")
qdrant = QdrantVectorStore(
    client=QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY),
    collection_name=COLLECTION_NAME,
    embedding=embedder,
    sparse_embedding=sparse_embeddings,
    retrieval_mode=RetrievalMode.HYBRID,
    vector_name="vector",
    sparse_vector_name="sparse-vector",
    content_payload_key="content"  # <-- THIS IS THE FIX
)
retriever = qdrant.as_retriever(
    search_type="mmr",                 # ← important
    search_kwargs={
        "k": 10,                        # final documents returned
        "fetch_k": 20,                 # candidate pool MMR will re-rank
        "lambda_mult": 0.5,            # diversity ↔ relevance (0 = max diversity)
    },
)
# ----------------- 1)  set-up the grader – identical to your snippet  ---------
class GradeDocuments(BaseModel):
    """Binary score for relevance check on retrieved documents."""
    binary_score: str = Field(
        description="Documents are relevant to the question – 'yes' or 'no'"
    )
grader_llm = ChatOpenAI(
    api_key="ollama",
    model="llama3.2",
    base_url="http://localhost:11434/v1",
)
structured_grader = grader_llm.with_structured_output(GradeDocuments)
GRADER_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "human",
            """
You are a grader assessing whether a retrieved document is relevant to a question.
Here is the document:
<document>
{document}
</document>
Here is the question:
<question>
{question}
</question>
Give a binary score 'yes' or 'no' to indicate whether the document is relevant to the question.
Provide the binary score as a JSON with a single key 'binary_score' and no preamble or explanation.
"""
        )
    ]
)
retrieval_grader = GRADER_PROMPT | structured_grader

# ----------------- 2)  reranker setup --------------------------------
# You can choose a different cross-encoder model if needed.
# 'cross-encoder/ms-marco-MiniLM-L-6-v2' is a good general-purpose reranker.
reranker_model_name = "cross-encoder/ms-marco-MiniLM-L-6-v2"
reranker_tokenizer = AutoTokenizer.from_pretrained(reranker_model_name)
reranker_model = AutoModelForSequenceClassification.from_pretrained(reranker_model_name)

# ----------------- 2)  the graded retriever wrapper  -----------------
def graded_retriever(
    query: str,
    agent: Optional[Agent] = None,
    **kwargs,
):
    # :one: Pull candidate chunks with your existing LangChain retriever
    # 1. Pull candidate chunks with your existing LangChain retriever
    candidate_docs: List[Document] = retriever.invoke(query)
    
    # 2. Grade documents for initial relevance
    passed_for_reranking: List[dict] = []
    for doc in candidate_docs:
        grade = retrieval_grader.invoke(
            {"question": query, "document": doc.page_content}
        )
        if grade.binary_score.lower() == "yes":
            # :white_check_mark: convert to a plain dict
            print("Document passed grading.")
            passed_for_reranking.append(
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata or {},
                }
            )
        else:
            print("Document failed grading.")
    
    # Fallback – give at least one chunk so AGNO doesn't crash
    if not passed_for_reranking and candidate_docs:
        print("No documents passed grading, falling back to first candidate document.")
        d = candidate_docs[0]
        passed_for_reranking = [{"content": d.page_content, "metadata": d.metadata or {}, "original_doc": d}]
    
    # 3. Rerank the passed documents
    if passed_for_reranking:
        # Prepare pairs for reranker: [query, document_content]
        sentence_pairs = [[query, item["content"]] for item in passed_for_reranking]
        
        # Tokenize and get scores
        features = reranker_tokenizer(sentence_pairs, padding=True, truncation=True, return_tensors='pt')
        reranker_model.eval() # Set model to evaluation mode
        with torch.no_grad():
            scores = reranker_model(**features).logits.squeeze().tolist()
        # Combine documents with their scores and sort
        reranked_docs_with_scores = []
        for i, item in enumerate(passed_for_reranking):
            reranked_docs_with_scores.append({
                "score": scores[i],
                "doc": item
            })
        
        # Sort by score in descending order
        reranked_docs_with_scores.sort(key=lambda x: x["score"], reverse=True)
        # Extract the reranked documents in the desired format
        final_reranked_docs = []
        for item in reranked_docs_with_scores:
            final_reranked_docs.append({
                "content": item["doc"]["content"],
                "metadata": item["doc"]["metadata"]
            })
        
        print(f"Reranked {len(final_reranked_docs)} documents.")
        print(f"Reranked docs scores:\n")
        print("DOC  |  SCORE\n-------------")
        for i in range(len(reranked_docs_with_scores)):
            print(f"{reranked_docs_with_scores[i]['doc']}   |    {reranked_docs_with_scores[i]['score']}")
        # You can adjust how many top documents to return after reranking
        # For example, return top 5: final_reranked_docs[:5]
        return final_reranked_docs
    else:
        print("No documents available for reranking.")
        return [] # Return an empty list if no documents passed grading or fallback
    
# ----------------- 4)  plug the wrapper into an AGNO agent  -----------------

prompt = """
<persona>
You are a senior Indian credit-card product specialist. Reply in a clear, approachable tone suitable for everyday banking customers while maintaining professional accuracy.
</persona>

<scope>
Rely **only** on the retrieved documents for factual content; do not introduce external knowledge.
</scope>

<rules>
1. **Source-bound** - Cite the document ID for every fact you state, e.g. [doc-2].
2. **Focus** - If the user names a specific credit card, centre your answer on that card. Mention other cards only if the user explicitly asks for comparisons.
3. **No speculation** - If information is missing, say so plainly. Never guess or fabricate.
4. **No chain-of-thought** - Do not reveal internal reasoning or analysis steps.
</rules>

<guidance>
Adapt your structure (bullets, short paragraphs, tables, etc.) to fit the user's question. There is **no fixed template**; your goal is clarity and relevance.
</guidance>
"""
agent = Agent(
    retriever=graded_retriever,
    search_knowledge=True,
    instructions=[prompt],
    model=Ollama(
        id="llama3.2",
        options={"temperature": 0.0, "top_p": 0.95},
    ),
    tools=[ReasoningTools(add_instructions=True)],
    markdown=True,
    debug_mode=True,
)

# ----------------- 4)  ask a question  -----------------
# agent.print_response(
#     "What are the terms and conditions for the Axis Bank REWARD credit card?",
#     stream=True,
#     markdown=True,
# )

def get_answer(message, history):
    response_chunks = []
    for chunk in agent.run(message, stream=True, markdown=True):
        if hasattr(chunk, "content") and chunk.content:
            response_chunks.append(chunk.content)

    full_answer = "".join(response_chunks) if response_chunks else "Sorry, no answer available."

    return full_answer




# Gradio chat interface
chatbot = gr.Chatbot(label="Credit Card Specialist", type="messages")
demo = gr.ChatInterface(
    fn=get_answer,
    chatbot=chatbot,
    title="Credit Card Chatbot",
    description="Ask anything about credit cards and get expert answers.",
    examples=[
        "Tell me about Axis Bank Reward Credit Card T&Cs.",
        "Give me the best Amex credit cards?",
    ],
)

# Launch app
if __name__ == "__main__":
    demo.launch(
    server_name="0.0.0.0",
    server_port=7860,
    debug=True,
    share=False,
    show_api=False,         # ← stops the failing /info route
)