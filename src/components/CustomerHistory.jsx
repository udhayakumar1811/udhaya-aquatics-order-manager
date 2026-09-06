import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function CustomerHistory() {
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

  const customerMap = {};
  orders.forEach(order => {
    const key = order.customerName ? order.customerName.trim().toLowerCase() : 'unknown';
    if (!customerMap[key]) {
      customerMap[key] = {
        customerName: order.customerName || 'Unknown Customer',
        phone: order.phone || order.mobileNumber || '',
        address: order.address || order.fullAddress || '',
        pincode: order.pincode || '',
        orders: []
      };
    }
    customerMap[key].orders.push(order);
  });

  const customersList = Object.values(customerMap);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 text-sm">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800">Customer Purchase History</h1>
        <p className="text-xs text-gray-500 mt-0.5">View previous orders and total spent per customer.</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">Loading customer history...</div>
      ) : customersList.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">No customer history found yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customersList.map((cust, idx) => {
            const totalSpent = cust.orders.reduce((sum, o) => sum + Number(o.revenueTotal || o.billTotal || 0), 0);

            return (
              <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{cust.customerName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cust.phone} | {cust.address}, {cust.pincode}
                    </p>
                  </div>
                  <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-lg">
                    {cust.orders.length} Orders
                  </span>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-500">Total Customer Revenue:</span>
                  <span className="font-bold text-emerald-600 text-sm">₹{totalSpent}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">PAST ORDERS BREAKDOWN:</p>
                  {cust.orders.map((order) => (
                    <div key={order.id} className="border border-gray-100 p-3 rounded-lg flex justify-between items-center bg-white hover:bg-gray-50/50 transition-colors">
                      <div>
                        <div className="font-semibold text-blue-600 text-xs">
                          {order.orderId || order.id.slice(0, 6)} <span className="text-gray-400 font-normal">({order.date || '—'})</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          • {order.itemsSummary || (order.items && order.items[0]?.varietyName) || '—'}
                        </div>
                      </div>
                      <div className="font-semibold text-gray-900 text-xs">
                        ₹{order.revenueTotal || order.billTotal || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}