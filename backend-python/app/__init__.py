"""Flask application factory module.

This module provides the create_app factory function for creating
Flask application instances with proper configuration and route registration.
"""
import os

from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)

    # Enable CORS for all domains on all routes
    port = int(os.getenv('REACT_PORT', 5173))
    CORS(app, origins=[f"http://localhost:{port}", f"http://127.0.0.1:{port}"])

    # Config (optional - can be removed if config.py doesn't exist)
    try:
        app.config.from_object("config.Config")
    except ImportError:
        # Use default Flask config if config.py doesn't exist
        app.config['DEBUG'] = True

    # Register routes
    from .routes import bp as routes_bp
    app.register_blueprint(routes_bp)

    return app
