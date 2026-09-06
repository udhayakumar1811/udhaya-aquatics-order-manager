import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'new-order', label: 'New Order' },
    { id: 'orders-list', label: 'Orders List' },
    { id: 'inventory', label: '📦 Stock' },
    { id: 'expenses', label: '💸 Expenses' },
    { id: 'customer-ledger', label: '👥 Payment Ledger' }
  ];

  const managementTools = [
    { id: 'customer-crm', label: '👑 Customer CRM' },
    { id: 'whatsapp-marketing', label: '💬 WhatsApp Broadcast' },
    { id: 'breeding-log', label: '🐟 Breeding Log' },
    { id: 'farm-checklist', label: '📋 Farm Checklist' },
    { id: 'feed-production', label: '🌿 Live Feed Planning' },
    { id: 'expense-analytics', label: '📉 Expense Analytics' },
    { id: 'variety-analytics', label: '📊 Variety Analytics' },
    { id: 'customer-history', label: 'Customer History' },
    { id: 'products-combos', label: 'Products & Combos' },
    { id: 'reports-analytics', label: 'Reports' },
    { id: 'backup', label: '💾 Backup' }
  ];

  const isManagementToolActive = managementTools.some(t => t.id === activeTab);
  const activeToolLabel = managementTools.find(t => t.id === activeTab)?.label || '⚙️ Management Tools';

  return (
    <nav className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between shadow-md relative">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 px-3 py-2 rounded-lg font-bold text-lg">Udhaya Aquatics</div>
        <span className="text-xs text-slate-400 font-semibold tracking-wider">ORDER MANAGER</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3 md:mt-0">
        {primaryNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setToolsDropdownOpen(false); }}
            aria-current={activeTab === item.id ? 'page' : undefined}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}

        {/* Management Tools Dropdown */}
        <div className="relative">
          <button
            onClick={() => setToolsDropdownOpen((o) => !o)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              isManagementToolActive
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-800/60'
            }`}
          >
            <span>{isManagementToolActive ? activeToolLabel : '⚙️ Management Tools'}</span>
            <span className="text-[10px]">▼</span>
          </button>

          {toolsDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white text-slate-800 rounded-xl shadow-xl border border-gray-100 py-2 z-30">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Farm & Business Tools</div>
              {managementTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTab(tool.id);
                    setToolsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === tool.id ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Account Menu */}
        <div className="relative ml-1">
          <button
            onClick={() => { setMenuOpen((o) => !o); setToolsDropdownOpen(false); }}
            aria-label="Account menu"
            aria-expanded={menuOpen}
            className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
            title={user?.email}
          >
            {(user?.email || '?').charAt(0).toUpperCase()}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-lg shadow-lg border border-gray-100 py-2 z-30">
              <p className="px-3 py-1.5 text-xs text-slate-400 truncate">{user?.email}</p>
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-rose-600 font-medium cursor-pointer"
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