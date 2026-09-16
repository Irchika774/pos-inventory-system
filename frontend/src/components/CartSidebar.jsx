import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';

export default function CartSidebar({ cart, onUpdateQuantity, onRemoveItem, onCheckout, loading }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-[#E5E5E5]">
      <h2 className="text-lg font-bold text-[#14213D] mb-3 flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-[#FCA311]" /> Current Cart
      </h2>

      {cart.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">Cart is empty</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.product_id} className="p-3 bg-[#E5E5E5] rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-[#14213D] text-sm">{item.name}</p>
                    <p className="text-xs text-slate-600">LKR {item.price.toFixed(2)} each</p>
                  </div>
                  <button 
                    onClick={() => onRemoveItem(item.product_id)} 
                    className="text-slate-500 hover:text-rose-600 transition p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-300">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                      className="p-1 bg-white rounded text-[#14213D] hover:bg-slate-100 border border-slate-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                      className="w-12 text-center text-xs font-bold border rounded py-1 bg-white text-[#000000]"
                      min="1"
                    />
                    <button
                      onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                      className="p-1 bg-white rounded text-[#14213D] hover:bg-slate-100 border border-slate-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={() => onUpdateQuantity(item.product_id, item.quantity + 5)}
                      className="ml-1 px-2 py-0.5 bg-[#14213D] text-[#FCA311] font-bold text-[10px] rounded"
                    >
                      +5
                    </button>
                  </div>

                  <span className="font-bold text-[#000000] text-sm">
                    LKR {(item.quantity * item.price).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E5E5E5] pt-3 flex justify-between font-extrabold text-[#14213D] text-base">
            <span>Total Amount</span>
            <span className="text-[#000000]">LKR {total.toFixed(2)}</span>
          </div>

          <button
            onClick={onCheckout}
            disabled={loading}
            className="w-full bg-[#FCA311] hover:bg-amber-500 disabled:bg-slate-300 text-[#14213D] font-extrabold py-3 rounded-lg transition text-sm shadow-md uppercase tracking-wider"
          >
            {loading ? 'Reserving...' : 'Checkout & Reserve Stock'}
          </button>
        </div>
      )}
    </div>
  );
}