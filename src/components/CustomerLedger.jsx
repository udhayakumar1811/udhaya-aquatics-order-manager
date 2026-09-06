import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function CustomerLedger() {
  const { showToast } = useToast();
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

  const handleStatusToggle = async (orderId, currentStatus) => {
    const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: newStatus
      });
      showToast(`Payment status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating payment status: ', error);
      showToast('Could not update payment status.', 'error');
    }
  };

  const filteredOrders = orders.filter(o => 
    (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.phone || o.mobileNumber || '').includes(searchTerm) ||
    (o.orderId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPendingAmount = orders
    .filter(o => (o.paymentStatus || 'Paid') === 'Pending')
    .reduce((sum, o) => sum + Number(o.revenueTotal || o.billTotal || 0), 0);

  const totalPaidAmount = orders
    .filter(o => (o.paymentStatus || 'Paid') === 'Paid')
    .reduce((sum, o) => sum + Number(o.revenueTotal || o.billTotal || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customer Payment Ledger & Dues</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track paid and pending payments from customers easily.</p>
        </div>
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search by name, phone or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL COLLECTED (PAID)</p>
          <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">₹{totalPaidAmount.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL PENDING (பணம் வர வேண்டியது)</p>
          <h3 className="text-3xl font-extrabold text-rose-600 mt-2">₹{totalPendingAmount.toLocaleString()}</h3>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading ledger...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">No customer records found.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">ORDER ID</th>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">CUSTOMER NAME</th>
                  <th className="py-3 px-4">MOBILE</th>
                  <th className="py-3 px-4">TOTAL AMOUNT</th>
                  <th className="py-3 px-4">PAYMENT MODE</th>
                  <th className="py-3 px-4 text-center">PAYMENT STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredOrders.map((order) => {
                  const payStatus = order.paymentStatus || 'Paid';
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{order.orderId || '—'}</td>
                      <td className="py-3.5 px-4 text-gray-500">{order.date || '—'}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">{order.customerName}</td>
                      <td className="py-3.5 px-4 text-gray-600">{order.phone || order.mobileNumber || '—'}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">₹{order.revenueTotal || order.billTotal || 0}</td>
                      <td className="py-3.5 px-4 text-gray-500">{order.paymentMode || 'UPI General'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleStatusToggle(order.id, payStatus)}
                          className={`px-3 py-1 rounded-full font-semibold text-[11px] transition-all cursor-pointer ${
                            payStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          }`}
                        >
                          {payStatus === 'Paid' ? '✅ Paid' : '⏳ Pending'}
                        </button>
                      </td>
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