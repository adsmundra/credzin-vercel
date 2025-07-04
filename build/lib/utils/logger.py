import logging
import os
from datetime import datetime

# ANSI escape codes for colored logging
class CustomFormatter(logging.Formatter):
    """
    Custom logging formatter to highlight different log levels with colors.
    """
    grey = "\x1b[38;20m"
    green = "\x1b[32;20m"  # Green for INFO
    yellow = "\x1b[33;20m" # Amber for WARNING
    red = "\x1b[31;20m"
    bold_red = "\x1b[31;1m"
    reset = "\x1b[0m"
    format_str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    FORMATS = {
        logging.DEBUG: grey + format_str + reset,
        logging.INFO: green + format_str + reset,
        logging.WARNING: yellow + format_str + reset,
        logging.ERROR: red + format_str + reset,
        logging.CRITICAL: bold_red + format_str + reset
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)

def configure_logging(module_name="credzin"):
    """
    Configures the logging settings for the application.

    Args:
        module_name (str): The name of the module being logged.

    Returns:
        logging.Logger: Configured logger instance.
    """
    logger = logging.getLogger(module_name)
    logger.setLevel(logging.INFO)

    # Prevent duplicate handlers
    if logger.hasHandlers():
        logger.handlers.clear()

    # Create console handler with custom formatter
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(CustomFormatter())
    logger.addHandler(console_handler)

    # Create file handler with date-based directory
    date_str = datetime.now().strftime('%Y-%m-%d')
    log_dir = os.path.join(os.getcwd(), 'Output', 'logs', date_str)
    os.makedirs(log_dir, exist_ok=True)
    
    log_file_name = f"{module_name}.log"
    file_handler = logging.FileHandler(os.path.join(log_dir, log_file_name))
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(file_handler)

    return logger

# Initialize a default logger
logger = configure_logging() 