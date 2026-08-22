import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="flex flex-wrap items-center gap-2 mt-3 md:mt-0">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            aria-current={activeTab === item.id ? 'page' : undefined}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}

        <div className="relative ml-1">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Account menu"
            aria-expanded={menuOpen}
            className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center justify-center transition-colors"
            title={user?.email}
          >
            {(user?.email || '?').charAt(0).toUpperCase()}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-lg shadow-lg border border-gray-100 py-2 z-20">
              <p className="px-3 py-1.5 text-xs text-slate-400 truncate">{user?.email}</p>
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-rose-600 font-medium"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
