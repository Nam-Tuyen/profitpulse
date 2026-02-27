"""
WSGI Entry Point for Vercel
Optimized for serverless deployment
"""
from api_server import app

# Vercel expects 'app' or 'application'
application = app

if __name__ == "__main__":
    app.run()
