# Bigchamp Backend API

Single FastAPI backend serving all 3 frontends (Customer, Admin, and Partner).

## Tech Stack
- Python 3.11+
- FastAPI 0.115.0
- Motor 3.6.0 (Async MongoDB driver)
- Pydantic v2 & Pydantic-Settings
- Uvicorn

## Setup Instructions

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env` (already created with dev defaults):
   ```bash
   cp .env.example .env
   ```

4. **Database Seeding**:
   Populate all collections, create indexes, and insert default admin, settings, CMS pages, banners, FAQs, products, and partners:
   ```bash
   python -m app.seed.runner
   ```

5. **Run Server**:
   ```bash
   uvicorn app.main:app --reload --port 3050
   ```

6. **API Documentation**:
   - Swagger UI: [http://localhost:3050/docs](http://localhost:3050/docs)
   - ReDoc: [http://localhost:3050/redoc](http://localhost:3050/redoc)
   - Health check: [http://localhost:3050/api/v1/health](http://localhost:3050/api/v1/health)
   - DB health check: [http://localhost:3050/api/v1/health/db](http://localhost:3050/api/v1/health/db)

