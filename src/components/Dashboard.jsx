import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function Dashboard({ setActiveTab }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysOrders = orders.filter(o => o.date === todayStr);
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const shippedOrders = orders.filter(o => o.status === 'Shipped');
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.billTotal || 0), 0);
  const totalNetProfit = orders.reduce((sum, o) => sum + Number(o.netProfit || 0), 0);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 text-sm">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Welcome to UDHAYA AQUATICS! 🐠
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track WhatsApp orders, automatic profit calculations, and shipping stickers.
          </p>
        </div>
        <button
          onClick={() => setActiveTab && setActiveTab('new-order')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
        >
          <span>+ Add New Order</span>
        </button>
      </div>

      {/* 2. Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Today's Orders */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">TODAY'S ORDERS</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-0.5">{todaysOrders.length}</h3>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-base">
            📦
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">PENDING ORDERS</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-0.5">{pendingOrders.length}</h3>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center text-base">
            ⏳
          </div>
        </div>

        {/* Shipped Orders */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">SHIPPED ORDERS</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-0.5">{shippedOrders.length}</h3>
          </div>
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center text-base">
            🚚
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">DELIVERED ORDERS</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-0.5">{deliveredOrders.length}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-base">
            ✅
          </div>
        </div>

      </div>

      {/* 3. Financial Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">TOTAL BUSINESS REVENUE</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">₹{totalRevenue.toLocaleString()}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">All sales including shipping charges collected</p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-base">
            ₹
          </div>
        </div>

        {/* Total Net Profit */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">TOTAL NET PROFIT (நிகர லாபம்)</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">₹{totalNetProfit.toLocaleString()}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">After deducting fish cost, packing, & courier fees</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-base">
            📈
          </div>
        </div>

      </div>

      {/* 4. Recent Orders Overview Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">Recent Orders Overview</h3>
          <button 
            onClick={() => setActiveTab && setActiveTab('orders-list')}
            className="text-blue-600 hover:text-blue-700 text-xs font-medium"
          >
            View All →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Order ID</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Items Summary</th>
                <th className="py-2.5 px-4">Bill Total</th>
                <th className="py-2.5 px-4">Net Profit</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-400">No orders found yet. Add your first order!</td>
                </tr>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-blue-600">{order.orderId || order.id.slice(0, 6)}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{order.customerName}</td>
                    <td className="py-3 px-4 text-gray-500">{order.itemsSummary || 'Guppies Pair'}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">₹{order.billTotal}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">₹{order.netProfit}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
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