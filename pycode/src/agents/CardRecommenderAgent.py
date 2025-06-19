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
cards_collection = db["credit_cards"] 
# users = users_collection.find()
pipeline = [
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

def extract_best_card(resp_obj) -> str:
    """Return the card name or raise ValueError."""

    # 1  Get raw text out
    raw = (
        resp_obj.to_string()            # many agno objects expose this
        if hasattr(resp_obj, "to_string")
        else str(resp_obj)
    ).strip()

    # 2  Strip the Markdown noise so we can run a very plain regex
    clean = re.sub(r"[*_]", "", raw)   # "**Best Card:**" → "Best Card:"

    # 3  Find 'Best Card:' and capture the rest of that line
    m = re.search(r"best\s*card\s*[:\--]\s*([^\n\r]+)", clean, flags=re.I)
    if not m:
        raise ValueError("No 'Best Card' line found. Sample text:\n" + raw[:200])

    return m.group(1).strip() 

def get_card_id(card_name: str) -> str:
    """
    Return the card's internal ID stored in the credit_cards collection.
    Falls back to raising if no exact (case-insensitive) match is found.
    """
    card_doc = cards_collection.find_one(
        {"card_name": {"$regex": f"^{re.escape(card_name)}$", "$options": "i"}},
        projection={"_id": 1, "card_id": 1}        # only the fields we need
    )

    if not card_doc:
        raise LookupError(f"Card name '{card_name}' not found in credit_cards")

    # Decide which field you want to store.
    # • If you made your own numeric/string ID field, keep it.
    # • Otherwise just use Mongo’s own _id.
    return str(card_doc.get("card_id") or card_doc["_id"])

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
    (card_name, card_id)
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
            card_id   = resolve_id_fn(card_name)     # → LookupError if bad
            return card_name, card_id, resp.content              
        except Exception as exc:                     # capture both regex or DB failures
            last_err = exc
            print(f"[Attempt {attempt}] invalid result → {exc}")
            if attempt < max_attempts:
                print("Retrying …")
    # All tries failed
    raise RuntimeError(f"Recommendation failed after {max_attempts} attempts") from last_err


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
                        

    missing_benefit = response1.content if hasattr(response1,"content") else str(response1)

    prompt_final = f"""
You are a senior Indian credit-card product specialist.

========================
USER NEED
========================
The user needs the **single best** credit card that offers **{missing_benefit}** benefits.

========================
ABSOLUTE RULES (MUST FOLLOW)
========================
1. Use **only** the supplied knowledge-base documents for facts.  
   – No external knowledge, no assumptions, no guesses.
2. Recommend **one — and only one — credit card.**  
   – Zero alternatives, zero “also consider”, zero comparisons.  
   – Card name must match the KB entry **exactly** (spelling, spaces, punctuation, capitalisation).
3. Do **not** mention any card other than the single recommendation.
4. If the KB contains **no** card that provides the required benefit, output **exactly**:  
   No suitable card found in available options.  
   (Return that sentence alone.)
5. No hidden reasoning. No chain-of-thought. Output must follow the template below verbatim.

========================
OUTPUT TEMPLATE — USE EXACTLY
========================
**Best Card:** *<Exact Card Name>*  
**Why it suits:** <≤120-word justification focused on the {missing_benefit} benefit>

(Return only the two lines above — nothing else.)
""".strip()



    agent3= Agent(
    description="You are a credit card expert and analyser",
    #instructions=["Give customer suggestions based on the credit card features using the knowledge base. Only show 1 card as suggestion and no extra text"],
    instructions=[prompt_final],
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
        continue                # optional: skip writing to DB
    # ------------------------- everything below is unchanged
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