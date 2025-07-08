# Credzin: Financial Intelligence Platform

## Table of Contents

*   [About The Project](#about-the-project)
    *   [Key Features](#key-features)
*   [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Installation](#installation)
*   [Usage](#usage)
    *   [Python Backend (`pycode`)](#python-backend-pycode)
    *   [Web Application Backend (`webapp/backend`)](#web-application-backend-webappbackend)
    *   [Web Application Frontend (`webapp/frontend`)](#web-application-frontend-webappfrontend)
*   [Project Structure](#project-structure)
*   [Technologies Used](#technologies-used)
*   [License](#license)
*   [Contact](#contact)

---

## About The Project

`Credzin` is a comprehensive financial intelligence platform designed to process, analyze, and visualize financial data. It comprises a robust Python backend for data processing and machine learning, Java/Kotlin-based core services, and a modern web application with a Node.js backend and React frontend.

### Key Features

*   **Email-based Transaction Analysis:** Automatically fetches and analyzes user emails from MongoDB to extract financial transaction details (amount, merchant, type).
*   **Automated Data Extraction:** Utilizes advanced regex patterns and natural language processing techniques for accurate extraction of transaction data.
*   **Interactive Spend Dashboards:** Generates dynamic HTML dashboards with various charts (pie charts for categories, transaction types, bar charts for top merchants, and time-series plots for spend trends) for each user.
*   **Structured Transaction Data:** Transforms raw email data into a clean, structured `UserTransaction` schema and inserts it into MongoDB for further use.
*   **Scalable Architecture:** Built with modular components (Python, Java/Kotlin, Node.js/React) to ensure scalability and maintainability.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   **Python 3.12** (or compatible version)
*   **Node.js & npm** (for web application)
*   **Java Development Kit (JDK)** (for CoreServices)
*   **MongoDB Instance:** A running MongoDB instance accessible from your environment.
*   **Poetry** (recommended for Python dependency management)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/welzin-com/credzin.git
    cd credzin
    ```

2.  **Python Backend Setup:**
    ```bash
    # Install Poetry (if not already installed)
    curl -sSL https://install.python-poetry.org | python3 -

    # Install Python dependencies
    poetry install
    ```

3.  **Web Application Backend Setup:**
    ```bash
    cd webapp/backend
    npm install
    cd ../..
    ```

4.  **Web Application Frontend Setup:**
    ```bash
    cd webapp/frontend
    npm install
    cd ../..
    ```

5.  **Core Services Setup:**
    Refer to the `CoreServices/README.md` for detailed setup instructions.

## Usage

### Python Backend (`pycode`)

The main entry point for the transaction analysis is `pycode/src/Transactions/Txns.py`.

To run the spend analysis script:

```bash
python3.12 pycode/src/Transactions/Txns.py
```

This script will:
*   Connect to your MongoDB instance (ensure `DataLoaders/MongoDB.py` is configured correctly).
*   Fetch emails from the `gmailmessages` collection.
*   Process and analyze transaction data.
*   Generate charts and a comprehensive HTML dashboard in `Output/dash/<current_date>/spend_dashboard.html`.
*   Insert structured transaction data into the `user_transactions` collection in MongoDB.

### Web Application Backend (`webapp/backend`)

To start the backend server:

```bash
cd webapp/backend
npm run dev # For development
npm start   # For production
```

### Web Application Frontend (`webapp/frontend`)

To start the frontend development server:

```bash
cd webapp/frontend
npm start
```

To build the frontend for production:

```bash
cd webapp/frontend
npm run build
```

## Project Structure

```
.
├── CoreServices/             # Java/Kotlin microservices
├── KnowledgeBase/            # Data storage (banks, credit cards, sites)
├── Notebooks/                # Jupyter notebooks for R&D and data analysis
├── Output/                   # Generated files, logs, reports, and dashboards
│   ├── dash/                 # HTML dashboards
│   ├── logs/                 # Analysis logs (e.g., spend_analysis_log.csv)
│   └── spends/               # Generated chart images
├── pycode/                   # Main Python application code
│   ├── main.py
│   ├── airflow/              # Airflow DAGs
│   ├── DBinfo/               # Database information/configuration
│   ├── logs/
│   ├── src/                  # Python source code
│   │   ├── agents/
│   │   ├── dashboard/
│   │   ├── DataLoaders/      # MongoDB connection, etc.
│   │   ├── processing/
│   │   ├── recommender/
│   │   ├── scrapers/
│   │   ├── Transactions/     # Email transaction analysis (Txns.py)
│   │   └── utils/            # Utility functions (e.g., logger)
│   └── test/                 # Python tests
├── resources/                # Supporting resources (databases, config)
├── scripts/                  # Shell scripts (e.g., vercel_sync.sh)
└── webapp/                   # Web application
    ├── backend/              # Node.js/Express backend
    └── frontend/             # React frontend
```

## Technologies Used

*   **Python:** Pandas, NumPy, Matplotlib, FastAPI, LangChain, PyMongo, SpaCy, Sentence-Transformers, Hugging Face Transformers.
*   **Java/Kotlin:** (Details in `CoreServices/README.md`)
*   **JavaScript/TypeScript:** React, Node.js, Express.js.
*   **Databases:** MongoDB, Neo4j, Qdrant, ChromaDB.
*   **Orchestration:** Apache Airflow.
*   **Containerization:** Docker.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Aman Mundra - [aman@thewelzin.com](mailto:aman@thewelzin.com)
Credzin Team - [team@credzin.com](mailto:team@credzin.com)