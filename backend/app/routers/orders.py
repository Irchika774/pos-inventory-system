from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from app.database import get_db
from app.models import Order
from app.schemas import OrderCreate, OrderResponse
from app.services import checkout_order_service

router = APIRouter()

@router.post("/checkout", response_model=OrderResponse)
async def checkout_order(order_data: OrderCreate, db: AsyncSession = Depends(get_db)):
    return await checkout_order_service(order_data, db)

@router.get("/", response_model=List[OrderResponse])
async def get_orders(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).options(selectinload(Order.items)))
    return result.scalars().all()