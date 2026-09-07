import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function WholesaleInvestmentLog() {
  const { showToast } = useToast();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [supplierName, setSupplierName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [courierName, setCourierName] = useState('The Professional Couriers');
  const [courierCharge, setCourierCharge] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState([
    { varietyName: '', quantity: '', unit: 'Pcs', pricePerUnit: '' }
  ]);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'wholesaleInvestments'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvestments(data);
    } catch (err) {
      console.error("Error fetching wholesale investments:", err);
      showToast('Could not load wholesale records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { varietyName: '', quantity: '', unit: 'Pcs', pricePerUnit: '' }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const itemsSum = items.reduce((sum, item) => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.pricePerUnit) || 0;
      return sum + (q * p);
    }, 0);
    const courier = Number(courierCharge) || 0;
    return itemsSum + courier;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      showToast('Please enter supplier or farm name.', 'error');
      return;
    }

    try {
      const totalCost = calculateTotal();
      const payload = {
        supplierName,
        orderDate,
        courierName,
        courierCharge: Number(courierCharge) || 0,
        items,
        totalCost,
        notes,
        deleted: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'wholesaleInvestments'), payload);
      showToast('Wholesale investment order saved successfully!', 'success');
      
      setSupplierName('');
      setCourierCharge('');
      setNotes('');
      setItems([{ varietyName: '', quantity: '', unit: 'Pcs', pricePerUnit: '' }]);
      setShowForm(false);
      fetchInvestments();
    } catch (err) {
      console.error("Error saving wholesale investment:", err);
      showToast('Could not save order.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Move this wholesale order to Recycle Bin?')) return;
    try {
      await updateDoc(doc(db, 'wholesaleInvestments', id), { deleted: true, deletedAt: new Date().toISOString() });
      showToast('Moved to Recycle Bin.', 'success');
      fetchInvestments();
    } catch (err) {
      console.error("Error deleting record:", err);
      showToast('Could not delete record.', 'error');
    }
  };

  const activeInvestments = investments.filter(inv => !inv.deleted);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 text-xs md:text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">📦 Wholesale & Bulk Purchase Investments</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track multi-item farm procurement, courier charges, and supplier orders in card format.</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>{showForm ? '✕ Close Form' : '➕ Add New Wholesale Order'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-md border border-blue-100 space-y-5">
          <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider pb-2 border-b border-gray-100">
            Record New Wholesale Procurement / Investment
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supplier / Farm Name *</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Kerala Guppy Farm / Breeder"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Order Date *</label>
                <input
                  type="date"
                  required
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Courier Service</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white font-medium"
                >
                  <option value="The Professional Couriers">The Professional Couriers (TPC)</option>
                  <option value="DTDC Express">DTDC Express</option>
                  <option value="Bus / Parcel Service">Bus / Parcel Service</option>
                  <option value="Direct Farm Pickup">Direct Farm Pickup</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Courier Charges (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={courierCharge}
                  onChange={(e) => setCourierCharge(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white font-semibold"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Ordered Items List</span>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-lg border border-purple-200 cursor-pointer"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <input
                      type="text"
                      required
                      placeholder="Variety / Item Name (e.g. Full Gold Guppy / 4mm Feed)"
                      value={item.varietyName}
                      onChange={(e) => handleItemChange(index, 'varietyName', e.target.value)}
                      className="flex-1 p-2 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-24 p-2 border border-gray-200 rounded-lg text-xs bg-white font-semibold"
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      className="w-28 p-2 border border-gray-200 rounded-lg text-xs bg-white font-medium"
                    >
                      <option value="Pcs">Pcs (பீஸ்)</option>
                      <option value="Pairs">Pairs (ஜோடி)</option>
                      <option value="Kg">Kg (கிலோ)</option>
                      <option value="Packets">Packets</option>
                      <option value="Tubs">Tubs</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Price per unit (₹)"
                      value={item.pricePerUnit}
                      onChange={(e) => handleItemChange(index, 'pricePerUnit', e.target.value)}
                      className="w-32 p-2 border border-gray-200 rounded-lg text-xs bg-white font-semibold text-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Health condition, payment remarks..."
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                />
              </div>

              <div className="flex items-center justify-between bg-blue-50/50 px-4 py-2.5 rounded-xl border border-blue-100">
                <span className="font-bold text-gray-700 text-xs uppercase">Total Calculated Cost:</span>
                <span className="font-extrabold text-blue-700 text-base">₹{calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
              >
                Save Wholesale Order
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">Loading wholesale investments...</div>
      ) : activeInvestments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 space-y-2">
          <p className="text-3xl">📦</p>
          <p className="font-medium">No wholesale orders recorded yet. Click "Add New Wholesale Order" to start.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeInvestments.map((inv) => (
            <div key={inv.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border border-blue-100">
                    📅 {inv.orderDate || '—'}
                  </span>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
                <h3 className="font-bold text-gray-900 text-base pt-1">{inv.supplierName}</h3>
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                  <span>🚚 {inv.courierName}</span>
                  {inv.courierCharge > 0 && <span className="text-purple-600 font-semibold">(₹{inv.courierCharge} courier)</span>}
                </div>
              </div>

              <div className="space-y-2 border-t border-b border-gray-100 py-3">
                <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Purchased Items ({inv.items?.length || 0})</div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {inv.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-gray-50/70 p-2 rounded-xl">
                      <span className="font-medium text-gray-800">{item.varietyName}</span>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">{item.quantity} {item.unit}</span>
                        <span className="text-emerald-600 font-semibold ml-2">₹{(Number(item.quantity) * Number(item.pricePerUnit)).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {inv.notes && (
                  <p className="text-[11px] text-gray-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                    💬 {inv.notes}
                  </p>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Invested:</span>
                  <span className="font-extrabold text-emerald-600 text-lg">₹{(inv.totalCost || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}