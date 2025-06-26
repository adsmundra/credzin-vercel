import io
import os, uuid
from datetime import datetime
import pandas as pd
from tqdm.notebook import tqdm
import json
import re
import urllib
import pprint
from IPython import embed
import matplotlib.font_manager
import matplotlib as mpl
from yfiles_jupyter_graphs import GraphWidget
import codecs
import base64
import PIL
from PIL import Image, ImageFont, ImageDraw, ImageColor
import textwrap
from IPython.display import Image, display
from neo4j import GraphDatabase
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate
from langchain import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import AIMessage, HumanMessage
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.schema import Document
#from langchain.docstore import InMemoryDocstore
from langchain.retrievers import ParentDocumentRetriever
from langgraph.graph.message import add_messages
from langgraph.graph import END, StateGraph, START
#from langchain.graphs import Neo4jGraph
from langchain_community.graphs import Neo4jGraph
from typing import List
from typing_extensions import TypedDict, Annotated
from langchain_experimental.graph_transformers import LLMGraphTransformer
from pydantic import BaseModel, Field
from langchain_community.vectorstores import Neo4jVector
from neo4j_graphrag.retrievers import HybridRetriever
from langchain_ollama import ChatOllama

import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
#from google.colab import drive
#from google.colab import userdata

from langchain_community.docstore.in_memory import InMemoryDocstore

import warnings
warnings.filterwarnings('ignore')

EMBEDDING_MODEL = "sentence-transformers/static-retrieval-mrl-en-v1"
LLAMA_MODEL = "llama3.2"


import os
from neo4j import GraphDatabase
import socket

# Replace with the actual URI, username and password
AURA_CONNECTION_URI = "neo4j+s://a5d9b149.databases.neo4j.io"
AURA_USERNAME = "neo4j"
AURA_PASSWORD = "TWMKINAuUNN5i4vffQz0pTysPgnrQvnQv6f5jvAY9fY"

# Driver instantiation
driver = GraphDatabase.driver(
    AURA_CONNECTION_URI,
    auth=(AURA_USERNAME, AURA_PASSWORD)
)

try:
    driver.verify_connectivity()
    print("Successfully connected to Neo4j!")
except Exception as e:
    print(f"Error connecting to Neo4j: {e}")


'''
# # Cypher query
# gds_version_query = """
#     RETURN gds.version() AS version
# """

# # Create a driver session
# with driver.session() as session:
#     # Use .data() to access the results array
#     results = session.run(gds_version_query).data()
#     print(results)
'''

'''
# Neo4j connection details (using Bolt)
NEO4J_URI="bolt://a5d9b149.databases.neo4j.io:7687"  # Updated to Bolt protocol
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="TWMKINAuUNN5i4vffQz0pTysPgnrQvnQv6f5jvAY9fY"

# Resolve the hostname to an IP address (optional, for troubleshooting)
hostname = NEO4J_URI.split("//")[1].split(":")[0]
NEO4J_IP = socket.gethostbyname(hostname)

# Update NEO4J_URI with the resolved IP address (optional)
# NEO4J_URI = f"bolt://{NEO4J_IP}:7687"

# Create driver
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

# Verify connectivity
try:
    driver.verify_connectivity()
    print("Successfully connected to Neo4j!")
except Exception as e:
    print(f"Error connecting to Neo4j: {e}")

# Close the driver when done
driver.close()
'''

'''
import os
from neo4j import GraphDatabase

# Neo4j connection details
NEO4J_URI="neo4j+s://a5d9b149.databases.neo4j.io"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="TWMKINAuUNN5i4vffQz0pTysPgnrQvnQv6f5jvAY9fY"

# Troubleshooting - try using IP address if hostname resolution is failing
# import socket
# NEO4J_IP = socket.gethostbyname(NEO4J_URI.split("//")[1].split(":")[0])
# NEO4J_URI = f"neo4j+s://{NEO4J_IP}:7687"

# Create driver
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

# Verify connectivity
try:
    driver.verify_connectivity()
    print("Successfully connected to Neo4j!")
except Exception as e:
    print(f"Error connecting to Neo4j: {e}")

# Close the driver when done
driver.close()
'''

'''
# Wait 60 seconds before connecting using these details, or login to https://console.neo4j.io to validate the Aura Instance is available
NEO4J_URI="neo4j+s://a5d9b149.databases.neo4j.io"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="TWMKINAuUNN5i4vffQz0pTysPgnrQvnQv6f5jvAY9fY"
AURA_INSTANCEID="a5d9b149"
AURA_INSTANCENAME="Instance01"

AUTH=(NEO4J_USERNAME, NEO4J_PASSWORD)
with GraphDatabase.driver(NEO4J_URI, auth=AUTH) as driver:
    driver.verify_connectivity()

os.environ["NEO4J_URI"] = NEO4J_URI
os.environ["NEO4J_USERNAME"] = NEO4J_USERNAME
os.environ["NEO4J_PASSWORD"] = NEO4J_PASSWORD

graph = Neo4jGraph()

driver = GraphDatabase.driver(
    uri=os.environ["NEO4J_URI"],
    auth=(os.environ["NEO4J_USERNAME"], os.environ["NEO4J_PASSWORD"])
)
'''


def read_files():
    print("Reading all the files in the directory...")
    csv_path = '/Users/aman/Welzin/dev/credzin/rag/cc_feats.csv'
    data_top5 = pd.read_csv(csv_path)
    data = data_top5.head(2)
    print(f"Loaded {len(data)} rows from the CSV file.")
    data
    return data

raw_document = read_files()
print(len(raw_document))

if isinstance(raw_document, pd.DataFrame):
    text_list = []
    for _, row in raw_document.iterrows():
        row_data = []
        for col in raw_document.columns:
            value = row[col]
            if pd.notna(value):
                value = str(value)
                row_data.append(f"{col.replace('_', ' ').capitalize()}: {value}")
        text = " | ".join(row_data)
        text_list.append(text)
else:
    text_list = [raw_document]

documents = [Document(page_content=text) for text in text_list]
#print("print documnets",documents)
print(type(documents))

llm = Ollama(model="LLama3.2")
llm_transformer = LLMGraphTransformer(llm=llm)

graph_documents = llm_transformer.convert_to_graph_documents(documents)
graph_documents

graph.add_graph_documents(
    graph_documents,
    baseEntityLabel=True,
    include_source=True
)

embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")

vector_index_similarity = Neo4jVector.from_documents(
    documents=documents,
    embedding=embedding,
    index_name="axis_credit_card_index",
    node_label="Document",
    text_node_property="page_content",  # property name in text_chunks
    embedding_node_property="embedding",
    graph=graph
)


default_cypher = "MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m"

def showGraph(cypher: str = default_cypher):
    # create a neo4j session to run queries
    driver = GraphDatabase.driver(
        uri = os.environ["NEO4J_URI"],
        auth = (os.environ["NEO4J_USERNAME"],
                os.environ["NEO4J_PASSWORD"]))

    session = driver.session()
    widget = GraphWidget(graph = session.run(cypher).graph())
    widget.node_label_mapping = 'id'
    display(widget)
    return widget

showGraph(default_cypher)

embedder  = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

with driver.session() as session:
    session.run("""
            CREATE FULLTEXT INDEX creditCardFulltext2 IF NOT EXISTS
            FOR (n:Document2)
            ON EACH [n.page_content2]
        """)
# Step 2: Setup Hybrid Retriever
retriever = HybridRetriever(
    driver=driver,
    vector_index_name="axis_credit_card_index1",
    fulltext_index_name="creditCardFulltext2",
    embedder=embedder,
    return_properties=["page_content"],
)

# Step 3: Fetch relevant documents
results = retriever.search(query_text=query, top_k=5)
print("Retriever Result:", results)

def grade_documents(query, k=4):
    class GradeDocument(BaseModel):
        score: str = Field(description="Document is relevant to the question, 'yes' or 'no'")

    llm_grader = ChatOllama(
        base_url="http://localhost:11434",
        model="llama3.2",
    )
    structured_llm_grader = llm_grader.with_structured_output(GradeDocument)

    grade_prompt = ChatPromptTemplate.from_messages([
        ("human", """You are a grader assessing whether an answer is useful to resolve a question.

Here is the answer:
<answer>
{generation}
</answer>
Here is the question:
<question>
{question}
</question>
Give a binary score 'yes' or 'no' to indicate whether the answer is useful to resolve a question.
Provide the binary score as a JSON with a single key 'score' and no preamble or explanation.""")
    ])

    retrieval_grader = grade_prompt | structured_llm_grader

 # Adjust this import based on where your db object is defined
    docs = qdrant.similarity_search_with_score(query, k=k)

    graded_results = []

    for i, (doc, score) in enumerate(docs):
        grade_result = retrieval_grader.invoke({
            "question": query,
            "generation": doc.page_content
        })
        graded_results.append({
            "document_number": i + 1,
            "title": doc.metadata.get("title", "No Title Found"),
            "similarity_score": score,
            "grade": grade_result.score.strip().lower(),
            "content": doc.page_content,
            "original_query": query
        })

    return graded_results

results = grade_documents("Give me some news regarding Lionel Messi")
print(results)