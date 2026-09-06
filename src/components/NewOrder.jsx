import React from 'react';
import OrderForm from './OrderForm';

export default function NewOrder({ setActiveTab }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Add New WhatsApp Order</h2>
          <p className="text-sm text-slate-500">Enter order details, selling price, and cost expenses.</p>
        </div>
      </div>
      <OrderForm mode="create" onDone={() => setActiveTab('orders-list')} />
    </div>
  );
}