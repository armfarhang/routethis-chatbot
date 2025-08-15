# Backend API

Flask backend application for the RT take home project.

## Prerequisites

- Python 3.7+
- pip (Python package installer)

## Setup and Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   
   On Windows:
   ```bash
   venv\Scripts\activate
   ```
   
   On macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables (if needed):**
   Create a `.env` file in the backend directory with any required environment variables.

## Running the Application

1. **Make sure your virtual environment is activated**

2. **Run the application:**
   ```bash
   python run.py
   ```

The application will start on `http://localhost:5000` by default in debug mode.

## API Endpoints

The application provides API endpoints accessible at `http://localhost:5000`. CORS is configured to allow requests from:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

## Project Structure

```
backend/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── routes.py            # API route definitions
│   ├── logic.py             # Business logic
│   └── templates/
│       └── index.html       # Template files
├── requirements.txt         # Python dependencies
├── run.py                  # Application entry point
└── venv/                   # Virtual environment (created after setup)
```

## Development

The application runs in debug mode by default, which means:
- Automatic reloading when code changes
- Detailed error messages
- Debug toolbar (if configured)

## Troubleshooting

- Make sure your virtual environment is activated before running the application
- Ensure all dependencies are installed with `pip install -r requirements.txt`
- Check that no other application is using port 5000