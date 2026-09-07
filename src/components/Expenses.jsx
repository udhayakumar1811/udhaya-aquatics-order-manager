import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function Expenses() {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [wholesaleOrders, setWholesaleOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('expense'); // 'expense' or 'wholesale'
  const [editingExpense, setEditingExpense] = useState(null);

  // Normal Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Travel / Fuel',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Wholesale Form State
  const [wholesaleForm, setWholesaleForm] = useState({
    supplierName: '',
    orderDate: new Date().toISOString().split('T')[0],
    courierName: 'The Professional Couriers',
    courierCharge: '',
    notes: '',
    items: [{ varietyName: '', quantity: '', unit: 'Pcs', pricePerUnit: '' }]
  });

  useEffect(() => {
    // Fetch normal expenses
    const expQuery = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubExpenses = onSnapshot(expQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        recordType: 'expense',
        ...doc.data()
      }));
      setExpenses(data);
    });

    // Fetch wholesale investments
    const wholesaleQuery = query(collection(db, 'wholesaleInvestments'), orderBy('orderDate', 'desc'));
    const unsubWholesale = onSnapshot(wholesaleQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const item = doc.data();
        return {
          id: doc.id,
          recordType: 'wholesale',
          date: item.orderDate || '',
          title: `Wholesale: ${item.supplierName} (${item.items?.length || 0} items)`,
          category: 'Stock Purchase (Wholesale)',
          amount: item.totalCost || 0,
          courierName: item.courierName,
          courierCharge: item.courierCharge,
          supplierName: item.supplierName,
          items: item.items,
          notes: `Courier: ${item.courierName} (₹${item.courierCharge || 0}) | ${item.notes || ''}`
        };
      });
      setWholesaleOrders(data);
      setLoading(false);
    });

    return () => {
      unsubExpenses();
      unsubWholesale();
    };
  }, []);

  // Expense Form Handlers
  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      title: '',
      category: 'Travel / Fuel',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setModalType('expense');
    setShowModal(true);
  };

  const handleOpenEditExpense = (exp) => {
    setEditingExpense(exp);
    setExpenseForm({
      title: exp.title || '',
      category: exp.category || 'Travel / Fuel',
      amount: exp.amount || '',
      date: exp.date || new Date().toISOString().split('T')[0],
      notes: exp.notes || ''
    });
    setModalType('expense');
    setShowModal(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await updateDoc(doc(db, 'expenses', editingExpense.id), {
          ...expenseForm,
          amount: Number(expenseForm.amount),
          updatedAt: serverTimestamp()
        });
        showToast('Expense updated successfully.', 'success');
      } else {
        await addDoc(collection(db, 'expenses'), {
          ...expenseForm,
          amount: Number(expenseForm.amount),
          createdAt: serverTimestamp()
        });
        showToast('Expense recorded successfully.', 'success');
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error saving expense: ", error);
      showToast('Could not save expense.', 'error');
    }
  };

  // Wholesale Form Handlers
  const handleOpenAddWholesale = () => {
    setWholesaleForm({
      supplierName: '',
      orderDate: new Date().toISOString().split('T')[0],
      courierName: 'The Professional Couriers',
      courierCharge: '',
      notes: '',
      items: [{ varietyName: '', quantity: '', unit: 'Pcs', pricePerUnit: '' }]
    });
    setModalType('wholesale');
    setShowModal(true);
  };

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

  const handleSaveWholesale = async (e) => {
    e.preventDefault();
    if (!wholesaleForm.supplierName.trim()) {
      showToast('Please enter supplier or farm name.', 'error');
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
        deleted: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'wholesaleInvestments'), payload);
      showToast('Wholesale investment order saved successfully!', 'success');
      setShowModal(false);
    } catch (err) {
      console.error("Error saving wholesale investment:", err);
      showToast('Could not save wholesale order.', 'error');
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        if (item.recordType === 'wholesale') {
          await deleteDoc(doc(db, 'wholesaleInvestments', item.id));
        } else {
          await deleteDoc(doc(db, 'expenses', item.id));
        }
        showToast('Record deleted.', 'success');
      } catch (error) {
        console.error("Error deleting record: ", error);
        showToast('Could not delete record.', 'error');
      }
    }
  };

  // Combine both records
  const allCombinedRecords = [...expenses, ...wholesaleOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalCombinedExpenses = allCombinedRecords.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 text-xs md:text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">Expenses & Wholesale Investments</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track petrol, travel, farm maintenance, and bulk wholesale stock procurement in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddExpense}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>💸 Add Expense</span>
          </button>
          <button
            onClick={handleOpenAddWholesale}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>📦 Add Wholesale Order</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL EXPENSES & INVESTMENTS</p>
          <h3 className="text-3xl font-extrabold text-rose-600 mt-2">₹{totalCombinedExpenses.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL RECORDS</p>
          <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{allCombinedRecords.length} Entries</h3>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading records...</div>
      ) : allCombinedRecords.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          No records found. Click "Add Expense" or "Add Wholesale Order" to start.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">TITLE / PURPOSE</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">NOTES / DETAILS</th>
                  <th className="py-3 px-4">AMOUNT</th>
                  <th className="py-3 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {allCombinedRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-gray-500">{item.date || '—'}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {item.title}
                      {item.recordType === 'wholesale' && (
                        <span className="ml-2 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">Wholesale</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-lg">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 truncate max-w-xs">{item.notes || '—'}</td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">₹{Number(item.amount || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.recordType === 'expense' && (
                          <button onClick={() => handleOpenEditExpense(item)} className="px-2.5 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg font-medium cursor-pointer">Edit</button>
                        )}
                        <button onClick={() => handleDelete(item)} className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-medium cursor-pointer">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Adding/Editing Expenses or Wholesale */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            
            {modalType === 'expense' ? (
              <>
                <h2 className="text-lg font-bold text-gray-900">{editingExpense ? 'Edit Business Expense' : 'Add Business Expense'}</h2>
                <form onSubmit={handleSaveExpense} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Expense Title *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={expenseForm.title}
                      onChange={handleExpenseChange}
                      placeholder="e.g. Petrol for Shop Visit, Farm Maintenance"
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                      <select
                        name="category"
                        value={expenseForm.category}
                        onChange={handleExpenseChange}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Travel / Fuel">Travel / Fuel (பெட்ரோல்/பஸ்)</option>
                        <option value="Stock Purchase">Stock Purchase (மீன் வாங்கியது)</option>
                        <option value="Courier / Transport">Courier / Transport (கூரியர்)</option>
                        <option value="Packing Materials">Packing Materials (பாக்ஸ்/கவர்)</option>
                        <option value="Farm Maintenance">Farm Maintenance (பராமரிப்பு)</option>
                        <option value="Other">Other (மற்றவை)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        name="amount"
                        min="1"
                        required
                        value={expenseForm.amount}
                        onChange={handleExpenseChange}
                        placeholder="e.g. 150"
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                    <input
                      type="date"
                      name="date"
                      required
                      value={expenseForm.date}
                      onChange={handleExpenseChange}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Details</label>
                    <textarea
                      name="notes"
                      rows="2"
                      value={expenseForm.notes}
                      onChange={handleExpenseChange}
                      placeholder="Additional details about this expense..."
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer">{editingExpense ? 'Update Expense' : 'Save Expense'}</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900">Add Wholesale Bulk Investment Order</h2>
                <form onSubmit={handleSaveWholesale} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Supplier / Farm Name *</label>
                      <input
                        type="text"
                        required
                        value={wholesaleForm.supplierName}
                        onChange={(e) => setWholesaleForm({ ...wholesaleForm, supplierName: e.target.value })}
                        placeholder="e.g. Kerala Guppy Farm"
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Order Date *</label>
                      <input
                        type="date"
                        required
                        value={wholesaleForm.orderDate}
                        onChange={(e) => setWholesaleForm({ ...wholesaleForm, orderDate: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Courier Service</label>
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
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Courier Charges (₹)</label>
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
                    <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer">Save Wholesale Order</button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}