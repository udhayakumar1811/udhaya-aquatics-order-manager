import React from 'react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'new-order', label: 'New Order' },
    { id: 'orders-list', label: 'Orders List' },
    { id: 'customer-history', label: 'Customer History' },
    { id: 'products-combos', label: 'Products & Combos' },
    { id: 'reports-analytics', label: 'Reports & Analytics' }
  ];

  return (
    <nav className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between shadow-md">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 px-3 py-2 rounded-lg font-bold text-lg">Udhaya Aquatics</div>
        <span className="text-xs text-slate-400 font-semibold tracking-wider">ORDER MANAGER</span>
      </div>
      <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}