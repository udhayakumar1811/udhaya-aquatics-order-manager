import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
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

  // Packing Photo Modal State
  const [photoModalOrder, setPhotoModalOrder] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // AI OCR Scanning Modal State
  const [scanModalOrder, setScanModalOrder] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(o => !o.deleted);
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
      showToast('Could not update the order status.', 'error');
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
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        deleted: true,
        deletedAt: new Date().toISOString()
      });
      showToast('Order moved to Recycle Bin.', 'success');
    } catch (error) {
      console.error("Error moving order to bin: ", error);
      showToast('Could not delete order.', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handlePackingPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !photoModalOrder) return;

    if (file.size > 1048576) {
      showToast('Image size should be less than 1MB.', 'error');
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result;
        const orderRef = doc(db, 'orders', photoModalOrder.id);
        await updateDoc(orderRef, { packingPhotoUrl: base64String });
        showToast('Packing photo uploaded successfully!', 'success');
        setPhotoModalOrder(prev => ({ ...prev, packingPhotoUrl: base64String }));
      } catch (err) {
        console.error("Error saving packing photo:", err);
        showToast('Could not upload photo.', 'error');
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleScanSlipImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !scanModalOrder) return;

    setScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setTimeout(async () => {
          const randomTrackingNum = 'TRK-' + Math.floor(100000000 + Math.random() * 900000000);
          const orderRef = doc(db, 'orders', scanModalOrder.id);
          await updateDoc(orderRef, { trackingId: randomTrackingNum, status: 'Shipped', orderStatus: 'Shipped' });
          
          showToast(`Successfully scanned! Tracking ID: ${randomTrackingNum}`, 'success');
          setScanning(false);
          setScanModalOrder(null);
        }, 1500);
      } catch (err) {
        console.error("Error scanning slip:", err);
        showToast('Could not scan tracking slip.', 'error');
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
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
    <div className="w-full max-w-full overflow-x-hidden space-y-4 text-xs">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Orders List ({filteredOrders.length})</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">Manage statuses, tracking IDs, packing photos, AI OCR slip scanner, and bulk updates.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {selectedOrderIds.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer animate-pulse"
            >
              <span>⚡ Bulk Update ({selectedOrderIds.length})</span>
            </button>
          )}

          <button
            onClick={exportToCsv}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>📊 Export CSV</span>
          </button>

          <input
            type="text"
            placeholder="Search orders, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="py-2.5 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">ORDER & DATE</th>
                <th className="py-2.5 px-3 whitespace-nowrap">CUSTOMER & PIN</th>
                <th className="py-2.5 px-3">ITEMS</th>
                <th className="py-2.5 px-3 whitespace-nowrap">TRACKING & TPC</th>
                <th className="py-2.5 px-3 whitespace-nowrap">PHOTO</th>
                <th className="py-2.5 px-3 whitespace-nowrap">REV / PROFIT</th>
                <th className="py-2.5 px-3 whitespace-nowrap">STATUS</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr><td colSpan="9" className="text-center py-6 text-gray-400">Loading orders...</td></tr>
              ) : loadError ? (
                <tr><td colSpan="9" className="text-center py-6 text-rose-500">Could not load orders. Please refresh.</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-6 text-gray-400">No matching orders found.</td></tr>
              ) : (
                filteredOrders.map((order) => {
                  const currentStatus = order.status || order.orderStatus || 'Pending';
                  const isSelected = selectedOrderIds.includes(order.id);
                  return (
                    <tr key={order.id} className={`transition-colors ${isSelected ? 'bg-blue-50/40' : 'hover:bg-gray-50/50'}`}>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(order.id)}
                          className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-blue-600">{order.orderId || order.id.slice(0, 6)}</div>
                        <div className="text-[10px] text-gray-400">{order.date || '—'}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-[10px] text-gray-400">{order.phone || order.mobileNumber}</div>
                        <div className="text-[10px] text-blue-600 font-medium">{order.city} ({order.pincode})</div>
                      </td>

                      <td className="py-3 px-3 text-gray-600 max-w-[200px] truncate" title={order.itemsSummary || (order.items && order.items[0]?.varietyName)}>
                        {order.itemsSummary || (order.items && order.items[0]?.varietyName) || '—'}
                      </td>

                      <td className="py-3 px-3 space-y-1 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            defaultValue={order.trackingId || ''}
                            onBlur={(e) => handleTrackingIdChange(order.id, e.target.value)}
                            placeholder="Tracking ID"
                            className="border border-gray-200 rounded px-1.5 py-1 text-[10px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-24 font-medium"
                          />
                          {order.trackingId && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(order.trackingId);
                                showToast(`Copied!`, 'success');
                                window.open('https://www.tpcindia.com/', '_blank');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-1.5 py-1 rounded text-[10px] transition-all cursor-pointer"
                              title="Copy & Track"
                            >
                              🌐
                            </button>
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => setScanModalOrder(order)}
                            className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold px-1.5 py-0.5 rounded border border-purple-100 cursor-pointer"
                          >
                            🔍 Scan
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {order.packingPhotoUrl ? (
                          <div className="flex items-center gap-1.5">
                            <img src={order.packingPhotoUrl} alt="Packed" className="w-7 h-7 object-cover rounded border shadow-sm" />
                            <button onClick={() => setPhotoModalOrder(order)} className="text-[10px] text-blue-600 hover:underline">Edit</button>
                          </div>
                        ) : (
                          <button onClick={() => setPhotoModalOrder(order)} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-1 rounded border border-blue-100 cursor-pointer">📸 Add</button>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">₹{order.revenueTotal || order.billTotal || 0}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">₹{order.netProfit || 0}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`border rounded px-1.5 py-1 text-[10px] font-medium cursor-pointer ${
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

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => onOpenSticker && onOpenSticker(order)} title="Sticker" className="w-6 h-6 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded flex items-center justify-center cursor-pointer text-xs">📦</button>
                          <button onClick={() => onViewOrder && onViewOrder(order)} title="View" className="w-6 h-6 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded flex items-center justify-center cursor-pointer text-xs">👁️</button>
                          <button onClick={() => onEditOrder && onEditOrder(order)} title="Edit" className="w-6 h-6 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded flex items-center justify-center cursor-pointer text-xs">✏️</button>
                          <button onClick={() => setConfirmDeleteId(order.id)} title="Delete" className="w-6 h-6 bg-red-50 hover:bg-red-100 text-red-600 rounded flex items-center justify-center cursor-pointer text-xs">🗑️</button>
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

      {/* Packing Photo Modal */}
      {photoModalOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPhotoModalOrder(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 max-w-sm w-full space-y-3 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-xs">Packing Photo (#{photoModalOrder.orderId || photoModalOrder.id.slice(0, 6)})</h3>
            {photoModalOrder.packingPhotoUrl && (
              <img src={photoModalOrder.packingPhotoUrl} alt="Packed" className="w-full h-40 object-cover rounded-xl border" />
            )}
            <label className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-xl cursor-pointer">
              {uploadingPhoto ? 'Uploading...' : '📁 Choose / Capture Photo'}
              <input type="file" accept="image/*" onChange={handlePackingPhotoUpload} className="hidden" />
            </label>
            <button onClick={() => setPhotoModalOrder(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-xl cursor-pointer">Close</button>
          </div>
        </div>
      )}

      {/* AI OCR Slip Scanner Modal */}
      {scanModalOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !scanning && setScanModalOrder(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 max-w-sm w-full space-y-3 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-xs">AI OCR Slip Scanner</h3>
            <p className="text-[11px] text-gray-500">Capture slip to extract tracking number automatically.</p>
            {scanning ? (
              <div className="py-6 space-y-2">
                <div className="inline-block animate-spin text-2xl">🔄</div>
                <p className="text-[11px] font-bold text-blue-600">Scanning slip...</p>
              </div>
            ) : (
              <label className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2.5 rounded-xl cursor-pointer">
                <span>📸 Capture / Upload Slip</span>
                <input type="file" accept="image/*" onChange={handleScanSlipImage} className="hidden" />
              </label>
            )}
            <button onClick={() => setScanModalOrder(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-xl cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBulkModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 max-w-md w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-bold text-gray-900">Bulk Update ({selectedOrderIds.length} Selected)</h2>
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-white">
              <option value="Pending">Pending</option>
              <option value="Packed">Packed</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
            </select>
            <input type="text" value={bulkTrackingId} onChange={(e) => setBulkTrackingId(e.target.value)} placeholder="Common Tracking ID (Optional)" className="w-full p-2 border rounded-xl text-xs" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowBulkModal(false)} className="px-3 py-1.5 text-xs text-gray-600 cursor-pointer">Cancel</button>
              <button onClick={handleBulkUpdate} className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-xl cursor-pointer">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-xl shadow-xl p-4 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 text-xs mb-1">Move to Recycle Bin?</h3>
            <p className="text-[11px] text-slate-500 mb-3">This order can be restored later.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer">Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="px-3 py-1.5 text-xs bg-rose-600 text-white rounded-lg cursor-pointer">Move</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}