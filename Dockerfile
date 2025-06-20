FROM python:3.10-slim
WORKDIR /app

# ---- system packages ----
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential curl && \
    rm -rf /var/lib/apt/lists/*

# ---- project code & Python deps ----
COPY pycode /app/pycode           
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- Apache Airflow 3.x ----
ARG AIRFLOW_VERSION=3.0.2
ARG PYTHON_VERSION=3.10
RUN pip install --no-cache-dir apache-airflow=="${AIRFLOW_VERSION}" \
        --constraint \
        "https://raw.githubusercontent.com/apache/airflow/constraints-${AIRFLOW_VERSION}/constraints-${PYTHON_VERSION}.txt"

# ---- Airflow runtime configuration ----

ENV AIRFLOW_HOME=/app/airflow

# add both project roots to Python path
ENV PYTHONPATH=/app/pycode:/app/pycode/src

# point Airflow to your DAG folder
ENV AIRFLOW__CORE__DAGS_FOLDER=/app/pycode/airflow/dags

# turn off example DAGs
ENV AIRFLOW__CORE__LOAD_EXAMPLES=False
# Credentials for airflow standalone helper
ENV AIRFLOW_STANDALONE_USERNAME=admin
ENV AIRFLOW_STANDALONE_PASSWORD=admin

# ---- startup script ----
COPY start.sh /start.sh
RUN chmod +x /start.sh
EXPOSE 8080
ENTRYPOINT ["/start.sh"]
