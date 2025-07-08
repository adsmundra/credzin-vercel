
# Gemini Workspace Context

This document provides context for the Gemini AI assistant to understand the project structure, conventions, and commands.

## Project Overview

This project, "credzin," appears to be a complex system with several components:

- A Python-based backend with data processing and machine learning capabilities (indicated by `pyproject.toml`, `airflow`, `Notebooks`, and various data-related directories).
- A Java/Kotlin-based set of core services (in `CoreServices`).
- A web application with a Node.js backend and a React frontend (in `webapp`).

### User Transaction Analysis

The `pycode/src/Transactions/Txns.py` script is responsible for analyzing user email data to extract and visualize financial transaction information. It performs the following:

- Fetches email data from a MongoDB collection (`gmailmessages`).
- Filters relevant emails based on keywords related to transactions, banking, and shopping.
- Extracts transaction amounts, types (Debit/Credit), and merchant names from email bodies.
- Generates and saves various charts (pie charts for categories and transaction types, bar charts for top merchants, and time-series plots for weekly/monthly spend) for each user.
- Logs analysis summaries to a CSV file (`Output/logs/<date>/spend_analysis_log.csv`).
- Generates a comprehensive HTML dashboard (`Output/dash/<date>/spend_dashboard.html`) displaying all charts for all users.
- Transforms extracted transaction data into a structured format (`UserTransaction` schema) and inserts it into a MongoDB collection (`usertransactions`).

**UserTransaction Schema:**
```typescript
type UserTransaction {
    id: ID! # Unique transaction ID
    cardId: ID!, # Associated card ID (placeholder for now)
    dateTime: DateTime!,
    amount: Amount!,
    merchantId: ID, # Nullable, generated if merchant is known
    userId: ID!,
    metadata: UserTransactionMetadata # JSON object containing original email details
}
```

## Key Technologies

- **Python:** Poetry for dependency management, FastAPI for APIs, and a wide range of libraries for data science, machine learning, and web scraping.
- **Java/Kotlin:** Gradle for build automation.
- **JavaScript/TypeScript:** Node.js and Express for the backend, React for the frontend.
- **Databases:** Neo4j, Qdrant, ChromaDB, MongoDB (inferred from dependencies).
- **Infrastructure:** Docker, Airflow.

## Commands

### Python (`pycode`)

- **Install dependencies:** `poetry install`
- **Run tests:** `poetry run pytest`
- **Run the main application:** (Requires more information on the main entry point)
- **Run Airflow:** `sh start.sh`

### Web App Backend (`webapp/backend`)

- **Install dependencies:** `npm install`
- **Start (development):** `npm run dev`
- **Start (production):** `npm start`
- **Lint:** `npm run lint`

### Web App Frontend (`webapp/frontend`)

- **Install dependencies:** `npm install`
- **Start (development):** `npm start`
- **Build for production:** `npm run build`
- **Run tests:** `npm run test`

## Project Structure

- `CoreServices/`: Contains Java/Kotlin microservices.
- `KnowledgeBase/`: Stores data used by the system, including information about banks and credit cards.
- `Notebooks/`: Jupyter notebooks for R&D and data analysis.
- `Output/`: Likely used for generated files, logs, and reports.
- `pycode/`: The main Python application code.
- `resources/`: Supporting resources, including databases and configuration files.
- `webapp/`: The web application, split into `backend` and `frontend`.