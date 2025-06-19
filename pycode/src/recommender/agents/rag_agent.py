"""
RAG Agent: Ingests case files and performs document-based retrieval using embeddings.
"""
from src.Utils.utils import *

def rag_agent(input):
    """
    Uses the LangChain Ollama LLaMA 3.2 model for Retrieval-Augmented Generation (RAG).
    """
    logger.info("Executing RAG pipeline")

    if "case_data" not in input:
        logger.error("Missing 'case_data' in input. Cannot proceed with RAG pipeline.")
        return {"error": "Missing 'case_data' in input."}

    try:
        case_data = input["case_data"]
        prompt = (
                    "You are an expert credit card analyst."
                    "Suggest the best credit cards in each cattegory based on the follwing credit card data"
                    "Document:\n"
                    f"{case_data}\n\n"
                    "Instructions:\n"
                    "- Suggest 1 best card for every category\n"
                    "Begin your extraction below:"
                )
        #logger.info(f"Prompt for LLM:\n {prompt}")

        # Invoke the model
        response = LLM.invoke(prompt)
        print_llm_response(response)

        retrieved_data = response.content 
        logger.info(f"RAG pipeline result:\n {retrieved_data}")

        return {"retrieved_data": retrieved_data}
    
    except ConnectionError as ce:
        logger.error(f"ConnectionError during RAG operation: {ce}")
        return {"error": "ConnectionError occurred during RAG operation."}
    except Exception as e:
        logger.error(f"Unexpected error in RAG operation: {e}")
        return {"error": "An unexpected error occurred during RAG operation."}