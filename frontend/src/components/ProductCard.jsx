import React from 'react';
import { Plus } from 'lucide-react';

export default function ProductCard({ product, onAddToCart }) {
  const isOutOfStock = product.available_stock === 0;

  return (
    <div className="bg-white rounded-xl p-4 border border-[#E5E5E5] shadow-sm flex flex-col justify-between space-y-3 hover:border-[#14213D] transition">
      <div className="flex gap-3">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-16 h-16 object-cover rounded-lg border border-[#E5E5E5]"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#14213D] text-sm truncate">{product.name}</h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{product.description}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#E5E5E5] text-[#14213D]">
              Avail: {product.available_stock}
            </span>
            {product.reserved_stock > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FCA311] text-[#14213D]">
                Reserved: {product.reserved_stock}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-[#E5E5E5]">
        <span className="text-base font-extrabold text-[#000000]">
          LKR {product.price.toFixed(2)}
        </span>
        <button
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          className="px-3 py-2 bg-[#14213D] hover:bg-[#FCA311] hover:text-[#14213D] disabled:bg-slate-200 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}