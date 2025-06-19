import logging
from langchain_ollama import ChatOllama
from langchain_core.messages import AIMessage
import os
from fpdf import FPDF
from datetime import datetime
import subprocess

# ANSI escape codes for colored logging
class CustomFormatter(logging.Formatter):
    """
    Custom logging formatter to highlight different log levels with colors.
    """
    grey = "\x1b[38;20m"
    blue = "\x1b[34;20m"
    yellow = "\x1b[33;20m"
    red = "\x1b[31;20m"
    bold_red = "\x1b[31;1m"
    reset = "\x1b[0m"
    format_str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    FORMATS = {
        logging.DEBUG: grey + format_str + reset,
        logging.INFO: blue + format_str + reset,
        logging.WARNING: yellow + format_str + reset,
        logging.ERROR: red + format_str + reset,
        logging.CRITICAL: bold_red + format_str + reset
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)

def format_step(step_number, message):
    """
    Formats a step message with a step number and highlights it in green.

    Args:
        step_number (int): The step number.
        message (str): The message to format.

    Returns:
        str: The formatted step message.
    """
    GREEN = "\033[92m"  # ANSI escape code for green
    RESET = "\033[0m"   # Reset color
    return f"{GREEN}\n\n[Step {step_number}]{RESET} {message}"


def configure_logging():
    """
    Configures the logging settings for the application.

    Returns:
        logging.Logger: Configured logger instance.
    """
    # Create logger
    logger = logging.getLogger("credzin")
    logger.setLevel(logging.INFO)

    # Remove any existing handlers
    logger.handlers = []

    # Create console handler with custom formatter
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(CustomFormatter())
    logger.addHandler(console_handler)

    # Create file handler
    log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    file_handler = logging.FileHandler(os.path.join(log_dir, 'credzin.log'))
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(file_handler)

    return logger

def get_llm(logger):
    """
    Returns the LLM instance configured for the application.

    Args:
        logger (logging.Logger): Logger instance for logging.

    Returns:
        ChatOllama: The LLM instance.
    """
    logger.info("Initializing LLM instance - Llama3.2 model.")
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
logger = configure_logging()
LLM = get_llm(logger)

