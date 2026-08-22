import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
    netProfit: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      let today = 0, pending = 0, shipped = 0, delivered = 0;
      let revenue = 0, profit = 0;
      let ordersList = [];

      const todayStr = new Date().toISOString().split('T')[0];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        ordersList.push({ id: doc.id, ...data });

        revenue += Number(data.revenueTotal || 0);
        profit += Number(data.netProfit || 0);

        if (data.orderStatus === 'Pending') pending++;
        if (data.orderStatus === 'Shipped') shipped++;
        if (data.orderStatus === 'Delivered') delivered++;

        // Check if created today (approximate check based on date string if available)
        if (data.createdAt && data.createdAt.toDate) {
          const orderDate = data.createdAt.toDate().toISOString().split('T')[0];
          if (orderDate === todayStr) today++;
        }
      });

      setStats({
        todayOrders: today,
        pendingOrders: pending,
        shippedOrders: shipped,
        deliveredOrders: delivered,
        totalRevenue: revenue,
        netProfit: profit
      });

      setRecentOrders(ordersList.slice(0, 5)); // Last 5 orders
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-xl shadow-sm flex flex-wrap justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome to UDHAYA AQUATICS! 🐠</h2>
          <p className="text-sm text-slate-500">Track WhatsApp orders, automatic profit calculations, and shipping stickers.</p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Today's Orders</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.todayOrders}</h3>
          </div>
          <div className="bg-blue-600 p-3 rounded-xl text-white font-bold">📦</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Pending Orders</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.pendingOrders}</h3>
          </div>
          <div className="bg-amber-500 p-3 rounded-xl text-white font-bold">⏳</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Shipped Orders</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.shippedOrders}</h3>
          </div>
          <div className="bg-purple-600 p-3 rounded-xl text-white font-bold">🚚</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Delivered Orders</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.deliveredOrders}</h3>
          </div>
          <div className="bg-emerald-600 p-3 rounded-xl text-white font-bold">✅</div>
        </div>
      </div>

      {/* Revenue & Profit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Business Revenue</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">₹{stats.totalRevenue}</h3>
          <p className="text-xs text-slate-500 mt-1">All sales including shipping charges collected</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Net Profit (நிகர லாபம்)</p>
          <h3 className="text-3xl font-bold text-emerald-600 mt-2">₹{stats.netProfit}</h3>
          <p className="text-xs text-slate-500 mt-1">After deducting fish cost, packing, & courier fees</p>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Orders Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase">
                <th className="p-3">Customer</th>
                <th className="p-3">Items Summary</th>
                <th className="p-3">Bill Total</th>
                <th className="p-3">Net Profit</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length > 0 ? (
                recentOrders.map((order, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{order.customerName}</td>
                    <td className="p-3 text-slate-600">{order.fishVarietyName} ({order.qty})</td>
                    <td className="p-3 font-semibold text-slate-800">₹{order.revenueTotal}</td>
                    <td className="p-3 font-semibold text-emerald-600">₹{order.netProfit}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">{order.orderStatus}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-400">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}