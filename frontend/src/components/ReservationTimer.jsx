import React from 'react';
import { Clock } from 'lucide-react';

export default function ReservationTimer({ activeOrder, timer, onProcessPayment, formatTimer }) {
  if (!activeOrder || activeOrder.status !== 'RESERVED') return null;

  return (
    <div className="bg-[#14213D] text-white border-2 border-[#FCA311] p-4 rounded-xl space-y-3 shadow-md">
      <div className="flex justify-between items-center font-semibold">
        <span className="flex items-center gap-2 text-[#FCA311]">
          <Clock className="w-5 h-5 text-[#FCA311]" /> Stock Reserved
        </span>
        <span className="text-xl font-mono font-bold text-[#FCA311]">{formatTimer(timer)}</span>
      </div>
      <p className="text-xs text-[#E5E5E5]">
        Stock is locked for 5 minutes. Complete payment below to finalize.
      </p>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <button 
          onClick={() => onProcessPayment('SUCCESS')} 
          className="bg-[#FCA311] hover:bg-amber-500 text-[#14213D] font-bold text-xs py-2 rounded transition"
        >
          Success
        </button>
        <button 
          onClick={() => onProcessPayment('FAILED')} 
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded transition"
        >
          Fail
        </button>
        <button 
          onClick={() => onProcessPayment('TIMEOUT')} 
          className="bg-[#E5E5E5] hover:bg-slate-300 text-[#14213D] font-bold text-xs py-2 rounded transition"
        >
          Timeout
        </button>
      </div>
    </div>
  );
}