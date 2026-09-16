import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models import Product, Order, OrderItem, PaymentTransaction, OrderStatus, PaymentStatus
from app.schemas import OrderCreate

async def seed_initial_products(db: AsyncSession):
    """Seeds sample products if database is empty."""
    result = await db.execute(select(Product))
    existing_products = result.scalars().all()
    if not existing_products:
        sample_products = [
            Product(
                name="Vintage Leather Jacket",
                description="Classic brown leather jacket with vintage aesthetic.",
                category="Apparel",
                price=7999.99,
                available_stock=15,
                reserved_stock=0,
                image_url="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500"
            ),
            Product(
                name="Minimalist Ceramic Mug",
                description="Handmade aesthetic matte navy mug.",
                category="Home",
                price=500.00,
                available_stock=30,
                reserved_stock=0,
                image_url="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500"
            ),
            Product(
                name="Mechanical Keyboard",
                description="Custom RGB tactile switches with retro keycaps.",
                category="Electronics",
                price=8000.00,
                available_stock=8,
                reserved_stock=0,
                image_url="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500"
            ),
            Product(
                name="Aesthetic Canvas Tote",
                description="Durable cotton canvas bag with inner pockets.",
                category="Accessories",
                price=18.00,
                available_stock=50,
                reserved_stock=0,
                image_url="https://images.unsplash.com/photo-1544816155-12df9643f363?w=500"
            )
        ]
        db.add_all(sample_products)
        await db.commit()

async def expire_orders_job(async_session_factory):
    """Background task releasing stock for orders expired > 5 mins."""
    async with async_session_factory() as db:
        now = datetime.now(timezone.utc)
        stmt = select(Order).where(
            Order.status == OrderStatus.RESERVED,
            Order.expires_at <= now
        )
        result = await db.execute(stmt)
        expired_orders = result.scalars().all()

        bind = db.get_bind()
        is_postgres = bind.dialect.name == "postgresql"

        for order in expired_orders:
            order.status = OrderStatus.EXPIRED
            item_stmt = select(OrderItem).where(OrderItem.order_id == order.id)
            items_result = await db.execute(item_stmt)
            items = items_result.scalars().all()

            for item in items:
                prod_stmt = select(Product).where(Product.id == item.product_id)
                if is_postgres:
                    prod_stmt = prod_stmt.with_for_update()
                prod_result = await db.execute(prod_stmt)
                product = prod_result.scalar_one_or_none()
                if product:
                    product.available_stock += item.quantity
                    product.reserved_stock = max(0, product.reserved_stock - item.quantity)
        
        await db.commit()

async def checkout_order_service(order_data: OrderCreate, db: AsyncSession):
    """Concurrency-safe stock reservation checkout."""
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Cart cannot be empty")

    total_amount = 0.00
    items_to_create = []

    bind = db.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    for item in order_data.items:
        stmt = select(Product).where(Product.id == item.product_id)
        if is_postgres:
            stmt = stmt.with_for_update()

        result = await db.execute(stmt)
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")

        if product.available_stock < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for '{product.name}'. Available: {product.available_stock}, Requested: {item.quantity}"
            )

        product.available_stock -= item.quantity
        product.reserved_stock += item.quantity

        item_total = product.price * item.quantity
        total_amount += item_total

        items_to_create.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "unit_price": product.price
        })

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    order = Order(
        customer_id=order_data.customer_id,
        status=OrderStatus.RESERVED,
        total_amount=round(total_amount, 2),
        expires_at=expires_at
    )
    db.add(order)
    await db.flush()

    for item_dict in items_to_create:
        order_item = OrderItem(order_id=order.id, **item_dict)
        db.add(order_item)

    await db.commit()
     # Eager load items for clean serialization
    res = await db.execute(
        select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    )
    return res.scalar_one()