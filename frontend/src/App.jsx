
import React, { useState, useEffect, useCallback } from 'react';

import Header from './components/Header';
import NotificationBanner from './components/NotificationBanner';
import ProductCatalog from './components/ProductCatalog';
import ReservationTimer from './components/ReservationTimer';
import CartSidebar from './components/CartSidebar';
import OrderHistory from './components/OrderHistory';

// ==========================================
// BACKEND API
// ==========================================
// VITE_API_URL can be set in .env or Vercel.
// The fallback makes this work even if the
// environment variable has not been added yet.
const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://backend-self-five-15.vercel.app';


// ==========================================
// APP
// ==========================================

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);

  const [timer, setTimer] = useState(300);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);


  // ==========================================
  // FETCH PRODUCTS
  // ==========================================

  const fetchProducts = useCallback(async () => {
    try {
      console.log('Fetching products from:', `${API_URL}/api/products/`);

      const response = await fetch(
        `${API_URL}/api/products/`
      );

      if (!response.ok) {
        throw new Error(
          `Products API returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log('Products received:', data);

      setProducts(data);
    } catch (error) {
      console.error(
        'Failed to fetch products:',
        error
      );

      setMessage({
        type: 'error',
        text: 'Unable to load products. Please refresh the page.',
      });
    }
  }, []);


  // ==========================================
  // FETCH ORDERS
  // ==========================================

  const fetchOrders = useCallback(async () => {
    try {
      console.log(
        'Fetching orders from:',
        `${API_URL}/api/orders/`
      );

      const response = await fetch(
        `${API_URL}/api/orders/`
      );

      if (!response.ok) {
        throw new Error(
          `Orders API returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log('Orders received:', data);

      setOrders(data);
    } catch (error) {
      console.error(
        'Failed to fetch orders:',
        error
      );
    }
  }, []);


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [fetchProducts, fetchOrders]);


  // ==========================================
  // RESERVATION TIMER
  // ==========================================

  useEffect(() => {
    if (
      !activeOrder ||
      activeOrder.status !== 'RESERVED' ||
      timer <= 0
    ) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((previousTimer) => {
        if (previousTimer <= 1) {
          clearInterval(interval);

          handleAutoExpire();

          return 0;
        }

        return previousTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOrder, timer]);


  // ==========================================
  // ADD PRODUCT TO CART
  // ==========================================

  const addToCart = (product) => {
    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (item) => item.product_id === product.id
      );

      // Product already exists in cart
      if (existingItem) {
        // Don't allow quantity above available stock
        if (
          existingItem.quantity >=
          product.available_stock
        ) {
          return previousCart;
        }

        return previousCart.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      // New product
      return [
        ...previousCart,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };


  // ==========================================
  // UPDATE CART QUANTITY
  // ==========================================

  const handleUpdateQuantity = (
    productId,
    newQuantity
  ) => {
    // Remove item
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {
      return;
    }

    // Don't allow quantity above stock
    if (
      newQuantity >
      product.available_stock
    ) {
      return;
    }

    setCart((previousCart) =>
      previousCart.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      )
    );
  };


  // ==========================================
  // REMOVE ITEM FROM CART
  // ==========================================

  const handleRemoveItem = (productId) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) =>
          item.product_id !== productId
      )
    );
  };


  // ==========================================
  // CHECKOUT
  // ==========================================

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setMessage({
        type: 'error',
        text: 'Your cart is empty.',
      });

      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log(
        'Sending checkout request...'
      );

      const response = await fetch(
        `${API_URL}/api/orders/checkout`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            customer_id: 'guest_user',

            items: cart.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
            })),
          }),
        }
      );

      const data = await response.json();

      console.log(
        'Checkout response:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Checkout failed'
        );
      }

      // Save active order
      setActiveOrder(data);

      // Clear cart
      setCart([]);

      // Reset timer to 5 minutes
      setTimer(300);

      // Success message
      setMessage({
        type: 'success',

        text:
          `Stock Reserved! Order ID: ` +
          `${data.id.slice(0, 8)}...`,
      });

      // Refresh inventory and orders
      await fetchProducts();
      await fetchOrders();

    } catch (error) {
      console.error(
        'Checkout error:',
        error
      );

      setMessage({
        type: 'error',

        text:
          error.message ||
          'Checkout failed.',
      });

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // PROCESS PAYMENT
  // ==========================================

  const processPayment = async (
    outcome
  ) => {
    if (!activeOrder) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const idempotencyKey =
        `PAY-${activeOrder.id}-${Date.now()}`;

      console.log(
        'Processing payment:',
        outcome
      );

      const response = await fetch(
        `${API_URL}/api/payments/process`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            order_id:
              activeOrder.id,

            idempotency_key:
              idempotencyKey,

            simulated_outcome:
              outcome,
          }),
        }
      );

      const data = await response.json();

      console.log(
        'Payment response:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Payment failed'
        );
      }

      setMessage({
        type:
          outcome === 'SUCCESS'
            ? 'success'
            : 'error',

        text:
          `Payment Outcome: ${outcome}`,
      });

      // Remove active order
      setActiveOrder(null);

      // Refresh data
      await fetchProducts();
      await fetchOrders();

    } catch (error) {
      console.error(
        'Payment error:',
        error
      );

      setMessage({
        type: 'error',

        text:
          error.message ||
          'Payment failed.',
      });

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // AUTO EXPIRE RESERVATION
  // ==========================================

  const handleAutoExpire = async () => {
    setMessage({
      type: 'error',

      text:
        'Stock reservation expired! ' +
        'Items returned to inventory.',
    });

    setActiveOrder(null);

    await fetchProducts();
    await fetchOrders();
  };


  // ==========================================
  // FORMAT TIMER
  // ==========================================

  const formatTimer = (seconds) => {
    const minutes =
      Math.floor(seconds / 60);

    const remainingSeconds =
      seconds % 60;

    return (
      `${minutes}:` +
      `${
        remainingSeconds < 10
          ? '0'
          : ''
      }${remainingSeconds}`
    );
  };


  // ==========================================
  // REFRESH EVERYTHING
  // ==========================================

  const handleRefresh = () => {
    fetchProducts();
    fetchOrders();
  };


  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#E5E5E5] p-6 text-[#000000]">

      {/* Header */}
      <Header
        onRefresh={handleRefresh}
      />


      {/* Notifications */}
      <NotificationBanner
        message={message}
      />


      {/* Main Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* =====================================
            PRODUCT CATALOG
        ====================================== */}

        <div className="lg:col-span-2">

          <ProductCatalog
            products={products}
            onAddToCart={addToCart}
          />

        </div>


        {/* =====================================
            RIGHT SIDEBAR
        ====================================== */}

        <div className="space-y-6">

          {/* Reservation Timer */}

          <ReservationTimer
            activeOrder={activeOrder}
            timer={timer}
            onProcessPayment={
              processPayment
            }
            formatTimer={
              formatTimer
            }
          />


          {/* Cart */}

          <CartSidebar
            cart={cart}
            onUpdateQuantity={
              handleUpdateQuantity
            }
            onRemoveItem={
              handleRemoveItem
            }
            onCheckout={
              handleCheckout
            }
            loading={loading}
          />


          {/* Order History */}

          <OrderHistory
            orders={orders}
          />

        </div>

      </div>

    </div>
  );
}

