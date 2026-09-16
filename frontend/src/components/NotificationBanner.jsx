import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function NotificationBanner({ message }) {
  if (!message) return null;

  const isSuccess = message.type === 'success';

  return (
    <div 
      className={`max-w-7xl mx-auto mb-6 p-4 rounded-lg flex items-center gap-2 ${
        isSuccess 
          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
          : 'bg-rose-50 text-rose-800 border border-rose-200'
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
      )}
      <span className="font-medium text-sm">{message.text}</span>
    </div>
  );
}