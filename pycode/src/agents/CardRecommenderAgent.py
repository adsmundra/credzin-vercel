import os, re, sys
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
from agno.knowledge.langchain import LangChainKnowledgeBase
from bson import ObjectId

from utils.logger import configure_logging
from utils.utilities import setup_env
from DataLoaders.QdrantDB import qdrantdb_client

class CardRecommendation(BaseModel):
    card_name: str = Field(
        description="Exact credit-card name as it appears in the knowledge base"
    )
    reason: str = Field(
        description="≤ 120-word justification focused on the missing benefit"
    )

logger = configure_logging("CardRecommenderAgent")
setup_env()
qdrant_client = qdrantdb_client()

if len(sys.argv) < 2:
    logger.error("missing user_id argument")
    sys.exit(1)
user_id_str = sys.argv[1]
try:
    user_object_id = ObjectId(user_id_str)
except Exception as e:
    logger.error("invalid user_id '%s': %s", user_id_str, e)
    sys.exit(1)

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
        "k": 5,                        # final documents returned
        "fetch_k": 10,                 # candidate pool MMR will re-rank
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
kb = LangChainKnowledgeBase(retriever=adapted_retriever)



myclient = pymongo.MongoClient("mongodb+srv://Welzin:yYsuyoXrWcxPKmPV@welzin.1ln7rs4.mongodb.net/credzin?retryWrites=true&w=majority&appName=Welzin")
db = myclient["credzin"]       
users_collection = db["users"]           

# all_users = list(users_collection.find({}))
all_users = list(users_collection.find({ "_id": user_object_id }))

cards_collection = db["Credit_card_V2"]
# users = users_collection.find()
pipeline = [
    { "$match": { "_id": user_object_id } },
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



def get_card_id(card_name: str) -> str:
    """
    Look up a card’s internal ID, tolerating whitespace / dash / case variations.
    Raises LookupError if nothing matches.
    """
    import re

    # --- 1. Strip issuer suffixes and parentheticals ------------------------
    name = re.sub(r"\s+by\s+.+$", "", card_name, flags=re.I).strip()
    name = re.sub(r"\s*[-–]\s*.+$", "", name).strip()
    name = re.sub(r"\s*\([^)]*\)\s*$", "", name).strip()

    # --- 2. Collapse internal whitespace to single spaces -------------------
    name = re.sub(r"\s+", " ", name)

    # --- 3. Convert the cleaned name into a flexible regex ------------------
    # e.g. "Axis Bank AURA Credit Card"  →  r"^Axis\s+Bank\s+AURA\s+Credit\s+Card$"
    tokens   = map(re.escape, name.split(" "))
    pattern  = r"\s+".join(tokens)
    regex    = f"^{pattern}$"

    card_doc = cards_collection.find_one(
        {"card_name": {"$regex": regex, "$options": "i"}},
        projection={"_id": 1, "card_id": 1},
    )

    if not card_doc:
        raise LookupError(f"Card name '{card_name}' not found in credit_cards")

    return str(card_doc.get("card_id") or card_doc["_id"])

# pull evidence chunks for the missing benefit

def get_supporting_docs(query: str, top_k: int = 6) -> str:
    """Return a single text blob of top-k graded chunks, separated by ---."""
    docs = graded_retriever(query)
    return "\n\n---\n\n".join(d["content"] for d in docs[:top_k])


# run LLM with structured output and KB context

def ask_llm_for_card(missing_benefit: str) -> CardRecommendation:
    docs = graded_retriever(missing_benefit)          # ← keep list form
    logger.debug("=== SUPPORTING CHUNKS for '%s' ===", missing_benefit)
    for i, d in enumerate(docs[:6], 1):
        logger.debug("[%d] %s …", i, d["content"][:300].replace(chr(10), " "))

    kb_blob = "\n\n---\n\n".join(d["content"] for d in docs[:6])

    PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a senior Indian credit-card product specialist. "
        "Use only the supplied knowledge-base documents to answer."
    ),
    (
        "human",
f"""TASK:
The user needs **one** credit card that provides **{missing_benefit}** benefits.

KNOWLEDGE BASE DOCUMENTS
------------------------
{kb_blob}

STRICT INSTRUCTIONS – **read carefully**:
• Recommend **exactly one** card.
• The **card_name** field **must appear verbatim in the documents** –
  *no issuer prefixes/suffixes (“by …”), no bracketed text, no added or removed spaces,
  no change in capitalisation, and no other embellishment*.
  It must be a **byte-for-byte match** to its occurrence in the documents.
• Output **pure JSON** matching **exactly** this schema (no extra keys, comments, or text):
  {{
    "card_name": "<Exact Card Name>",
    "reason": "<≤120-word justification>"
  }}
• If no suitable card exists, output:
  {{"card_name": "NONE", "reason": "No suitable card found in available options."}}
""".replace("{", "{{").replace("}", "}}")
    )
])

    llm_json = ChatOpenAI(
        api_key="ollama",
        model="llama3.2",
        base_url="http://localhost:11434/v1",
    ).with_structured_output(CardRecommendation)

    return (PROMPT | llm_json).invoke({})


def recommend_card_for_user(agent: Agent, resolve_id_fn, max_attempts: int = 2):
    last_err = None
    for attempt in range(1, max_attempts + 1):
        run_resp = agent.run("Recommend exactly one card", stream=False)
        result: CardRecommendation = run_resp.content   # ← structured output

        # ▸▸ add the snippet right here ◂◂
        if result.card_name.upper() == "NONE":
            last_err = RuntimeError(result.reason)
        else:
            try:
                card_id = resolve_id_fn(result.card_name)
                # success – return all three values
                return result.card_name, card_id, result.reason
            except LookupError as exc:
                last_err = exc

        if attempt < max_attempts:
            logger.info("Retrying …")
            

    raise RuntimeError(f"Recommendation failed after {max_attempts} attempts") from last_err



users_with_cards = list(db.users.aggregate(pipeline, allowDiskUse=True))
for user in users_with_cards:
    logger.debug("Raw user doc: %s", user)
    user_id = str(user['user_id'])  
    card_names = user["card_names"]
    # id = user["_id"]
    name =  user["firstName"]
    age =  user["AgeRange"]
    profession =  user["profession"]
    income =  user["salaryRange"]
    location =  user["location"]
    # list_of_cards =  user["CardAdded"]
    logger.info(
        "User details → id=%s | name=%s | age=%s | profession=%s | income=%s "
        "| location=%s | cards=%s",
        user_id, name, age, profession, income, location, card_names,
    )
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
You MUST analyze and use **every single one** of the following credit cards:

{', '.join(card_names)}

RULES:
- DO NOT repeat tool calls for the same card more than once.
- If you’ve already analyzed a card, move to the next one.
- You are allowed to use each tool (search/analyze) at most ONCE per card.
- STOP when all cards are covered.

Your task is to:
1. Identify actual, factual benefits for each card.
2. Group them into **broad benefit categories** (travel, lounge, fuel, etc.).
3. Each benefit must come from **at least one card**.

RESPONSE FORMAT:
Output only the **distinct benefit categories**. No card names or explanations.

Example:
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
        think=False,   
        search=True,  
        analyze=True,  
        add_few_shot=False, 
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


    rec: CardRecommendation = ask_llm_for_card(missing_benefit)

    if rec.card_name.upper() == "NONE":
        logger.warning("No suitable card for user %s", user_id)
        continue

    # Single retry logic for card_id resolution
    retries = 1
    for attempt in range(retries + 1):
        try:
            recommended_card_id = get_card_id(rec.card_name)
            break
        except LookupError as e:
            if attempt == retries:
                logger.error("Final retry failed for recommended_card_id: %s", e)
                continue  # or: raise e
            logger.warning("Retry %d failed: %s", attempt + 1, e)     

    logger.info("Resolved: %s  (%s)", rec.card_name, recommended_card_id)

    mycol = db["recommendations"]
    # user_suggestion = { "_id":"682c46b8f4a86be58de43b95", "suggestion": response.to_string() }
    # print(user_suggestion)
    #result = mycol.insert_one({ "_id" : user_collection["_id"], 'suggestion':user_suggestion["suggestion"]})

    query   = {"user_id": user_id}   # “primary key”
    update  = {
        "$set": {
            "card_id": recommended_card_id,
            "card_name":  rec.card_name,
            "suggestion": rec.reason
        }
    }

    result = mycol.update_one(query, update, upsert=True)
    logger.debug("Mongo acknowledged: %s", result.acknowledged)
    # query_filter = { "_id" : user_suggestion["_id"] }
    # update_operation = { "$set" : 
    #     { "suggestion" : user_suggestion["suggestion"] }
    # }
    # result = mycol.update_many(query_filter, update_operation)
    # print(result.modified_count)