import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const primaryNavItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'new-order', label: '➕ New Order' },
    { id: 'orders-list', label: '📋 Orders List' },
    { id: 'inventory', label: '📦 Stock' },
    { id: 'expenses', label: '💸 Expenses' },
    { id: 'customer-ledger', label: '👥 Payment Ledger' }
  ];

  // Categorized Management Tools Groups with Emojis
  const toolCategories = [
    {
      title: '👑 Customer & Marketing',
      items: [
        { id: 'customer-crm', label: '👑 Customer CRM' },
        { id: 'whatsapp-marketing', label: '📢 WhatsApp Broadcast' },
        { id: 'whatsapp-api-settings', label: '⚙️ WhatsApp Cloud API' }
      ]
    },
    {
      title: '🐟 Farm & Production',
      items: [
        { id: 'breeding-log', label: '🧬 Breeding Log' },
        { id: 'fish-grading', label: '📏 Fish Size & Grade Grading Log' },
        { id: 'feed-production', label: '🌿 Live Feed Planning' },
        { id: 'mortality-tracker', label: '⚠️ Mortality & Loss Tracker' },
        { id: 'farm-checklist', label: '☑️ Farm Checklist' }
      ]
    },
    {
      title: '📊 Analytics & Reports',
      items: [
        { id: 'channel-sales', label: '📺 Sales Channels (YouTube/Insta)' },
        { id: 'expense-analytics', label: '📉 Expense Analytics' },
        { id: 'variety-analytics', label: '📊 Variety Sales Analytics' },
        { id: 'reports-analytics', label: '📑 Reports & P&L' },
        { id: 'profit-loss-report', label: '📈 Monthly P&L Statement' },
        { id: 'geo-analytics', label: '🗺️ Geographic Sales & Districts' },
        { id: 'customer-history', label: '📜 Customer History' }
      ]
    },
    {
      title: '⚙️ Utilities & Tools',
      items: [
        { id: 'courier-calculator', label: '📦 Courier & Pincode Calculator' },
        { id: 'products-combos', label: '🛍️ Products & Combos' },
        { id: 'backup', label: '💾 Data Backup' }
      ]
    }
  ];

  const allManagementToolIds = toolCategories.flatMap(cat => cat.items.map(i => i.id));
  const isManagementToolActive = allManagementToolIds.includes(activeTab);
  
  const activeToolObj = toolCategories
    .flatMap(cat => cat.items)
    .find(i => i.id === activeTab);
  const activeToolLabel = activeToolObj ? activeToolObj.label : '⚙️ Management Tools';

  return (
    <nav className="bg-slate-900 text-white px-4 md:px-6 py-4 shadow-md relative z-50">
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 px-3 py-2 rounded-lg font-bold text-base md:text-lg">Udhaya Aquatics</div>
          <span className="hidden sm:inline text-xs text-slate-400 font-semibold tracking-wider">ORDER MANAGER</span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-2">
          {primaryNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setToolsDropdownOpen(false); }}
              aria-current={activeTab === item.id ? 'page' : undefined}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* Desktop Management Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => setToolsDropdownOpen((o) => !o)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                isManagementToolActive
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-800/60'
              }`}
            >
              <span>{isManagementToolActive ? activeToolLabel : '⚙️ Management Tools'}</span>
              <span className="text-[10px]">▼</span>
            </button>

            {toolsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-[720px] bg-white text-slate-800 rounded-2xl shadow-2xl border border-gray-100 p-4 z-40 grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[80vh] overflow-y-auto">
                {toolCategories.map((category, catIdx) => (
                  <div key={catIdx} className="space-y-2">
                    <div className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider pb-1 border-b border-gray-100">
                      {category.title}
                    </div>
                    <div className="space-y-1">
                      {category.items.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setActiveTab(tool.id);
                            setToolsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            activeTab === tool.id
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tool.label}
                        </button>
                      ))}
                    </div>
                  </div>
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
              <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-xl border border-gray-100 py-2 z-40">
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

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => { setMenuOpen((o) => !o); setMobileMenuOpen(false); }}
            className="w-8 h-8 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center"
            title={user?.email}
          >
            {(user?.email || '?').charAt(0).toUpperCase()}
          </button>

          <button
            onClick={() => { setMobileMenuOpen((o) => !o); setMenuOpen(false); }}
            aria-label="Toggle mobile menu"
            className="p-2 rounded-lg bg-slate-800 text-white focus:outline-none"
          >
            <span className="text-xl">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Account Menu Dropdown for Mobile */}
      {menuOpen && (
        <div className="absolute right-4 top-16 w-56 bg-white text-slate-800 rounded-xl shadow-xl border border-gray-100 py-2 z-50 lg:hidden">
          <p className="px-3 py-1.5 text-xs text-slate-400 truncate">{user?.email}</p>
          <button
            onClick={() => { setMenuOpen(false); logout(); }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-rose-600 font-medium cursor-pointer"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 pt-4 border-t border-slate-800 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Primary Menu</p>
            {primaryNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === item.id ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Management Tools Accordion */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
              className="w-full flex justify-between items-center px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-white"
            >
              <span>{isManagementToolActive ? activeToolLabel : '⚙️ Management Tools'}</span>
              <span>{mobileToolsOpen ? '▲' : '▼'}</span>
            </button>

            {mobileToolsOpen && (
              <div className="space-y-4 pl-2 py-2">
                {toolCategories.map((category, catIdx) => (
                  <div key={catIdx} className="space-y-1.5">
                    <div className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider">
                      {category.title}
                    </div>
                    <div className="space-y-1 pl-2">
                      {category.items.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setActiveTab(tool.id);
                            setMobileMenuOpen(false);
                            setMobileToolsOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeTab === tool.id ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {tool.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}