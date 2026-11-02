# BIGCHAMP — VPS & Multi-Domain Production Deployment Guide

Is project mein Nginx reverse proxy aur multi-domain routing completely configure ho chuka hai. Kahi bhi IP ya static domain hardcoded nahi hai.

---

## 1. Domain Routing & Architecture Summary

| Domain / Host | Destination | Internal Proxy / Path | Description |
|---|---|---|---|
| **`bigchamp.in`** & **`www.bigchamp.in`** | Customer Frontend | `/var/www/frontend` | Main E-Commerce & Cinematic Sports Store |
| **`bcpanel.bigchamp.com`** | Admin Console | `/var/www/admin` | Operations & Customer Management Portal |
| **`partner.bigchamp.in`** | Partner Portal | `/var/www/partner` | Offline Gym / Partner Check-in System |
| **Direct Port `80` (Catch-all)** | Default Fallback | `/var/www/frontend` | Direct IP / Localhost fallback |
| **Direct Port `3080`** | Gateway Hub | `/var/www/portal` | Ecosystem Visual Hub |
| **Direct Port `3050`** | FastAPI Direct | Python Uvicorn | Direct backend port for testing & health checks |

> **Crucial Feature — Zero CORS / Same-Origin API:**
> Har domain ke under `/api/` route automatically internal backend (`http://127.0.0.1:3050/api/`) ko forward hota hai.
> Is wajah se frontend, admin aur partner portal bina kisi cross-origin / SSL mismatch ke smooth kaam karte hain.

---

## 2. DNS Settings (Domain Registrar / Cloudflare Par)

Apne Domain DNS Provider (GoDaddy, Namecheap, Cloudflare, Hostinger, etc.) mein jaakar ye **A Records** apne VPS IP address par point karein:

| Type | Name / Host | Points to (Value) | TTL |
|---|---|---|---|
| **A** | `@` (bigchamp.in) | `Aapka_VPS_Public_IP` | Auto / 300s |
| **A** | `www` | `Aapka_VPS_Public_IP` | Auto / 300s |
| **A** | `partner` | `Aapka_VPS_Public_IP` | Auto / 300s |

Aur `bigchamp.com` ke DNS provider par:

| Type | Name / Host | Points to (Value) | TTL |
|---|---|---|---|
| **A** | `bcpanel` | `Aapka_VPS_Public_IP` | Auto / 300s |

---

## 3. VPS Par Deploy Karne Ke Steps

### Step 1: Code Clone / Pull Karein
```bash
git clone <your-repo-url> bigchamp
cd bigchamp
```

---

### Step 2: `.env` Configuration
Root `.env` file check karein (production values ke sath):
```ini
ENV=production
PORT=3050
MONGO_URI=mongodb+srv://anuraglawaniya0001_db_user:TUyWPN8p5Bj0Cm6x@cluster0.hhqvt0i.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=bigchamp
JWT_SECRET=super_secret_jwt_key_bigchamp_dev_1234567890
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
QR_SIGNING_SECRET=super_secret_qr_signing_key_bigchamp_dev_1234567890
CORS_ORIGINS=["http://bigchamp.in","https://bigchamp.in","http://www.bigchamp.in","https://www.bigchamp.in","http://bcpanel.bigchamp.com","https://bcpanel.bigchamp.com","http://partner.bigchamp.in","https://partner.bigchamp.in","http://api.bigchamp.in","https://api.bigchamp.in","*"]
```

---

### Step 3: Single Command Start
```bash
docker compose up --build -d
```
Ye command:
1. Sabhi frontends (Customer, Admin, Partner) ko build karega.
2. Nginx multi-domain configuration load karega.
3. Ports `80`, `443`, `3000`, `3001`, `3002`, `3050`, `3080` ko publish karega.
4. FastAPI engine ko MongoDB ke sath start karega.

---

### Step 4: Status Check Karein
```bash
docker compose ps
```
Logs dekhne ke liye:
```bash
docker compose logs -f app
```

---

## 4. Free SSL / HTTPS Setup (Certbot)

Domains live hone ke baad VPS par free Let's Encrypt SSL activate karne ke do simple methods hain:

### Method A: VPS Host Par Certbot (Recommended)
Agar VPS host par Certbot install hai:
```bash
sudo certbot certonly --standalone -d bigchamp.in -d www.bigchamp.in -d bcpanel.bigchamp.com -d partner.bigchamp.in
```

### Method B: Container Ke Andar Certbot
Container ke andar direct execute karein:
```bash
docker exec -it bigchamp-app certbot --nginx -d bigchamp.in -d www.bigchamp.in -d bcpanel.bigchamp.com -d partner.bigchamp.in
```
Certbot automatically SSL certificates link karke Nginx configuration ko HTTPS par secure kar dega!

---

## 5. Useful Management Commands

* **Container Restart:**
  ```bash
  docker compose restart
  ```
* **Nginx Configuration Reload (bina container restart kiye):**
  ```bash
  docker exec bigchamp-app nginx -s reload
  ```
* **Nginx Config Test:**
  ```bash
  docker exec bigchamp-app nginx -t
  ```
* **Full Rebuild after code updates:**
  ```bash
  docker compose up --build -d
  ```
