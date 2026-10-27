# Bigchamp VPS Docker Deployment Guide

Is project ko VPS par deploy karna bilkul simple aur single command ho chuka hai. Kahi bhi IP ya port hardcoded nahi hai.

---

## 1. Port Mapping Summary

| Service | Port | Description |
|---|---|---|
| **Ecosystem Portal / Gateway Hub** | `80` | Sabhi portals ka unified visual landing page |
| **Customer Storefront** | `3000` | Main E-commerce & User Website |
| **Admin Console** | `3001` | Superadmin Dashboard & Controls |
| **Offline Partner Portal** | `3002` | Gym / Partner Check-in System |
| **FastAPI Backend & Docs** | `3050` | REST API Engine & Swagger UI (`/docs`) |

---

## 2. Deploy Karne Ke Steps (VPS Par)

### Step 1: Code VPS Par Copy / Clone Karein
Apne VPS par project folder ko git clone ya SCP/FTP ke through copy karein:
```bash
git clone <your-repository-url> bigchamp
cd bigchamp
```

---

### Step 2: `.env` File Check Ya Create Karein
Root folder me `.env.example` diya gaya hai. Aap direct `.env` create kar sakte hain:
```bash
cp .env.example .env
```
Ya direct `nano .env` karke apni values check karein:
```ini
# Environment Mode
ENVIRONMENT=production

# MongoDB Atlas Database URI (Cloud cluster already linked)
MONGODB_URI="mongodb+srv://anuraglawaniya0001_db_user:TUyWPN8p5Bj0Cm6x@cluster0.hhqvt0i.mongodb.net/bigchamp?retryWrites=true&w=majority"
MONGODB_DB_NAME="bigchamp"

# Security & Tokens
JWT_SECRET_KEY="bigchamp_production_secret_key_change_me_if_needed"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="1440"

# CORS Configuration (* allows external VPS IP and localhost)
CORS_ORIGINS=["*"]
```

> **Note:** MongoDB Atlas Network Access me `0.0.0.0/0` (ya VPS ka static IP) whitelisted hona chahiye, jo ki cloud databases ke liye standard hai.

---

### Step 3: Single Command Se Build Aur Run Karein

Kewal ye ek command chalayein:
```bash
docker compose up --build -d
```

Ye command:
1. React Frontends (Customer Storefront, Admin Panel, Partner Portal) ko production optimize karke build karega.
2. Python FastAPI Backend dependencies install karega.
3. Nginx Reverse Proxy ko automatically configure karega.
4. Container background me start ho jayega.

---

### Step 4: Status Check Karein
Container running status dekhne ke liye:
```bash
docker compose ps
```
Logs dekhne ke liye:
```bash
docker compose logs -f app
```

---

## 3. VPS IP Se Kaise Access Karein?

Agar aapke VPS ka IP `123.45.67.89` hai, to:

- **Ecosystem Hub (Landing Page):** `http://123.45.67.89/`
- **Customer Storefront:** `http://123.45.67.89:3000/`
- **Admin Console:** `http://123.45.67.89:3001/`
- **Partner Check-in:** `http://123.45.67.89:3002/`
- **Backend API & Swagger Docs:** `http://123.45.67.89:3050/docs`

> *Kewal IP address enter karte hi saare API calls internally relative path `/api/v1` ke through Nginx dwara backend tak pahuchenge, jisse CORS error aane ka koi chance nahi hai.*

---

## 4. Local Development Me Kaise Chalega?

Local machine par bhi sabhi features pehle jaise perfectly kaam karenge:

### Option A: Docker Ke Through (Local)
```bash
docker compose up -d
```
Access: `http://localhost:3000`, `http://localhost:3001`, `http://localhost:80`.

### Option B: Bina Docker (Vite + Uvicorn Dev Server)
- Backend:
  ```bash
  cd backend
  uvicorn app.main:app --host 0.0.0.0 --port 3050 --reload
  ```
- Frontends:
  ```bash
  cd frontend && npm run dev
  cd admin && npm run dev
  cd partner && npm run dev
  ```
*Vite configuration me proxy setup kiya gaya hai, isliye local dev server bina kisi port clash ya CORS error ke Backend se connect hota hai.*

---

## 5. Stop / Restart Commands

- **Stop:** `docker compose down`
- **Restart:** `docker compose restart`
- **Rebuild after code changes:** `docker compose up --build -d`
