import React from 'react';

export default function QuickKeys({ products, onAddToCart }) {
  const topSellers = products.slice(0, 6);

  if (topSellers.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-xl border border-[#E5E5E5] shadow-sm mb-4">
      <h3 className="text-xs font-extrabold text-[#14213D] uppercase tracking-wider mb-2">
        ⚡ Quick-Keys (Top Sellers)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {topSellers.map((p) => (
          <button
            key={p.id}
            onClick={() => onAddToCart(p)}
            disabled={p.available_stock === 0}
            className="p-2.5 bg-[#14213D] hover:bg-slate-800 active:scale-95 disabled:opacity-40 text-white border border-[#14213D] rounded-lg text-left transition flex justify-between items-center"
          >
            <div className="truncate pr-1">
              <p className="text-xs font-bold truncate">{p.name}</p>
              <p className="text-[10px] text-[#FCA311] font-extrabold">LKR {p.price.toFixed(2)}</p>
            </div>
            <span className="text-xs font-black bg-[#FCA311] text-[#14213D] px-2 py-0.5 rounded">
              +1
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}