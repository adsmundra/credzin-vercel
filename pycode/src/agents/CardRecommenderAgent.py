import sys
sys.path.append("/home/cygwin/welzin/credzin/pycode")

import os, re 
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
from agno.tools.knowledge import KnowledgeTools

import asyncio
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_qdrant import QdrantVectorStore, RetrievalMode
from langchain_qdrant import FastEmbedSparse
import pymongo
from agno.run.response import RunResponse

from src.DataLoaders.QdrantDB import qdrantdb_client
from bson import ObjectId

# if len(sys.argv) < 2:
#     print("Error: missing user_id argument")
#     sys.exit(1)
# user_id_str = sys.argv[1]
# try:
#     user_object_id = ObjectId(user_id_str)
# except Exception as e:
#     print(f"Error: invalid user_id '{user_id_str}': {e}")
#     sys.exit(1)

# Initialize the local embedder
# embedder = SentenceTransformerEmbedder(id="all-MiniLM-L6-v2")

# os.environ["QDRANT_API_KEY"] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.SsEx9xbs-jY9DjYKrmyGatbRchqs3vQ4lbfF0vS5M4A'
# os.environ["QDRANT_URL"] = 'https://76d501b6-b754-42c1-a4da-9e0bc8cca319.us-east4-0.gcp.cloud.qdrant.io:6333'
# # Initialize ChromaDB with the local embedder
# QDRANT_URL = os.getenv("QDRANT_URL")
# QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

COLLECTION_NAME = "knowledge_base_hybrid1"

embedder = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-en-v1.5"
)
sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")

#qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
qdrant_client = qdrantdb_client()

qdrant = QdrantVectorStore(
    client=qdrant_client, # QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY),
    collection_name=COLLECTION_NAME,
    embedding=embedder,
    sparse_embedding=sparse_embeddings,
    retrieval_mode=RetrievalMode.HYBRID,
    vector_name="vector",
    sparse_vector_name="sparse-vector",
    content_payload_key="content"  
)

retriever = qdrant.as_retriever(
    search_type="mmr",                
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
        description="Documents are relevant to the question - 'yes' or 'no'"
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
# ----------------- 2)  the graded retriever wrapper  -----------------
def graded_retriever(
    query: str,
    agent: Optional[Agent] = None,
    **kwargs,
):
    # :one: Pull candidate chunks with your existing LangChain retriever
    candidate_docs: List[Document] = retriever.invoke(query)
    passed: List[dict] = []
    for doc in candidate_docs:
        grade = retrieval_grader.invoke(
            {"question": query, "document": doc.page_content}
        )
        if grade.binary_score.lower() == "yes":
            # :white_check_mark: convert to a plain dict
            passed.append(
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata or {},
                }
            )
    # Fallback – give at least one chunk so AGNO doesn't crash
    if not passed and candidate_docs:
        d = candidate_docs[0]
        passed = [{"content": d.page_content, "metadata": d.metadata or {}}]
    return passed  


class SimpleDoc(dict):
    """
    Tiny stand-in for agno.schema.Document.
    Keeps `content` & `metadata` and exposes `.to_dict()`
    so KnowledgeTools can serialise each record.
    """
    def __init__(self, content: str, metadata: dict | None = None):
        super().__init__(content=content, metadata=metadata or {})

    # KnowledgeTools calls this method internally
    def to_dict(self):
        return self

# ─── 2.  RetrieverAdapter that ALWAYS outputs SimpleDoc  ─────────────
class RetrieverAdapter:
    """
    Wraps LangChain retriever (which returns LangChain Document objects)
    and converts every element into SimpleDoc objects.
    """

    def __init__(self, base):
        self.base = base  # the LangChain retriever

    def _convert(self, docs):
        out: list[SimpleDoc] = []
        for d in docs:
            # 1) LangChain Document  →  SimpleDoc
            if hasattr(d, "page_content"):
                out.append(SimpleDoc(d.page_content, d.metadata or {}))

            # 2) Already dict-like (e.g. second-pass KnowledgeTools result)
            elif isinstance(d, dict) and "content" in d:
                out.append(SimpleDoc(d["content"], d.get("metadata", {})))

            # 3) Any other object that has .content attr
            elif hasattr(d, "content"):
                out.append(SimpleDoc(d.content, getattr(d, "metadata", {})))

            # 4) Fallback – stringify
            else:
                out.append(SimpleDoc(str(d), {}))
        return out

    # KnowledgeTools will call this
    def search(self, query: str, **kwargs):
        raw_docs = self.base.invoke(query)          # LangChain call
        return self._convert(raw_docs)  

adapted_retriever = RetrieverAdapter(retriever)


myclient = pymongo.MongoClient("mongodb+srv://Welzin:yYsuyoXrWcxPKmPV@welzin.1ln7rs4.mongodb.net/credzin?retryWrites=true&w=majority&appName=Welzin")
db = myclient["credzin"]       
users_collection = db["users"]           

all_users = list(users_collection.find({}))
# all_users = list(users_collection.find({ "_id": user_object_id }))

cards_collection = db["credit_cards"] 
# users = users_collection.find()
pipeline = [
    # { "$match": { "_id": user_object_id } },
    {
        "$lookup": {
            "from": "credit_cards",
            "localField": "CardAdded",      # array of ObjectIds on each user
            "foreignField": "_id",
            "as": "cards",
        }
    },
    { "$unwind": "$cards" },                # one document per card
    {
        "$group": {                         # back to one row per user
            "_id": "$_id",
            "firstName":   { "$first": "$firstName"   },
            "AgeRange":    { "$first": "$ageRange"    },
            "profession":  { "$first": "$profession"  },
            "salaryRange": { "$first": "$salaryRange" },
            "location":    { "$first": "$location"    },
            "card_names":  { "$addToSet": "$cards.card_name" },
        }
    },
    {
        "$project": {
            "_id": 0,               # drop Mongo's _id
            "user_id":    "$_id",   # rename for the front-end
            "firstName":  1,
            "AgeRange":   1,
            "profession": 1,
            "salaryRange":1,
            "location":   1,
            "card_names": 1,
        }
    },
]


import re

def extract_best_card(resp_obj) -> str:
    raw = resp_obj.to_string() if hasattr(resp_obj, "to_string") else str(resp_obj)
    clean = raw.strip()
    
    # Check for "no suitable card" response first
    if "no suitable card found" in clean.lower():
        return "NO_SUITABLE_CARD"
    
    # Pattern 1: Exact format match - **Best Card:** *CardName*
    pattern1 = re.compile(r"\*\*Best Card:\*\*\s*\*([^*]+Credit Card)\*", re.IGNORECASE)
    match = pattern1.search(clean)
    if match:
        return match.group(1).strip()
    
    # Pattern 2: Bold Best Card with any card name in italics
    pattern2 = re.compile(r"\*\*Best Card:\*\*[^\n]*?\*([^*]+Credit Card)\*", re.IGNORECASE)
    match = pattern2.search(clean)
    if match:
        return match.group(1).strip()
    
    # Pattern 3: "Best Card" followed by card name (with or without formatting)
    pattern3 = re.compile(r"best card[:\-–\s]*\*?([A-Z][A-Za-z0-9 &\-]+Credit Card)\*?", re.IGNORECASE)
    match = pattern3.search(clean)
    if match:
        return match.group(1).strip()
    
    # Pattern 4: Any credit card name as fallback
    pattern4 = re.compile(r"([A-Z][A-Za-z\s&\-]{5,}Credit Card)")
    match = pattern4.search(clean)
    if match:
        card_name = match.group(1).strip()
        # Validate it's a reasonable card name
        if len(card_name.split()) >= 2:  # At least 2 words
            return card_name
    
    # If all patterns fail, raise error with more context
    raise ValueError(f"No 'Best Card' found. Response text:\n{clean[:300]}...")

def extract_key_terms(card_name: str) -> list:
    """
    Extract meaningful terms from card name for flexible matching.
    Removes common prefixes/suffixes and focuses on unique identifiers.
    """
    # Remove common words that vary
    stop_words = {"the", "bank", "credit", "card", "co", "ltd", "limited"}
    
    # Split and clean
    words = re.findall(r'\w+', card_name.lower())
    key_terms = [word for word in words if word not in stop_words and len(word) > 2]
    
    return key_terms

def get_card_id(card_name: str) -> str:
    """
    Return the card's internal ID using flexible matching.
    First tries exact match, then falls back to key term matching.
    """
    # Try exact match first (your original approach)
    card_doc = cards_collection.find_one(
        {"card_name": {"$regex": f"^{re.escape(card_name)}$", "$options": "i"}},
        projection={"_id": 1, "card_id": 1, "card_name": 1}
    )
    
    if card_doc:
        return str(card_doc.get("card_id") or card_doc["_id"])
    
    # If exact match fails, try flexible matching
    key_terms = extract_key_terms(card_name)
    
    if not key_terms:
        raise LookupError(f"Card name '{card_name}' has no meaningful terms for matching")
    
    # Build regex pattern that matches cards containing the key terms
    # For "ICICI Emeralde Credit Card" -> looks for cards containing both "icici" and "emeralde"
    patterns = []
    for term in key_terms:
        patterns.append(f"(?=.*{re.escape(term)})")
    
    # Combined pattern: must contain ALL key terms (case insensitive)
    combined_pattern = "".join(patterns) + ".*"
    
    # Find cards that match the pattern
    matching_cards = list(cards_collection.find(
        {"card_name": {"$regex": combined_pattern, "$options": "i"}},
        projection={"_id": 1, "card_id": 1, "card_name": 1}
    ))
    
    if not matching_cards:
        raise LookupError(f"No cards found matching key terms: {key_terms} from '{card_name}'")
    
    if len(matching_cards) > 1:
        # Multiple matches - try to find the best one
        card_names = [doc["card_name"] for doc in matching_cards]
        print(f"Multiple matches found for '{card_name}': {card_names}")
        
        # Prefer shorter names (less likely to have extra words)
        best_match = min(matching_cards, key=lambda x: len(x["card_name"]))
        print(f"Selected best match: {best_match['card_name']}")
        return str(best_match.get("card_id") or best_match["_id"])
    
    # Single match found
    matched_card = matching_cards[0]
    print(f"Flexible match: '{card_name}' -> '{matched_card['card_name']}'")
    return str(matched_card.get("card_id") or matched_card["_id"])

# Alternative simpler approach - just use the most distinctive term
def get_card_id_simple(card_name: str) -> str:
    """
    Simplified version - finds the most distinctive word and searches for it.
    Good for cases like "Emeralde" which is unique enough.
    """
    # Try exact match first
    card_doc = cards_collection.find_one(
        {"card_name": {"$regex": f"^{re.escape(card_name)}$", "$options": "i"}},
        projection={"_id": 1, "card_id": 1, "card_name": 1}
    )
    
    if card_doc:
        return str(card_doc.get("card_id") or card_doc["_id"])
    
    # Extract words and find the most distinctive one
    words = re.findall(r'\w+', card_name.lower())
    stop_words = {"the", "bank", "credit", "card", "co", "ltd", "limited", "icici", "hdfc", "sbi", "axis"}
    
    # Find the most unique word (longest non-common word)
    distinctive_words = [w for w in words if w not in stop_words and len(w) > 3]
    
    if not distinctive_words:
        raise LookupError(f"No distinctive terms found in '{card_name}'")
    
    # Use the longest distinctive word for matching
    key_term = max(distinctive_words, key=len)
    
    # Search for cards containing this term
    matching_cards = list(cards_collection.find(
        {"card_name": {"$regex": key_term, "$options": "i"}},
        projection={"_id": 1, "card_id": 1, "card_name": 1}
    ))
    
    if not matching_cards:
        raise LookupError(f"No cards found containing '{key_term}' from '{card_name}'")
    
    if len(matching_cards) == 1:
        matched_card = matching_cards[0]
        print(f"Match found: '{card_name}' -> '{matched_card['card_name']}'")
        return str(matched_card.get("card_id") or matched_card["_id"])
    
    # Multiple matches - you might want to add more logic here
    card_names = [doc["card_name"] for doc in matching_cards]
    print(f"Multiple matches for '{key_term}': {card_names}")
    
    # Return the first match or implement more sophisticated selection
    return str(matching_cards[0].get("card_id") or matching_cards[0]["_id"])

def recommend_card_for_user(
    agent: Agent,
    extract_fn,
    resolve_id_fn,
    max_attempts: int = 2,
) -> tuple[str, str]:
    """
    Run the agent up to max_attempts times until we obtain
    a (card_name, card_id) pair that exists in MongoDB.

    Returns
    -------
    (card_name, card_id, response_content)
    Raises
    ------
    RuntimeError if all attempts fail.
    """
    last_err = None
    for attempt in range(1, max_attempts + 1):
        resp = agent.run("recommend only 1 credit card name",
                         stream=False, markdown=True)

        try:
            card_name = extract_fn(resp.content)
            card_id = resolve_id_fn(card_name)     # Now uses flexible matching
            return card_name, card_id, resp.content              
        except Exception as exc:                     
            last_err = exc
            print(f"[Attempt {attempt}] invalid result → {exc}")
            if attempt < max_attempts:
                print("Retrying …")
    
    # All tries failed
    raise RuntimeError(f"Recommendation failed after {max_attempts} attempts") from last_err

# Usage examples:
# Use the comprehensive matching:
# card_id = get_card_id("ICICI Bank Emeralde Credit Card")

# Or use the simpler distinctive word matching:
# card_id = get_card_id_simple("The ICICI Emeralde Credit Card")


# -------------------------------------------------------------------
# 3.  Execute and grab the results
# -------------------------------------------------------------------
users_with_cards = list(db.users.aggregate(pipeline, allowDiskUse=True))
for user in users_with_cards:
    print(user)
    user_id = str(user['user_id'])  
    card_names = user["card_names"]
    # id = user["_id"]
    name =  user["firstName"]
    age =  user["AgeRange"]
    profession =  user["profession"]
    income =  user["salaryRange"]
    location =  user["location"]
    # list_of_cards =  user["CardAdded"]
    print('user details:: ', user_id, name, age, profession, income, location, card_names)
    # age = 23
    # profession = 'software developer'
    # income = 15000
    # location = 'Mohali'
    # list_of_cards = ['Axis Bank Vistara Credit Card', 'Axis Bank Atlas Credit Card', 'Axis Bank Rewards Credit Card']
    #response = agent3.print_response("{name} is a {age} years old {profession} with a monthly salary of INR {income} working in {location}. He already have these credit cards {list_of_cards}. Recommend him another credit card.", stream=True, markdown=True)
    prompt = f"""
You are a senior credit-card product specialist in the Indian market.

========================
STRICT TASK INSTRUCTIONS
========================
You MUST analyze and use **every single one** of the following credit cards that the customer currently holds:

{', '.join(card_names)}

Use ONLY your knowledge base to extract the benefits of these exact cards — do not assume or generalize.

Your task is to:
1. Identify the actual, factual benefits offered by **each** card listed.
2. Group the total benefits into **broad benefit categories** like travel, fuel, dining, lounge access, etc.
3. Ensure every benefit category in your response is **explicitly supported by at least one of the user's cards**.
4. Do NOT skip any card. Each must be accounted for in your benefit list.

========================
RESPONSE FORMAT
========================
Return a **clean list** of benefit categories the user already has. Do NOT explain the cards. Do NOT include card names.

Output example (bullet points only, nothing else):
- Travel benefits  
- Dining offers  
- Fuel surcharge waiver  
- Movie discounts  
- Airport lounge access
"""


    # response = agent3.print_response(
    #                                 prompt,
    #                                 stream=True,
    #                                 markdown=True,
    #                                 )


    ollama_model = Ollama(
        id="llama3.2",
        # every key here is forwarded to the Ollama server
        options={"temperature": 0.0, "top_p": 0.95}
    )
    
    knowledge_tools = KnowledgeTools(
        knowledge=adapted_retriever,
        think=True,   
        search=True,  
        analyze=True,  
        add_few_shot=True, 
    )

    agent1= Agent(
        description="You are a credit card expert and analyser",
        #instructions=["Give customer suggestions based on the credit card features using the knowledge base. Only show 1 card as suggestion and no extra text"],
        instructions=[prompt],
        #knowledge=combined_knowledge_base,
        search_knowledge=True,
        model=ollama_model,
        #reasoning_model=Ollama(id="deepseek-r1:1.5b"),
        #tools=[ThinkingTools(add_instructions=True)],
        tools=[knowledge_tools, ReasoningTools(add_instructions=True)],
        #tools=[ThinkingTools(add_instructions=True), ReasoningTools(add_instructions=True)],
        markdown=True,
        debug_mode=True,
    )

    response = agent1.run(
                        "Give all the benefits of each credit card user holds",
                        stream=False,
                        markdown=True,
                        )

    full_answer = response.content if hasattr(response, "content") else str(response)

    prompt_stage2 = f"""
You are a senior Indian credit-card analyst.

========================
BENEFITS ALREADY OWNED
========================
Below is the user's current benefit report:

{full_answer}

========================
STRICT TASK
========================
1. Study the report and determine **exactly ONE major benefit category that is NOT ALREADY PRESENT.**
   • Do NOT mention or restate any benefit the user already has.
2. Output **one line only** in the precise format below—no explanations, no extra words, no bullet points:

Search query: Give best credit card which provide <missing benefit> benefits
""".strip()


    agent2 = Agent(
    description="You are a credit card expert and analyser",
    #instructions=["Give customer suggestions based on the credit card features using the knowledge base. Only show 1 card as suggestion and no extra text"],
    instructions=[prompt_stage2],
    #knowledge=combined_knowledge_base,
    model=ollama_model,
    #reasoning_model=Ollama(id="deepseek-r1:1.5b"),
    #tools=[ThinkingTools(add_instructions=True)],
    tools=[ReasoningTools(add_instructions=True)],
    #tools=[ThinkingTools(add_instructions=True), ReasoningTools(add_instructions=True)],
    markdown=True,
    debug_mode=True,
    )

    response1=agent2.run(
                        "Give the query for missing benefits",
                        stream=False,
                        markdown=True,
                        )
                        

    m = re.search(r"provide\s+(.*?)\s+benefits", response1.content, flags=re.I)
    missing_benefit = m.group(1).strip() if m else response1.content.strip()

    example = """**Best Card:** *HDFC Regalia Credit Card*  
**Why it suits:** Offers lounge access and complimentary stays …""".strip()

    prompt_final = f"""You are a senior Indian credit-card product specialist.

Find the SINGLE best credit card for {missing_benefit} benefits.

CRITICAL: You MUST output EXACTLY this format - nothing else:

{example}

RULES:
1. Use ONLY knowledge-base documents
2. Recommend ONE card only - exact name from KB
3. Card name must match the KB entry **exactly** (spelling, spaces, punctuation, capitalisation)
3. If no suitable card exists, output ONLY: "No suitable card found in available options."
4. NO extra text, NO alternatives, NO explanations beyond the 2-line format
5. Start with "**Best Card:**" then italicized card name with asterisks

OUTPUT THE 2 LINES ONLY - NOTHING ELSE.""".strip()



    agent3= Agent(
    description="You are a credit card expert and analyser",
    #instructions=["Give customer suggestions based on the credit card features using the knowledge base. Only show 1 card as suggestion and no extra text"],
    instructions=[prompt_final, "CRITICAL: Follow the exact 2-line format shown in the example.", "Do NOT add any text before, after, or between the two required lines."],
    #knowledge=combined_knowledge_base,
    search_knowledge=True,
    model=ollama_model,
    #reasoning_model=Ollama(id="deepseek-r1:1.5b"),
    #tools=[ThinkingTools(add_instructions=True)],
    tools=[knowledge_tools, ReasoningTools(add_instructions=True)],
    #tools=[ThinkingTools(add_instructions=True), ReasoningTools(add_instructions=True)],
    markdown=True,
    debug_mode=True,
    )

    # response2 = agent3.run(
    #                     missing_benefit,
    #                     stream=False,
    #                     markdown=True,
    #                     )



    try:
        best_card_name, card_id, suggestion_txt = recommend_card_for_user(
            agent3,
            extract_best_card,   # your regex helper
            get_card_id          # Mongo lookup helper
        )
    except RuntimeError as e:
        print("Giving up for this user: ", e)
        continue               

    print("Resolved:", best_card_name, card_id)

    mycol = db["recommendations4"]
    # user_suggestion = { "_id":"682c46b8f4a86be58de43b95", "suggestion": response.to_string() }
    # print(user_suggestion)
    #result = mycol.insert_one({ "_id" : user_collection["_id"], 'suggestion':user_suggestion["suggestion"]})

    query   = {"user_id": user_id}   # “primary key”
    update  = {
        "$set": {
            "card_id": card_id,
            "card_name":  best_card_name,
            "suggestion": suggestion_txt
        }
    }

    result = mycol.update_one(query, update, upsert=True)
    print(result.acknowledged)
    # query_filter = { "_id" : user_suggestion["_id"] }
    # update_operation = { "$set" : 
    #     { "suggestion" : user_suggestion["suggestion"] }
    # }
    # result = mycol.update_many(query_filter, update_operation)
    # print(result.modified_count)