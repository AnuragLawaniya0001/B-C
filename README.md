# Bigchamp — Sports, Student & Defense Ecosystem

Bigchamp is a multi-application platform ecosystem combining a ₹100 digital membership card (with 11 months validity and joining wallet cashback), offline partner services (student/athlete dormitories and sports physiotherapy clinics), an e-commerce store for sports gear and athletic apparel, an exclusive weekly reward product called **Cookey**, and dedicated 10% privilege benefits for Indian Army and Defense personnel.

---

## 🛠 Tech Stack

- **Backend**: Python 3.11+, FastAPI 0.115.0, Motor 3.6.0 (async MongoDB driver), Pydantic v2 & Pydantic-Settings, Uvicorn, Jose JWT, Passlib
- **Database**: MongoDB (Atlas or Local via `MONGO_URI`)
- **Customer Frontend (`frontend/`)**: React 18, Vite, React Router v6, TailwindCSS, Zustand, Axios, React Hook Form, Zod, Lucide Icons
- **Admin Console (`admin/`)**: React 18, Vite (Port 5174), React Router v6, TailwindCSS, Zustand, Axios, Lucide Icons
- **Partner Portal (`partner/`)**: React 18, Vite (Port 5175), React Router v6, TailwindCSS, Zustand, Axios, Lucide Icons
- **Language**: JavaScript (`.jsx`) for frontends, Python for backend

---

## 📁 Folder Structure Overview

```text
bigchamp/
├── backend/                  # FastAPI async backend service
│   ├── app/
│   │   ├── api/              # API routes (v1 health, etc.)
│   │   ├── core/             # Config, Mongo DB client, security stubs, constants
│   │   ├── models/           # Database entity models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic services
│   │   └── utils/            # Helper utilities
│   ├── requirements.txt      # Pinned Python dependencies
│   ├── .env.example          # Backend environment template
│   └── README.md
├── frontend/                 # Customer-facing website & dashboard (Port 5173)
│   ├── src/
│   │   ├── components/       # UI library (Button, Input, Card, Badge, Loader, EmptyState), Layouts
│   │   ├── pages/            # Public, Auth, Dashboard, and Checkout functional stubs
│   │   ├── routes/           # ProtectedRoute, PublicRoutes, AuthRoutes, DashboardRoutes
│   │   ├── services/         # Axios interceptor instance with JWT auto-refresh
│   │   ├── store/            # authStore, cartStore (Zustand)
│   │   └── utils/            # Constants, formatters, hooks
│   └── vite.config.js
├── admin/                    # Operations & administrator portal (Port 5174)
│   ├── src/
│   │   ├── components/       # AdminLayout with collapsible sidebar, UI components
│   │   ├── pages/            # Users, KYC Queue, Products, Orders, Cookey, Lucky Draw, Partners, Finance
│   │   ├── services/         # Admin Axios instance
│   │   └── store/            # adminAuthStore (Zustand)
│   └── vite.config.js
├── partner/                  # Offline clinic & dormitory check-in portal (Port 5175)
│   ├── src/
│   │   ├── components/       # PartnerLayout, UI components
│   │   ├── pages/            # PartnerDashboard, QR Scan stub, Check-in History
│   │   ├── services/         # Partner Axios instance
│   │   └── store/            # partnerAuthStore (Zustand)
│   └── vite.config.js
├── .gitignore                # Global gitignore (node_modules, venv, .env, dist, etc.)
└── README.md                 # This documentation
```

---

## 🧠 Critical Principle: Everything Dynamic from Admin

Every piece of user-facing content, business rule, and banner is **Admin-Controllable**. Nothing is hardcoded in the frontend.

### 🗄️ Dynamic MongoDB Collections Schema

#### 1. `settings` — Global Site & Business Configuration
Key-value configuration store for site-wide business rules and flags.
```json
{
  "_id": "ObjectId",
  "key": "business_rules",
  "value": {
    "card_fee_paise": 10000,
    "card_validity_days": 334,
    "joining_cashback_percent": 10,
    "cookey_price_paise": 10000,
    "cookey_cooldown_days": 7,
    "cookey_max_per_week": 1,
    "army_extra_discount_percent": 10,
    "lucky_draw_prize_paise": 50000,
    "lucky_draw_frequency": "weekly"
  },
  "updated_by": "ObjectId",
  "updated_at": "ISODate"
}
```
Other settings keys:
- `site_contact`: `{ "email": "support@bigchamp.in", "phone": "+91...", "address": "..." }`
- `social_links`: `{ "instagram": "...", "youtube": "...", "twitter": "..." }`
- `feature_flags`: `{ "cookey_enabled": true, "army_offer_enabled": true, "maintenance_mode": false }`
- `default_language`: `{ "code": "en", "available": ["en", "hi"] }`

#### 2. `pages` — CMS Content by Slug
Dynamic page structure with ordered, toggleable sections.
```json
{
  "_id": "ObjectId",
  "slug": "homepage",
  "title": "Home",
  "meta": { "title": "Bigchamp Sports Ecosystem", "description": "...", "og_image": "..." },
  "sections": [
    {
      "id": "hero",
      "type": "hero",
      "order": 1,
      "enabled": true,
      "content": {
        "title": "India ka Pehla Sports Ecosystem",
        "subtitle": "Sports + Students + Defense",
        "image_url": "...",
        "cta_text": "Join Now",
        "cta_link": "/register"
      }
    },
    {
      "id": "benefits",
      "type": "benefits",
      "order": 2,
      "enabled": true,
      "content": {
        "items": [
          { "icon": "shield", "title": "Defense Privilege", "desc": "10% privilege benefit" },
          { "icon": "home", "title": "Dormitory Stay", "desc": "Athletic and student hostels" },
          { "icon": "activity", "title": "Physio Clinics", "desc": "Sports recovery partners" },
          { "icon": "sparkles", "title": "Cookey Rewards", "desc": "₹100 reward product" }
        ]
      }
    }
  ],
  "updated_at": "ISODate"
}
```
Standard page slugs: `homepage`, `about`, `contact`, `faq`, `membership`, `army-offer`, `privacy-policy`, `terms`, `refund-policy`.

#### 3. `banners` — Promotional Banners
Banners scheduled and rendered based on page slot.
```json
{
  "_id": "ObjectId",
  "title": "Grand Launch Sale",
  "image_url": "https://...",
  "link": "/store",
  "position": "homepage_top",
  "start_date": "ISODate",
  "end_date": "ISODate",
  "active": true,
  "order": 1,
  "created_at": "ISODate"
}
```
Supported positions: `homepage_top`, `homepage_middle`, `cookey_page`, `army_page`.

#### 4. `faqs` — Categorized Questions & Answers
```json
{
  "_id": "ObjectId",
  "question": "What is the Bigchamp Membership Card?",
  "answer": "A digital card offering dormitory discounts, physio privileges, and wallet cashbacks.",
  "category": "membership",
  "order": 1,
  "active": true
}
```

#### 5. `products` — Updated with Featured Flag
- `featured: bool` — controls homepage featured showcase from admin panel.

---

## 🌐 Application Ports

| Application | Technology | Default Port | Local URL |
| :--- | :--- | :--- | :--- |
| **Ecosystem Portal** | Unified Hub & Proxy | `80` | [http://localhost](http://localhost) |
| **Backend API** | FastAPI / Uvicorn | `3050` | [http://localhost:3050](http://localhost:3050) (Swagger: `/docs`) |
| **Customer Frontend** | Vite + React | `3000` | [http://localhost:3000](http://localhost:3000) |
| **Admin Panel** | Vite + React | `3001` | [http://localhost:3001](http://localhost:3001) |
| **Partner Portal** | Vite + React | `3002` | [http://localhost:3002](http://localhost:3002) |

---

## 🐳 Docker Setup (All-in-One Container)

Backend aur teeno frontends ek hi optimized container (`bigchamp-app`) me Nginx + Supervisord ke saath host hote hain:

```bash
# Build and run MongoDB + Unified App
docker compose up --build -d

# Check running status
docker compose ps

# View unified logs
docker compose logs -f app
```


---

## 🚀 Environment Setup & Running Locally

### 1. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env (already configured with dev defaults in .env.example)
cp .env.example .env

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```
- Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### 2. Customer Frontend (`frontend/`)

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### 3. Admin Panel (`admin/`)

```bash
cd admin
npm install
npm run dev
```
Open [http://localhost:5174](http://localhost:5174).

### 4. Partner Portal (`partner/`)

```bash
cd partner
npm install
npm run dev
```
Open [http://localhost:5175](http://localhost:5175).

---

## 🔒 Scope & Next Steps
This repository represents **Step 1 Foundation**. No database writes, auth validation logic, KYC submission, payments, or third-party integrations are executed yet. All interactive pages are functional stubs ready for business logic in upcoming prompts.
