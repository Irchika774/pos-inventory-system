import { useState, useEffect } from 'react';
import Header from './components/Header';
import NotificationBanner from './components/NotificationBanner';
import ProductCatalog from './components/ProductCatalog';
import ReservationTimer from './components/ReservationTimer';
import CartSidebar from './components/CartSidebar';
import OrderHistory from './components/OrderHistory';

// Prepend VITE_API_BASE_URL for production (Vercel) with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [timer, setTimer] = useState(300);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  // 5-minute stock reservation countdown timer
  useEffect(() => {
    let interval = null;
    if (activeOrder && activeOrder.status === 'RESERVED' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            handleAutoExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeOrder, timer]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/`);
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/`);
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.available_stock) return prev;
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product && newQuantity > product.available_stock) return;

    setCart((prev) =>
      prev.map((item) => (item.product_id === productId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const handleRemoveItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: 'guest_user',
          items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Checkout failed');

      setActiveOrder(data);
      setCart([]);
      setTimer(300);
      setMessage({ type: 'success', text: `Stock Reserved! Order ID: ${data.id.slice(0, 8)}...` });
      fetchProducts();
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (outcome) => {
    if (!activeOrder) return;
    setLoading(true);
    setMessage(null);
    try {
      const idempotencyKey = `PAY-${activeOrder.id}-${Date.now()}`;
      const res = await fetch(`${API_BASE_URL}/api/payments/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: activeOrder.id,
          idempotency_key: idempotencyKey,
          simulated_outcome: outcome,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Payment failed');

      setMessage({ type: 'success', text: `Payment Processed: ${outcome}` });
      setActiveOrder(null);
      fetchProducts();
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoExpire = async () => {
    if (!activeOrder) return;
    try {
      await fetch(`${API_BASE_URL}/api/payments/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: activeOrder.id,
          idempotency_key: `EXPIRE-${activeOrder.id}-${Date.now()}`,
          simulated_outcome: 'TIMEOUT',
        }),
      });
      setMessage({ type: 'error', text: 'Stock reservation expired after 5 minutes.' });
      setActiveOrder(null);
      fetchProducts();
      fetchOrders();
    } catch (err) {
      console.error("Failed to auto-expire order:", err);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] p-6 text-[#000000]">
      <Header onRefresh={() => { fetchProducts(); fetchOrders(); }} />
      <NotificationBanner message={message} />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductCatalog products={products} onAddToCart={addToCart} />
        </div>

        <div className="space-y-6">
          <ReservationTimer
            activeOrder={activeOrder}
            timer={timer}
            onProcessPayment={processPayment}
            formatTimer={formatTimer}
          />
          <CartSidebar
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={handleCheckout}
            loading={loading}
          />
          <OrderHistory orders={orders} />
        </div>
      </div>
    </div>
  );
}
