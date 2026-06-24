# Vercel Serverless Entrypoint for Flask API
import os
import sys

# Add the backend directory to the system path so 'import app' resolves correctly
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_path)

from app import create_app
app = create_app()

# Log parsed configurations to Vercel console for debugging
print(f"GNOVIUM_MODE: {app.config.get('GNOVIUM_MODE')}", flush=True)
print(f"CORS_ORIGINS: {app.config.get('CORS_ORIGINS')}", flush=True)
print(f"ALLOWED_HOSTS: {app.config.get('ALLOWED_HOSTS')}", flush=True)
