import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(order => 
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.mobileNumber?.includes(searchTerm) ||
    order.fishVarietyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Orders List ({filteredOrders.length})</h2>
          <p className="text-sm text-slate-500">Edit tracking IDs, print bills, or view net profit.</p>
        </div>
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-lg text-sm bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider">
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer & PIN</th>
              <th className="p-3">Items</th>
              <th className="p-3">Revenue Total</th>
              <th className="p-3">Net Profit</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-blue-600">ORD-{index + 1001}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{order.customerName}</div>
                    <div className="text-xs text-slate-500">{order.mobileNumber} - {order.pincode}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-800">{order.fishVarietyName} ({order.qty})</div>
                    <div className="text-xs text-slate-500">{order.itemType}</div>
                  </td>
                  <td className="p-3 font-semibold text-slate-800">₹{order.revenueTotal}</td>
                  <td className={`p-3 font-semibold ${order.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ₹{order.netProfit}
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      order.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                      order.orderStatus === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-400">No matching orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}