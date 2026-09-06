import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function VarietySalesAnalytics() {
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

  // Calculate sales breakdown by variety/item name
  const varietySalesMap = {};
  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const name = item.varietyName || 'Unknown Item';
        const qty = Number(item.qty || 0);
        const revenue = Number(item.sellingPrice || 0) * qty;

        if (!varietySalesMap[name]) {
          varietySalesMap[name] = { totalQty: 0, totalRevenue: 0, type: item.itemType || 'Variety' };
        }
        varietySalesMap[name].totalQty += qty;
        varietySalesMap[name].totalRevenue += revenue;
      });
    }
  });

  const sortedVarieties = Object.entries(varietySalesMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalQty - a.totalQty);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Combo & Variety Sales Breakdown</h1>
        <p className="text-xs text-gray-500 mt-0.5">Analyze which guppy varieties and combo packs generate the highest sales volume and revenue.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading analytics...</div>
      ) : sortedVarieties.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">No sales data available for breakdown analysis yet.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">VARIETY / COMBO NAME</th>
                  <th className="py-3 px-4">CATEGORY TYPE</th>
                  <th className="py-3 px-4 text-right">TOTAL QTY SOLD</th>
                  <th className="py-3 px-4 text-right">TOTAL REVENUE (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {sortedVarieties.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px]">#{index + 1}</span>
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-lg">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-indigo-600">{item.totalQty}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">₹{item.totalRevenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}   