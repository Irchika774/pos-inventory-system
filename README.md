# 🛒 POS Order & Inventory System

### Techloom.ai — Software Engineer Intern Practical Assessment

A full-stack **Point-of-Sale (POS) and Inventory Management System** designed to handle concurrent orders safely while providing a fast, efficient cashier experience.

The system focuses on three main areas:

* 🔒 **Concurrency-safe inventory management**
* ⏱️ **Automatic 5-minute stock reservations**
* ⚡ **High-efficiency cashier workflows**

All prices are displayed in **Sri Lankan Rupees (LKR)**.

---

## 🌐 Live Demo

**Frontend:**
https://pos-inventory-system-ochre.vercel.app/

**Backend API:**
https://backend-self-five-15.vercel.app/

**GitHub:**
https://github.com/Irchika774/pos-inventory-system

---

# ✨ Key Features

## 🔒 Concurrency-Safe Stock Reservation

The system prevents **overselling when multiple customers attempt to purchase the same product simultaneously**.

When an order is checked out:

```text
Available Stock
      ↓
   Reserve
      ↓
Reserved Stock
```

The backend uses **database-level row locking with PostgreSQL** to safely handle concurrent checkout requests.

Example:

```text
Stock = 2

Customer A → reserves 2 → SUCCESS
Customer B → requests 1 → INSUFFICIENT STOCK
```

This ensures that inventory cannot be accidentally oversold.

---

## ⏱️ 5-Minute Reservation System

When a customer checks out, the requested stock is temporarily reserved for **5 minutes**.

```text
Checkout
   ↓
Stock Reserved
   ↓
5-Minute Timer
   ↓
Payment
 ┌───────┴────────┐
 ↓                ↓
Success         Timeout
 ↓                ↓
Paid            Release Stock
```

If payment is not completed within the reservation period, the system automatically releases the reserved stock back into inventory.

A background scheduler runs reservation cleanup jobs at regular intervals.

---

## 💳 Mock Payment Simulation

The application supports three simulated payment outcomes:

| Outcome    | Result                                    |
| ---------- | ----------------------------------------- |
| ✅ SUCCESS  | Order becomes PAID                        |
| ❌ FAILED   | Order is cancelled and stock is released  |
| ⏱️ TIMEOUT | Reservation expires and stock is restored |

This makes it possible to demonstrate different payment and inventory state transitions without connecting to a real payment gateway.

---

## 🛡️ Duplicate Payment Protection

The payment workflow uses **idempotency keys** to prevent duplicate payment processing.

For example:

```text
Payment Request
      ↓
Idempotency Key
      ↓
Check Existing Transaction
      ↓
Already Processed?
   ↙           ↘
 YES            NO
 ↓              ↓
Reject       Process Payment
```

This helps prevent accidental double submissions and duplicate state changes.

---

# ⚡ Cashier-Focused UX

The frontend is designed around **speed and minimal interaction** for high-volume cashier environments.

### 🔎 Fast Search

Press:

```text
/
```

or:

```text
Ctrl + K
```

to quickly focus the product search.

### ⚡ Quick Keys

Frequently used products can be added using quick-access buttons.

### 🏷️ Category Filters

Products can be filtered instantly using category pills.

### ➕ Quantity Multipliers

Cashiers can quickly increase quantities using controls such as:

```text
+5
```

instead of repeatedly clicking the increment button.

---

# 🏗️ Technology Stack

| Layer            | Technology   |
| ---------------- | ------------ |
| Frontend         | React.js     |
| Build Tool       | Vite         |
| Styling          | Tailwind CSS |
| Backend          | FastAPI      |
| Language         | Python 3.12  |
| ORM              | SQLAlchemy   |
| Database         | PostgreSQL   |
| Database Hosting | Supabase     |
| Async Driver     | asyncpg      |
| Background Jobs  | APScheduler  |
| Deployment       | Vercel       |

### 🎨 UI Theme

The interface uses a simple POS-oriented color system:

```text
Oxford Navy  → #14213D
Amber Gold   → #FCA311
Light Gray   → #E5E5E5
```

---

# 🧩 System Architecture

```text
                    ┌─────────────────────┐
                    │     Cashier UI      │
                    │   React + Vite      │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ↓
                    ┌─────────────────────┐
                    │      FastAPI        │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ↓                           ↓
        ┌─────────────────┐       ┌─────────────────┐
        │ Inventory /     │       │ Payment &       │
        │ Order Services  │       │ Order Services  │
        └────────┬────────┘       └────────┬────────┘
                 │                         │
                 └────────────┬────────────┘
                              ↓
                    ┌─────────────────────┐
                    │ PostgreSQL /        │
                    │ Supabase            │
                    └─────────────────────┘
```

---

# 📁 Project Structure

```text
pos-inventory-system/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── services.py
│   │   │
│   │   └── routers/
│   │       ├── products.py
│   │       ├── orders.py
│   │       └── payments.py
│   │
│   ├── requirements.txt
│   └── vercel.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── QuickKeys/
│   │   │   ├── SearchBar/
│   │   │   ├── CategoryFilter/
│   │   │   ├── CartSidebar/
│   │   │   └── ...
│   │   │
│   │   ├── App.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

# 🔐 Environment Variables

## Backend

Create:

```text
backend/.env
```

Add your Supabase PostgreSQL connection string:

```env
DATABASE_URL=postgresql+asyncpg://YOUR_DATABASE_CONNECTION_STRING
```

> **Never commit `.env` files or database credentials to GitHub.**

For Vercel, add `DATABASE_URL` through the project's **Environment Variables** settings.

---

## Frontend

Create:

```text
frontend/.env
```

```env
VITE_API_URL=https://backend-self-five-15.vercel.app
```

For local development:

```env
VITE_API_URL=http://localhost:8000
```

---

# 🚀 Run Locally

## 1. Clone the Repository

```bash
git clone https://github.com/Irchika774/pos-inventory-system.git
cd pos-inventory-system
```

---

## 2. Start the Backend

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

## 3. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 🧪 Testing the Core Features

## Test 1 — Concurrent Checkout

1. Open the application in two browser tabs.
2. Find a product with limited stock.
3. Attempt to reserve the same product from both tabs.
4. Complete checkout from the first tab.
5. Attempt checkout from the second tab.

The backend should prevent the second request from reserving more stock than is available.

---

## Test 2 — Reservation Expiration

1. Add a product to the cart.
2. Click **Checkout & Reserve Stock**.
3. Observe the 5-minute countdown.
4. Do not complete payment.
5. Allow the reservation to expire.

Expected result:

```text
Reserved Stock ↓
Available Stock ↑
Order → EXPIRED
```

---

## Test 3 — Payment Outcomes

Create a reservation and test:

### SUCCESS

```text
RESERVED → PAID
```

Reserved inventory remains deducted.

### FAILED

```text
RESERVED → FAILED
```

Reserved inventory is returned.

### TIMEOUT

```text
RESERVED → EXPIRED
```

Reserved inventory is restored.

---

## Test 4 — Duplicate Payment

Attempt to submit the same payment transaction more than once using the same idempotency key.

The backend should prevent duplicate processing.

---

# 🧠 Engineering Highlights

This project demonstrates practical backend and frontend engineering concepts including:

* **Asynchronous FastAPI APIs**
* **SQLAlchemy async database operations**
* **PostgreSQL row-level locking**
* **Concurrency-safe inventory reservation**
* **Transaction-based stock updates**
* **Idempotent payment processing**
* **Background reservation cleanup**
* **REST API architecture**
* **React state management**
* **Keyboard-first cashier workflows**
* **Responsive POS interface**
* **Vercel deployment**
* **Supabase PostgreSQL integration**

---

# 🔄 Order State Flow

```text
                 ┌──────────────┐
                 │    PENDING   │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │   RESERVED  │
                 └──────┬───────┘
                        │
              ┌─────────┼─────────┐
              ↓         ↓         ↓
          SUCCESS     FAILED    TIMEOUT
              ↓         ↓         ↓
          ┌──────┐  ┌────────┐ ┌─────────┐
          │ PAID │  │ FAILED │ │ EXPIRED │
          └──────┘  └────────┘ └─────────┘
```

---

# 📊 Inventory Logic

The system maintains two important stock values:

```text
Available Stock
      +
Reserved Stock
      =
Total Inventory
```

During checkout:

```text
Available Stock -= Quantity
Reserved Stock  += Quantity
```

After successful payment:

```text
Reserved Stock -= Quantity
```

After cancellation or expiration:

```text
Reserved Stock  -= Quantity
Available Stock += Quantity
```

This keeps inventory state consistent throughout the order lifecycle.

---

# ☁️ Deployment

The application is deployed using **Vercel**.

```text
Frontend
React + Vite
      ↓
Vercel Static Hosting
      ↓
FastAPI REST API
      ↓
Vercel Backend
      ↓
Supabase PostgreSQL
```

---

# 🎯 Assessment Focus

This implementation was developed for the:

**Techloom.ai Software Engineer Intern Practical Assessment**

The primary focus is demonstrating practical understanding of:

> **Concurrency, transactional inventory management, asynchronous APIs, reliable payment state handling, and efficient user interfaces.**

---

## 👩‍💻 Author

**P. M. G. W. Irchika**

Software Engineer — Full-Stack Developer

GitHub:
https://github.com/Irchika774

---

## 📄 License

This project was developed as part of a technical assessment and demonstration of full-stack software engineering skills.
