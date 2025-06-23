#!/bin/sh
set -e

# One-liner that:
# 1) migrates DB, 2) creates admin user from env vars,
# 3) starts scheduler + webserver
exec airflow standalone