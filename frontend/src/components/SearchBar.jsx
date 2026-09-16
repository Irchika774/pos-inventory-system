import React, { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ searchQuery, setSearchQuery }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full">
      <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search product or SKU... (Press '/' or 'Ctrl+K' to focus)"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-16 py-2 bg-white border border-[#E5E5E5] rounded-lg text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-[#14213D] shadow-sm"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono bg-[#E5E5E5] text-[#14213D] font-bold px-2 py-0.5 rounded border border-slate-300">
        /
      </span>
    </div>
  );
}