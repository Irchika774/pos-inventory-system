from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models import OrderStatus, PaymentStatus

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float = Field(gt=0)
    available_stock: int = Field(ge=0)
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    reserved_stock: int

    class Config:
        from_attributes = True

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)

class OrderCreate(BaseModel):
    customer_id: str = "guest"
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    status: OrderStatus
    total_amount: float
    expires_at: Optional[datetime]
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

class PaymentRequest(BaseModel):
    order_id: str
    idempotency_key: str
    simulated_outcome: PaymentStatus = PaymentStatus.SUCCESS

class PaymentResponse(BaseModel):
    id: str
    order_id: str
    idempotency_key: str
    status: PaymentStatus
    gateway_response: str
    created_at: datetime

    class Config:
        from_attributes = True