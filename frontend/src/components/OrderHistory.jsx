import React from 'react';

export default function OrderHistory({ orders }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800';
      case 'RESERVED':
        return 'bg-amber-100 text-amber-800';
      case 'FAILED':
      case 'EXPIRED':
      case 'CANCELLED':
      default:
        return 'bg-rose-100 text-rose-800';
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-700 mb-3">Order History</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-400 py-2 text-center">No orders recorded yet</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {orders.map((o) => (
            <div key={o.id} className="p-2 bg-slate-50 rounded flex justify-between items-center text-xs border border-slate-100">
              <div>
                <p className="font-mono text-slate-600 font-medium">{o.id.slice(0, 8)}...</p>
                <p className="text-slate-400">${o.total_amount.toFixed(2)}</p>
              </div>
              <span className={`px-2 py-1 rounded font-semibold ${getStatusBadge(o.status)}`}>
                {o.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}