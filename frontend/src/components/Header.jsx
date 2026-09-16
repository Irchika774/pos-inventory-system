import React from 'react';
import { ShoppingBag, RefreshCw } from 'lucide-react';

export default function Header({ onRefresh }) {
  return (
    <header className="max-w-7xl mx-auto flex justify-between items-center bg-[#14213D] p-4 rounded-xl shadow-md mb-6 text-white">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#FCA311] rounded-lg">
          <ShoppingBag className="text-[#14213D] w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-wide">POS Order & Inventory System</h1>
      </div>
      <button 
        onClick={onRefresh} 
        className="p-2 hover:bg-[#FCA311] hover:text-[#14213D] rounded-full transition text-white"
        title="Refresh Inventory"
      >
        <RefreshCw className="w-5 h-5" />
      </button>
    </header>
  );
}