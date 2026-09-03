<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function OrdersList({ onEditOrder, onViewOrder, onOpenSticker }) {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
=======
import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function OrdersList({ onEditOrder, onViewOrder, onOpenSticker }) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
        setLoading(false);
        setLoadError(false);
      },
      (error) => {
        console.error('Error loading orders: ', error);
        setLoading(false);
        setLoadError(true);
      }
    );
>>>>>>> claude-upgrade
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus, orderStatus: newStatus });
<<<<<<< HEAD
    } catch (error) {
      console.error("Error updating status: ", error);
=======
      showToast(`Order marked as ${newStatus}.`, 'success');
    } catch (error) {
      console.error("Error updating status: ", error);
      showToast('Could not update the order status. Please try again.', 'error');
>>>>>>> claude-upgrade
    }
  };

  const handleDelete = async (orderId) => {
<<<<<<< HEAD
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
      } catch (error) {
        console.error("Error deleting order: ", error);
      }
    }
  };

  const exportToExcel = () => {
=======
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      showToast('Order deleted.', 'success');
    } catch (error) {
      console.error("Error deleting order: ", error);
      showToast('Could not delete the order. Please try again.', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const exportToCsv = () => {
>>>>>>> claude-upgrade
    let csvContent = "data:text/csv;charset=utf-8,Order ID,Date,Customer Name,Phone,Address,Items,Total,Profit,Status\n";
    orders.forEach(o => {
      csvContent += `"${o.orderId || o.id}","${o.date || ''}","${o.customerName || ''}","${o.phone || o.mobileNumber || ''}","${o.address || o.fullAddress || ''}","${o.itemsSummary || ''}","${o.revenueTotal || o.billTotal || 0}","${o.netProfit || 0}","${o.status || o.orderStatus || 'Pending'}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "udhaya_aquatics_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
<<<<<<< HEAD
  };

  const filteredOrders = orders.filter(o => 
=======
    showToast('Orders exported.', 'success');
  };

  const filteredOrders = orders.filter(o =>
>>>>>>> claude-upgrade
    (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (o.orderId && o.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    ((o.phone || o.mobileNumber) && (o.phone || o.mobileNumber).includes(searchTerm))
  );

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 text-sm">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Orders List ({filteredOrders.length})</h1>
<<<<<<< HEAD
          <p className="text-xs text-gray-500 mt-0.5">Edit tracking IDs, print bills, or view net profit.</p>
=======
          <p className="text-xs text-gray-500 mt-0.5">Edit tracking IDs, print stickers, or view net profit.</p>
>>>>>>> claude-upgrade
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
<<<<<<< HEAD
            onClick={exportToExcel}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>📊 Export Excel (.xlsx)</span>
=======
            onClick={exportToCsv}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>📊 Export CSV</span>
>>>>>>> claude-upgrade
          </button>

          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
<<<<<<< HEAD
=======
            aria-label="Search orders"
>>>>>>> claude-upgrade
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-4">ORDER ID</th>
                <th className="py-3 px-4">CUSTOMER & PIN</th>
                <th className="py-3 px-4">ITEMS</th>
                <th className="py-3 px-4">REVENUE TOTAL</th>
                <th className="py-3 px-4">NET PROFIT</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-6 text-gray-400">Loading orders...</td></tr>
<<<<<<< HEAD
=======
              ) : loadError ? (
                <tr><td colSpan="7" className="text-center py-6 text-rose-500">Could not load orders. Check your connection and try refreshing.</td></tr>
>>>>>>> claude-upgrade
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-6 text-gray-400">No matching orders found.</td></tr>
              ) : (
                filteredOrders.map((order) => {
                  const currentStatus = order.status || order.orderStatus || 'Pending';
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-blue-600">{order.orderId || order.id.slice(0, 6)}</div>
<<<<<<< HEAD
                        <div className="text-[11px] text-gray-400 mt-0.5">{order.date || '2026-08-22'}</div>
=======
                        <div className="text-[11px] text-gray-400 mt-0.5">{order.date || '—'}</div>
>>>>>>> claude-upgrade
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-[11px] text-gray-400">{order.phone || order.mobileNumber}</div>
                        <div className="text-[11px] text-blue-600 font-medium">{order.city} ({order.pincode})</div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
<<<<<<< HEAD
                        {order.itemsSummary || (order.items && order.items[0]?.varietyName) || 'Guppies Pair'}
=======
                        {order.itemsSummary || (order.items && order.items[0]?.varietyName) || '—'}
>>>>>>> claude-upgrade
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        ₹{order.revenueTotal || order.billTotal || 0}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-emerald-600">
                        ₹{order.netProfit || 0}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
<<<<<<< HEAD
=======
                          aria-label={`Change status for order ${order.orderId || order.id}`}
>>>>>>> claude-upgrade
                          className={`border rounded-lg px-2 py-1 text-[11px] font-medium focus:outline-none ${
                            currentStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            currentStatus === 'Shipped' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
<<<<<<< HEAD
                          <button onClick={() => onOpenSticker && onOpenSticker(order)} title="Print Sticker" className="w-7 h-7 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center transition-all">📦</button>
                          <button onClick={() => onViewOrder && onViewOrder(order)} title="View Order" className="w-7 h-7 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center transition-all">👁️</button>
                          <button onClick={() => onEditOrder && onEditOrder(order)} title="Edit Order" className="w-7 h-7 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center transition-all">✏️</button>
                          <button onClick={() => handleDelete(order.id)} title="Delete Order" className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-all">🗑️</button>
=======
                          <button onClick={() => onOpenSticker && onOpenSticker(order)} title="Print Sticker" aria-label="Print shipping sticker" className="w-7 h-7 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center transition-all">📦</button>
                          <button onClick={() => onViewOrder && onViewOrder(order)} title="View Order" aria-label="View order details" className="w-7 h-7 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center transition-all">👁️</button>
                          <button onClick={() => onEditOrder && onEditOrder(order)} title="Edit Order" aria-label="Edit order" className="w-7 h-7 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center transition-all">✏️</button>
                          <button onClick={() => setConfirmDeleteId(order.id)} title="Delete Order" aria-label="Delete order" className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-all">🗑️</button>
>>>>>>> claude-upgrade
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
<<<<<<< HEAD
    </div>
  );
}
=======

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-xl shadow-xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 mb-1">Delete this order?</h3>
            <p className="text-xs text-slate-500 mb-4">This can't be undone. The order will be permanently removed.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
>>>>>>> claude-upgrade
