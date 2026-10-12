@echo off
cd /d "%~dp0"
echo Prendiendo la API de El Hospital...
docker rm -f api-taller >nul 2>&1
docker run -it --rm --name api-taller -p 8000:8000 -v "%cd%":/app -w /app -e DB_DSN=host.docker.internal:1522/FREEPDB1 -e WATCHFILES_FORCE_POLLING=true python:3.13-slim sh -c "pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --reload"

