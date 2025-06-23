from .logger import logger
from langchain_ollama import ChatOllama
from langchain_core.messages import AIMessage
import os
from fpdf import FPDF
from datetime import datetime
import subprocess


def get_llm(logger_instance):
    """
    Returns the LLM instance configured for the application.

    Args:
        logger_instance (logging.Logger): Logger instance for logging.

    Returns:
        ChatOllama: The LLM instance.
    """
    logger_instance.info("Initializing LLM instance - Llama3.2 model.")
    return ChatOllama(model="llama3.2", base_url="http://localhost:11434")

def print_llm_response(response):
    """
    Pretty prints an LLM response, handling different possible types.

    Args:
        logger (logging.Logger): Logger instance for logging.
        response: The LLM response object, usually AIMessage or str.
    """
    logger.info("\n" + "=" * 40 + "\nLLM Response:\n" + "=" * 40)

    if isinstance(response, AIMessage):
        logger.info(response.content.strip())
    elif isinstance(response, str):
        logger.info(response.strip())
    elif hasattr(response, 'content'):
        logger.info(response.content.strip())
    else:
        logger.warning("⚠️ Unrecognized response type. Dumping raw content:")
        logger.info(vars(response))

def setup_env():   # local, colab, server
    """
    Sets up environment:
    - If in Colab: installs necessary packages and sets up Ollama.
    - If local: does nothing.
    """

    # Detect Colab environment
    try:
        from google.colab import drive  # Colab detection
        from google.colab import auth
        from google.auth import default
        import gspread
        IN_COLAB = True
    except ImportError:
        IN_COLAB = False

    if IN_COLAB:
        print("✅ Detected Google Colab environment.")
        print("🔧 Installing required packages and setting up Ollama...")

        # Install Python packages
        subprocess.run(['pip', 'install', 'agno', 'duckduckgo-search', 'ollama'], check=True)

        # Install Ollama and CUDA drivers
        subprocess.run('curl https://ollama.ai/install.sh | sh', shell=True, check=True)
        subprocess.run("echo 'debconf debconf/frontend select Noninteractive' | sudo debconf-set-selections", shell=True)
        subprocess.run(['sudo', 'apt-get', 'update'], check=True)
        subprocess.run(['sudo', 'apt-get', 'install', '-y', 'cuda-drivers'], check=True)

        # Set environment variable
        os.environ['LD_LIBRARY_PATH'] = '/usr/lib64-nvidia'

        # Start Ollama server in background
        subprocess.Popen('nohup ollama serve &', shell=True)

        # Pull model
        subprocess.run(['ollama', 'pull', 'llama3.2'], check=True)

        print("Running on Colab → mounting Drive and authenticating...")
        drive.mount('/content/drive')
        auth.authenticate_user()
        creds, _ = default()
        gc = gspread.authorize(creds)

        print("✅ Colab setup complete.")

    else:
        print("🖥️ Running locally — no library setup needed.")


# Initialize logger and LLM
LLM = get_llm(logger)