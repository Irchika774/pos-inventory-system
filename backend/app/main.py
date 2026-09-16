import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import init_db, AsyncSessionLocal
from app.routers import products, orders, payments
from app.services import expire_orders_job, seed_initial_products

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pos_backend")

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize DB tables safely
    try:
        await init_db()
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")

    # 2. Seed initial sample products safely
    try:
        async with AsyncSessionLocal() as db:
            await seed_initial_products(db)
        logger.info("Product seeding checked/completed.")
    except Exception as e:
        logger.warning(f"Product seeding warning: {e}")

    # 3. Start background job scheduler safely (works for local and Vercel serverless)
    try:
        if not scheduler.running:
            scheduler.add_job(
                expire_orders_job, 
                'interval', 
                seconds=10, 
                args=[AsyncSessionLocal],
                id="expire_orders_job",
                replace_existing=True
            )
            scheduler.start()
            logger.info("APScheduler started successfully.")
    except Exception as e:
        logger.warning(f"Scheduler start warning: {e}")

    yield

    # 4. Graceful shutdown
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler shut down.")

app = FastAPI(
    title="POS Order & Inventory System API",
    description="Concurrency-safe POS system with stock reservations and payment gateway simulation",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vercel cross-origin frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "POS System Backend API is running smoothly!"
    }
