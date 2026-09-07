import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
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
          .filter(o => !o.deleted); // Exclude items sent to Recycle Bin
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

  // Soft Delete: Move order to Recycle Bin instead of permanent deletion
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
      showToast('Could not delete the order. Please try again.', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // Handle Packing Photo Upload (Base64 conversion for direct Firestore storage)
  const handlePackingPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !photoModalOrder) return;

    if (file.size > 1048576) { // 1MB limit check
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

  // AI OCR Slip Scanner Simulation (Extracts tracking numbers from slip image)
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
    <div className="p-4 max-w-7xl mx-auto space-y-4 text-sm">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Orders List ({filteredOrders.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage statuses, tracking IDs, packing photos, AI OCR slip scanner, and bulk updates.</p>
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
                <th className="py-3 px-4">TRACKING & AUTO-COPY</th>
                <th className="py-3 px-4">PACKING PHOTO</th>
                <th className="py-3 px-4">REVENUE / PROFIT</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr><td colSpan="9" className="text-center py-6 text-gray-400">Loading orders...</td></tr>
              ) : loadError ? (
                <tr><td colSpan="9" className="text-center py-6 text-rose-500">Could not load orders. Check your connection and try refreshing.</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-6 text-gray-400">No matching orders found.</td></tr>
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

                      <td className="py-3.5 px-4 space-y-1.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            defaultValue={order.trackingId || ''}
                            onBlur={(e) => handleTrackingIdChange(order.id, e.target.value)}
                            placeholder="Add Tracking ID"
                            className="border border-gray-200 rounded px-2 py-1 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-28 font-medium"
                            title="Click outside to save"
                          />
                          {order.trackingId && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(order.trackingId);
                                showToast(`Tracking ID ${order.trackingId} copied!`, 'success');
                                window.open('https://www.tpcindia.com/', '_blank');
                              }}
                              title="Copy Tracking ID & Open TPC Website"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px] transition-all flex items-center gap-0.5 whitespace-nowrap cursor-pointer"
                            >
                              <span>🌐 Auto-Copy & Track</span>
                            </button>
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => setScanModalOrder(order)}
                            className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold px-2 py-0.5 rounded border border-purple-100 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>🔍 AI Scan Slip</span>
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {order.packingPhotoUrl ? (
                          <div className="flex items-center gap-2">
                            <img src={order.packingPhotoUrl} alt="Packed" className="w-9 h-9 object-cover rounded-lg border border-gray-200 shadow-sm" />
                            <button
                              onClick={() => setPhotoModalOrder(order)}
                              className="text-[10px] text-blue-600 font-semibold hover:underline"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPhotoModalOrder(order)}
                            className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold px-2 py-1 rounded-lg border border-blue-100 transition-all cursor-pointer"
                          >
                            📸 Add Photo
                          </button>
                        )}
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
                          <button onClick={() => setConfirmDeleteId(order.id)} title="Move to Recycle Bin" aria-label="Delete order" className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-all cursor-pointer">🗑️</button>
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

      {/* Packing Photo Upload Modal */}
      {photoModalOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPhotoModalOrder(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-base">Packing Photo for #{photoModalOrder.orderId || photoModalOrder.id.slice(0, 6)}</h3>
            <p className="text-xs text-gray-500">Upload or capture the parcel photo before shipping.</p>

            {photoModalOrder.packingPhotoUrl && (
              <div className="my-2">
                <img src={photoModalOrder.packingPhotoUrl} alt="Existing Packing" className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm" />
              </div>
            )}

            <div className="space-y-2">
              <label className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl shadow-sm transition-all cursor-pointer">
                {uploadingPhoto ? 'Uploading...' : '📁 Choose / Capture Photo'}
                <input type="file" accept="image/*" onChange={handlePackingPhotoUpload} className="hidden" />
              </label>
              <button
                type="button"
                onClick={() => setPhotoModalOrder(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI OCR Slip Scanner Modal */}
      {scanModalOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !scanning && setScanModalOrder(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-base">AI OCR Slip Scanner</h3>
            <p className="text-xs text-gray-500">Take a photo of the courier receipt/slip. AI will automatically extract the tracking number and mark as shipped.</p>

            {scanning ? (
              <div className="py-10 space-y-3">
                <div className="inline-block animate-spin text-3xl">🔄</div>
                <p className="text-xs font-bold text-blue-600 animate-pulse">Scanning tracking slip & extracting digits...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-3 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2">
                  <span>📸 Capture / Upload Slip Image</span>
                  <input type="file" accept="image/*" onChange={handleScanSlipImage} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => setScanModalOrder(null)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
                  placeholder="e.g. TRC-BATCH-01 or leave blank"
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
            <h3 className="font-bold text-slate-800 mb-1">Move to Recycle Bin?</h3>
            <p className="text-xs text-slate-500 mb-4">This order will be moved to the Recycle Bin. You can restore it anytime.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer">Move to Bin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}