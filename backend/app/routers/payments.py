from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import Order, OrderItem, Product, PaymentTransaction, OrderStatus, PaymentStatus
from app.schemas import PaymentRequest, PaymentResponse

router = APIRouter()

@router.post("/process", response_model=PaymentResponse)
async def process_payment(payment_data: PaymentRequest, db: AsyncSession = Depends(get_db)):
    existing_stmt = select(PaymentTransaction).where(PaymentTransaction.idempotency_key == payment_data.idempotency_key)
    existing_result = await db.execute(existing_stmt)
    existing_tx = existing_result.scalar_one_or_none()
    if existing_tx:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate payment request: Idempotency key already processed"
        )

    order_stmt = select(Order).where(Order.id == payment_data.order_id)
    order_result = await db.execute(order_stmt)
    order = order_result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != OrderStatus.RESERVED:
        raise HTTPException(status_code=400, detail=f"Order status is {order.status}, cannot process payment")

    outcome = payment_data.simulated_outcome

    if outcome == PaymentStatus.SUCCESS:
        order.status = OrderStatus.PAID
        items_stmt = select(OrderItem).where(OrderItem.order_id == order.id)
        items_result = await db.execute(items_stmt)
        items = items_result.scalars().all()
        for item in items:
            prod_stmt = select(Product).where(Product.id == item.product_id).with_for_update()
            prod_result = await db.execute(prod_stmt)
            product = prod_result.scalar_one_or_none()
            if product:
                product.reserved_stock = max(0, product.reserved_stock - item.quantity)
        resp_msg = "Payment processed successfully"

    elif outcome == PaymentStatus.FAILED:
        order.status = OrderStatus.FAILED
        items_stmt = select(OrderItem).where(OrderItem.order_id == order.id)
        items_result = await db.execute(items_stmt)
        items = items_result.scalars().all()
        for item in items:
            prod_stmt = select(Product).where(Product.id == item.product_id).with_for_update()
            prod_result = await db.execute(prod_stmt)
            product = prod_result.scalar_one_or_none()
            if product:
                product.available_stock += item.quantity
                product.reserved_stock = max(0, product.reserved_stock - item.quantity)
        resp_msg = "Payment failed, reserved stock restored"

    else:  # TIMEOUT
        order.status = OrderStatus.EXPIRED
        items_stmt = select(OrderItem).where(OrderItem.order_id == order.id)
        items_result = await db.execute(items_stmt)
        items = items_result.scalars().all()
        for item in items:
            prod_stmt = select(Product).where(Product.id == item.product_id).with_for_update()
            prod_result = await db.execute(prod_stmt)
            product = prod_result.scalar_one_or_none()
            if product:
                product.available_stock += item.quantity
                product.reserved_stock = max(0, product.reserved_stock - item.quantity)
        resp_msg = "Payment timed out, reserved stock restored"

    tx = PaymentTransaction(
        order_id=order.id,
        idempotency_key=payment_data.idempotency_key,
        status=outcome,
        gateway_response=resp_msg
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return tx