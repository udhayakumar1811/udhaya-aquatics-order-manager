import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function CustomerCRM() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Aggregate customer data
  const customerMap = {};
  orders.forEach(order => {
    const name = order.customerName ? order.customerName.trim() : 'Unknown Customer';
    const phone = order.phone || order.mobileNumber || order.whatsappNumber || '—';
    const amount = Number(order.revenueTotal || order.billTotal || 0);

    if (!customerMap[phone]) {
      customerMap[phone] = {
        name,
        phone,
        city: order.city || '—',
        state: order.state || '—',
        totalOrders: 0,
        lifetimeValue: 0,
        lastOrderDate: order.date || '—'
      };
    }
    customerMap[phone].totalOrders += 1;
    customerMap[phone].lifetimeValue += amount;
    // Keep the most recent name if updated
    if (order.customerName) {
      customerMap[phone].name = order.customerName.trim();
    }
  });

  const customersList = Object.values(customerMap).sort((a, b) => b.lifetimeValue - a.lifetimeValue);

  const filteredCustomers = customersList.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const repeatBuyersCount = customersList.filter(c => c.totalOrders > 1).length;
  const totalCustomersCount = customersList.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customer CRM & Repeat Buyers</h1>
          <p className="text-xs text-gray-500 mt-0.5">Identify loyal customers, track lifetime value (LTV), and review purchase frequency.</p>
        </div>
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search by name, phone or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL UNIQUE CUSTOMERS</p>
          <h3 className="text-3xl font-extrabold text-blue-600 mt-2">{totalCustomersCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">REPEAT BUYERS (LOYAL CUSTOMERS)</p>
          <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">{repeatBuyersCount}</h3>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading CRM data...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">No customer records found.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">CUSTOMER NAME</th>
                  <th className="py-3 px-4">MOBILE / PHONE</th>
                  <th className="py-3 px-4">LOCATION</th>
                  <th className="py-3 px-4 text-center">TOTAL ORDERS</th>
                  <th className="py-3 px-4 text-center">BUYER TYPE</th>
                  <th className="py-3 px-4 text-right">LIFETIME VALUE (LTV)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredCustomers.map((cust, index) => {
                  const isRepeat = cust.totalOrders > 1;
                  return (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{cust.name}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-600">{cust.phone}</td>
                      <td className="py-3.5 px-4 text-gray-500">{cust.city}, {cust.state}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-800">{cust.totalOrders}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                          isRepeat 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isRepeat ? '⭐ Repeat Buyer' : '👤 Single Order'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-blue-600">₹{cust.lifetimeValue.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}