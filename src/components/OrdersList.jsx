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

  // Bulk selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('Shipped');
  const [bulkTrackingId, setBulkTrackingId] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

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
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus, orderStatus: newStatus });
      showToast(`Order marked as ${newStatus}.`, 'success');
    } catch (error) {
      console.error("Error updating status: ", error);
      showToast('Could not update the order status. Please try again.', 'error');
    }
  };

  const handleTrackingIdChange = async (orderId, newTrackingId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { trackingId: newTrackingId });
      showToast('Tracking ID updated.', 'success');
    } catch (error) {
      console.error("Error updating tracking ID: ", error);
      showToast('Could not update tracking ID.', 'error');
    }
  };

  const handleDelete = async (orderId) => {
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(item => item !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedOrderIds.length === 0) {
      showToast('Please select at least one order.', 'error');
      return;
    }

    try {
      for (const orderId of selectedOrderIds) {
        const orderRef = doc(db, 'orders', orderId);
        const updatePayload = { status: bulkStatus, orderStatus: bulkStatus };
        if (bulkTrackingId.trim()) {
          updatePayload.trackingId = bulkTrackingId.trim();
        }
        await updateDoc(orderRef, updatePayload);
      }
      showToast(`Successfully updated ${selectedOrderIds.length} orders!`, 'success');
      setShowBulkModal(false);
      setSelectedOrderIds([]);
      setBulkTrackingId('');
    } catch (error) {
      console.error("Error in bulk update: ", error);
      showToast('Could not complete bulk update.', 'error');
    }
  };

  const exportToCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,Order ID,Date,Customer Name,Phone,Address,Tracking ID,Total,Profit,Status\n";
    orders.forEach(o => {
      csvContent += `"${o.orderId || o.id}","${o.date || ''}","${o.customerName || ''}","${o.phone || o.mobileNumber || ''}","${o.address || o.fullAddress || ''}","${o.trackingId || ''}","${o.revenueTotal || o.billTotal || 0}","${o.netProfit || 0}","${o.status || o.orderStatus || 'Pending'}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "udhaya_aquatics_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders exported.', 'success');
  };

  const filteredOrders = orders.filter(o =>
    (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (o.orderId && o.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    ((o.phone || o.mobileNumber) && (o.phone || o.mobileNumber).includes(searchTerm)) ||
    (o.trackingId && o.trackingId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 text-sm">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Orders List ({filteredOrders.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage statuses, tracking IDs, print stickers, or perform bulk courier updates.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {selectedOrderIds.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer animate-pulse"
            >
              <span>⚡ Bulk Update ({selectedOrderIds.length})</span>
            </button>
          )}

          <button
            onClick={exportToCsv}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span>📊 Export CSV</span>
          </button>

          <input
            type="text"
            placeholder="Search orders, phone, tracking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search orders"
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">ORDER ID & DATE</th>
                <th className="py-3 px-4">CUSTOMER & PIN</th>
                <th className="py-3 px-4">ITEMS</th>
                <th className="py-3 px-4">TRACKING ID</th>
                <th className="py-3 px-4">REVENUE / PROFIT</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-6 text-gray-400">Loading orders...</td></tr>
              ) : loadError ? (
                <tr><td colSpan="8" className="text-center py-6 text-rose-500">Could not load orders. Check your connection and try refreshing.</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-6 text-gray-400">No matching orders found.</td></tr>
              ) : (
                filteredOrders.map((order) => {
                  const currentStatus = order.status || order.orderStatus || 'Pending';
                  const isSelected = selectedOrderIds.includes(order.id);
                  return (
                    <tr key={order.id} className={`transition-colors ${isSelected ? 'bg-blue-50/40' : 'hover:bg-gray-50/50'}`}>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(order.id)}
                          className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-blue-600">{order.orderId || order.id.slice(0, 6)}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{order.date || '—'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-[11px] text-gray-400">{order.phone || order.mobileNumber}</div>
                        <div className="text-[11px] text-blue-600 font-medium">{order.city} ({order.pincode})</div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                        {order.itemsSummary || (order.items && order.items[0]?.varietyName) || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          defaultValue={order.trackingId || ''}
                          onBlur={(e) => handleTrackingIdChange(order.id, e.target.value)}
                          placeholder="Add Tracking ID"
                          className="border border-gray-200 rounded px-2 py-1 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-28 font-medium"
                          title="Click outside to save"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">₹{order.revenueTotal || order.billTotal || 0}</div>
                        <div className="text-[11px] font-semibold text-emerald-600">Profit: ₹{order.netProfit || 0}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          aria-label={`Change status for order ${order.orderId || order.id}`}
                          className={`border rounded-lg px-2 py-1 text-[11px] font-medium focus:outline-none cursor-pointer ${
                            currentStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            currentStatus === 'Shipped' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            currentStatus === 'Packed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
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
                          <button onClick={() => onOpenSticker && onOpenSticker(order)} title="Print Sticker" aria-label="Print shipping sticker" className="w-7 h-7 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center transition-all cursor-pointer">📦</button>
                          <button onClick={() => onViewOrder && onViewOrder(order)} title="View Order" aria-label="View order details" className="w-7 h-7 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center transition-all cursor-pointer">👁️</button>
                          <button onClick={() => onEditOrder && onEditOrder(order)} title="Edit Order" aria-label="Edit order" className="w-7 h-7 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center transition-all cursor-pointer">✏️</button>
                          <button onClick={() => setConfirmDeleteId(order.id)} title="Delete Order" aria-label="Delete order" className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-all cursor-pointer">🗑️</button>
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

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBulkModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">Bulk Update Orders ({selectedOrderIds.length} Selected)</h2>
            <p className="text-xs text-gray-500">Apply status change or common tracking details to all selected orders at once.</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Target Status</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Pending">Pending</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Common Tracking ID / Remarks (Optional)</label>
                <input
                  type="text"
                  value={bulkTrackingId}
                  onChange={(e) => setBulkTrackingId(e.target.value)}
                  placeholder="e.g. DTDC-BATCH-SEP07 or leave blank"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkUpdate}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
              >
                Apply to {selectedOrderIds.length} Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-xl shadow-xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 mb-1">Delete this order?</h3>
            <p className="text-xs text-slate-500 mb-4">This can't be undone. The order will be permanently removed.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}