import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function ChannelSalesTracker() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Channel breakdown calculation
  const channelStats = {
    'YouTube Shorts': { count: 0, revenue: 0 },
    'Instagram Reels': { count: 0, revenue: 0 },
    'WhatsApp Status': { count: 0, revenue: 0 },
    'Direct / Walk-in': { count: 0, revenue: 0 },
    'Facebook / Meta': { count: 0, revenue: 0 },
    'Other / Unknown': { count: 0, revenue: 0 }
  };

  orders.forEach(order => {
    // Fallback if salesChannel is not explicitly set in older orders
    let channel = order.salesChannel || order.source || 'Direct / Walk-in';
    if (!channelStats[channel]) {
      channel = 'Other / Unknown';
    }

    const amount = Number(order.revenueTotal || order.billTotal || 0);
    channelStats[channel].count += 1;
    channelStats[channel].revenue += amount;
  });

  const totalRevenueAll = Object.values(channelStats).reduce((sum, c) => sum + c.revenue, 0);
  const totalOrdersAll = Object.values(channelStats).reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Multi-Channel Sales Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track which platform (YouTube Shorts, Instagram Reels, WhatsApp) brings the highest orders and revenue.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">TOTAL TRACKED REVENUE</p>
          <h3 className="text-3xl font-extrabold text-blue-700 mt-2">₹{totalRevenueAll.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-emerald-600 uppercase">TOTAL ORDERS ANALYZED</p>
          <h3 className="text-3xl font-extrabold text-emerald-700 mt-2">{totalOrdersAll} Orders</h3>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading channel sales breakdown...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Object.entries(channelStats).map(([channelName, stats], index) => {
            const percentage = totalRevenueAll > 0 ? Math.round((stats.revenue / totalRevenueAll) * 100) : 0;
            return (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{channelName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{stats.count} Orders completed</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-600">
                    {percentage}% Share
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Revenue Generated</p>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1">₹{stats.revenue.toLocaleString()}</p>
                </div>

                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}