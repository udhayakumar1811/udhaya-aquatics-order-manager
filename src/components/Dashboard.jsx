import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function Dashboard({ setActiveTab }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ஃபைர்பேஸில் இருந்து ரியல்-டைமாக ஆர்டர்களைப் பெறுதல்
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // கணக்கீடுகள் (Calculations)
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysOrders = orders.filter(o => o.date === todayStr);
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const shippedOrders = orders.filter(o => o.status === 'Shipped');
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.billTotal || 0), 0);
  const totalNetProfit = orders.reduce((sum, o) => sum + Number(o.netProfit || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Welcome to UDHAYA AQUATICS! 🐠
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track WhatsApp orders, automatic profit calculations, and shipping stickers.
          </p>
        </div>
        <button
          onClick={() => setActiveTab && setActiveTab('new-order')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <span>+ Add New Order</span>
        </button>
      </div>

      {/* 2. Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Orders */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">TODAY'S ORDERS</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{todaysOrders.length}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl shadow-inner">
            📦
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">PENDING ORDERS</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{pendingOrders.length}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-xl shadow-inner">
            ⏳
          </div>
        </div>

        {/* Shipped Orders */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">SHIPPED ORDERS</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{shippedOrders.length}</h3>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl shadow-inner">
            🚚
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">DELIVERED ORDERS</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{deliveredOrders.length}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-inner">
            ✅
          </div>
        </div>

      </div>

      {/* 3. Financial Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">TOTAL BUSINESS REVENUE</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1">All sales including shipping charges collected</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
            ₹
          </div>
        </div>

        {/* Total Net Profit */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">TOTAL NET PROFIT (நிகர லாபம்)</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-1">₹{totalNetProfit.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1">After deducting fish cost, packing, & courier fees</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
            📈
          </div>
        </div>

      </div>

      {/* 4. Recent Orders Overview Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">Recent Orders Overview</h3>
          <button 
            onClick={() => setActiveTab && setActiveTab('orders-list')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-6">Order ID</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Items Summary</th>
                <th className="py-3 px-6">Bill Total</th>
                <th className="py-3 px-6">Net Profit</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-400">No orders found yet. Add your first order!</td>
                </tr>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-blue-600">{order.orderId || order.id.slice(0, 6)}</td>
                    <td className="py-4 px-6 font-medium text-gray-900">{order.customerName}</td>
                    <td className="py-4 px-6 text-gray-500">{order.itemsSummary || 'Guppies Pair'}</td>
                    <td className="py-4 px-6 font-semibold text-gray-900">₹{order.billTotal}</td>
                    <td className="py-4 px-6 font-semibold text-emerald-600">₹{order.netProfit}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' :
                        order.status === 'Shipped' ? 'bg-purple-50 text-purple-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {order.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}