import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function Expenses() {
  const { showToast } = useToast();
  const [wholesaleOrders, setWholesaleOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const [wholesaleForm, setWholesaleForm] = useState({
    supplierName: '',
    orderDate: new Date().toISOString().split('T')[0],
    courierName: 'The Professional Couriers',
    courierCharge: '',
    notes: '',
    items: [{ varietyName: '', quantity: '', unit: 'Pcs', pricePerUnit: '' }]
  });

  useEffect(() => {
    const wholesaleQuery = query(collection(db, 'wholesaleInvestments'), orderBy('orderDate', 'desc'));
    const unsubWholesale = onSnapshot(wholesaleQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const item = doc.data();
        return {
          id: doc.id,
          date: item.orderDate || '',
          supplierName: item.supplierName || '',
          courierName: item.courierName || '',
          courierCharge: item.courierCharge || 0,
          items: item.items || [],
          totalCost: item.totalCost || 0,
          notes: item.notes || ''
        };
      });
      setWholesaleOrders(data);
      setLoading(false);
    });

    return () => unsubWholesale();
  }, []);

  const handleItemChange = (index, field, value) => {
    const updated = [...wholesaleForm.items];
    updated[index][field] = value;
    setWholesaleForm(prev => ({ ...prev, items: updated }));
  };

  const addItemRow = () => {
    setWholesaleForm(prev => ({
      ...prev,
      items: [...prev.items, { varietyName: '', quantity: '', unit: 'Pcs', pricePerUnit: '' }]
    }));
  };

  const removeItemRow = (index) => {
    if (wholesaleForm.items.length === 1) return;
    setWholesaleForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateWholesaleTotal = () => {
    const itemsSum = wholesaleForm.items.reduce((sum, item) => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.pricePerUnit) || 0;
      return sum + (q * p);
    }, 0);
    const courier = Number(wholesaleForm.courierCharge) || 0;
    return itemsSum + courier;
  };

  const handleOpenAdd = () => {
    setEditingExpenseId(null);
    setWholesaleForm({
      supplierName: '',
      orderDate: new Date().toISOString().split('T')[0],
      courierName: 'The Professional Couriers',
      courierCharge: '',
      notes: '',
      items: [{ varietyName: '', quantity: '', unit: 'Pcs', pricePerUnit: '' }]
    });
    setShowModal(true);
  };

  const handleOpenEdit = (order) => {
    setEditingExpenseId(order.id);
    setWholesaleForm({
      supplierName: order.supplierName || '',
      orderDate: order.date || new Date().toISOString().split('T')[0],
      courierName: order.courierName || 'The Professional Couriers',
      courierCharge: order.courierCharge || '',
      notes: order.notes || '',
      items: order.items && order.items.length > 0 ? order.items : [{ varietyName: '', quantity: '', unit: 'Pcs', pricePerUnit: '' }]
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!wholesaleForm.supplierName.trim()) {
      showToast('Please enter supplier or expense title name.', 'error');
      return;
    }

    try {
      const totalCost = calculateWholesaleTotal();
      const payload = {
        supplierName: wholesaleForm.supplierName,
        orderDate: wholesaleForm.orderDate,
        courierName: wholesaleForm.courierName,
        courierCharge: Number(wholesaleForm.courierCharge) || 0,
        items: wholesaleForm.items,
        totalCost,
        notes: wholesaleForm.notes,
        updatedAt: serverTimestamp()
      };

      if (editingExpenseId) {
        await updateDoc(doc(db, 'wholesaleInvestments', editingExpenseId), payload);
        showToast('Expense updated successfully!', 'success');
      } else {
        payload.createdAt = serverTimestamp();
        payload.deleted = false;
        await addDoc(collection(db, 'wholesaleInvestments'), payload);
        showToast('Expense added successfully!', 'success');
      }

      setShowModal(false);
      setEditingExpenseId(null);
    } catch (err) {
      console.error("Error saving expense:", err);
      showToast('Could not save expense record.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense record?")) {
      try {
        await deleteDoc(doc(db, 'wholesaleInvestments', id));
        showToast('Record deleted successfully.', 'success');
      } catch (error) {
        console.error("Error deleting record: ", error);
        showToast('Could not delete record.', 'error');
      }
    }
  };

  const totalExpensesAmount = wholesaleOrders.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 text-xs md:text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">Expenses & Stock Investments</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track multi-item farm procurement, items, courier charges, and expenses.</p>
        </div>
        <div>
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>➕ Add Expense</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL EXPENSES</p>
          <h3 className="text-3xl font-extrabold text-blue-600 mt-2">₹{totalExpensesAmount.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL RECORDS</p>
          <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{wholesaleOrders.length} Entries</h3>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading records...</div>
      ) : wholesaleOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          No records found. Click "Add Expense" to start.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">SUPPLIER / TITLE</th>
                  <th className="py-3 px-4">ITEMS PURCHASED</th>
                  <th className="py-3 px-4">COURIER / NOTES</th>
                  <th className="py-3 px-4">AMOUNT</th>
                  <th className="py-3 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {wholesaleOrders.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-gray-500">{item.date || '—'}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{item.supplierName}</td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {item.items?.map((i, idx) => (
                        <div key={idx}>• {i.varietyName} ({i.quantity} {i.unit} @ ₹{i.pricePerUnit})</div>
                      ))}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {item.courierName} {item.courierCharge > 0 && `(₹${item.courierCharge})`} {item.notes && `- ${item.notes}`}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">₹{Number(item.totalCost || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleOpenEdit(item)} className="px-2.5 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg font-medium cursor-pointer">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-medium cursor-pointer">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">{editingExpenseId ? 'Edit Expense Record' : 'Add New Expense'}</h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Supplier / Expense Title *</label>
                  <input
                    type="text"
                    required
                    value={wholesaleForm.supplierName}
                    onChange={(e) => setWholesaleForm({ ...wholesaleForm, supplierName: e.target.value })}
                    placeholder="e.g. Kerala Guppy Farm / Feed Purchase"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={wholesaleForm.orderDate}
                    onChange={(e) => setWholesaleForm({ ...wholesaleForm, orderDate: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Courier / Transport Service</label>
                  <select
                    value={wholesaleForm.courierName}
                    onChange={(e) => setWholesaleForm({ ...wholesaleForm, courierName: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                  >
                    <option value="The Professional Couriers">The Professional Couriers (TPC)</option>
                    <option value="DTDC Express">DTDC Express</option>
                    <option value="Bus / Parcel Service">Bus / Parcel Service</option>
                    <option value="Direct Farm Pickup">Direct Farm Pickup</option>
                    <option value="Direct Shop">Direct Shop</option>
                    <option value="None">None / Direct Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Courier / Transport Charges (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={wholesaleForm.courierCharge}
                    onChange={(e) => setWholesaleForm({ ...wholesaleForm, courierCharge: e.target.value })}
                    placeholder="e.g. 150"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-800 uppercase">Ordered Items List</span>
                  <button type="button" onClick={addItemRow} className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-lg border border-purple-200 cursor-pointer">+ Add Item</button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {wholesaleForm.items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <input
                        type="text"
                        required
                        placeholder="Variety / Item Name"
                        value={item.varietyName}
                        onChange={(e) => handleItemChange(index, 'varietyName', e.target.value)}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-xs bg-white"
                      />
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-20 p-2 border border-gray-200 rounded-lg text-xs bg-white font-semibold"
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-24 p-2 border border-gray-200 rounded-lg text-xs bg-white"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Pairs">Pairs</option>
                        <option value="Kg">Kg</option>
                        <option value="Packets">Packets</option>
                        <option value="Tubs">Tubs</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="Price/unit (₹)"
                        value={item.pricePerUnit}
                        onChange={(e) => handleItemChange(index, 'pricePerUnit', e.target.value)}
                        className="w-28 p-2 border border-gray-200 rounded-lg text-xs bg-white font-semibold text-emerald-600"
                      />
                      <button type="button" onClick={() => removeItemRow(index)} className="text-rose-500 font-bold px-2 py-1 cursor-pointer">🗑️</button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  value={wholesaleForm.notes}
                  onChange={(e) => setWholesaleForm({ ...wholesaleForm, notes: e.target.value })}
                  placeholder="Payment remarks..."
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                />
              </div>

              <div className="flex items-center justify-between bg-blue-50/50 px-4 py-2.5 rounded-xl border border-blue-100">
                <span className="font-bold text-gray-700 text-xs uppercase">Total Calculated Cost:</span>
                <span className="font-extrabold text-blue-700 text-base">₹{calculateWholesaleTotal().toLocaleString()}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer">
                  {editingExpenseId ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}