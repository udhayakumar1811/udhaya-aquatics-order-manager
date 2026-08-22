import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import NewOrder from './components/NewOrder';
import OrdersList from './components/OrdersList';
import CustomerHistory from './components/CustomerHistory';
import ProductsCombos from './components/ProductsCombos';
import ReportsAnalytics from './components/ReportsAnalytics';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'new-order' && <NewOrder setActiveTab={setActiveTab} />}
        {activeTab === 'orders-list' && <OrdersList />}
        {activeTab === 'customer-history' && <CustomerHistory />}
        {activeTab === 'products-combos' && <ProductsCombos />}
        {activeTab === 'reports-analytics' && <ReportsAnalytics />}
      </main>
    </div>
  );
}