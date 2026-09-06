import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function Inventory() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Fish Variety',
    stockQty: '',
    unit: 'Pairs',
    costPrice: '',
    sellingPrice: ''
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stockQty' || name === 'costPrice' || name === 'sellingPrice' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      itemName: '',
      category: 'Fish Variety',
      stockQty: '',
      unit: 'Pairs',
      costPrice: '',
      sellingPrice: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName || '',
      category: item.category || 'Fish Variety',
      stockQty: item.stockQty ?? '',
      unit: item.unit || 'Pairs',
      costPrice: item.costPrice ?? '',
      sellingPrice: item.sellingPrice ?? ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        stockQty: Number(formData.stockQty) || 0,
        costPrice: Number(formData.costPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
      };

      if (editingItem) {
        await updateDoc(doc(db, 'inventory', editingItem.id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
        showToast('Inventory item updated successfully.', 'success');
      } else {
        await addDoc(collection(db, 'inventory'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        showToast('New inventory item added.', 'success');
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error saving inventory item: ", error);
      showToast('Error saving item. Please try again.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item from inventory?")) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
        showToast('Item deleted.', 'success');
      } catch (error) {
        console.error("Error deleting inventory item: ", error);
        showToast('Could not delete item.', 'error');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Udhaya Aquatics Inventory & Stock</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage fish varieties, combos, medicines, feeds, and live stock tracking.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <span>➕ Add New Stock Item</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading inventory...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          No stock items added yet. Click "Add New Stock Item" to start tracking your fish, feeds, and medicines.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">ITEM NAME</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">CURRENT STOCK</th>
                  <th className="py-3 px-4">COST PRICE (₹)</th>
                  <th className="py-3 px-4">SELLING PRICE (₹)</th>
                  <th className="py-3 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{item.itemName}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-lg">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold px-2.5 py-1 rounded-lg ${Number(item.stockQty) <= 5 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                        {item.stockQty} {item.unit} {Number(item.stockQty) <= 5 ? '⚠️ Low' : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">₹{item.costPrice}</td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-600">₹{item.sellingPrice}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenEdit(item)} className="px-2.5 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg font-medium">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-medium">Delete</button>
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
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">{editingItem ? 'Edit Stock Item' : 'Add Stock Item'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Item / Variety Name *</label>
                <input
                  type="text"
                  name="itemName"
                  required
                  value={formData.itemName}
                  onChange={handleChange}
                  placeholder="e.g. Full Red Guppy Pair, 0.3mm Feed, Anti-Ich Medicine"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Fish Variety">Fish Variety</option>
                    <option value="Combo / Offer Pack">Combo / Offer Pack</option>
                    <option value="Medicines & Feeds">Medicines & Feeds</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit (அளவீடு)</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pairs">Pairs (ஜோடி)</option>
                    <option value="Pieces">Pieces (எண்ணிக்கை)</option>
                    <option value="Packets">Packets (பாக்கெட்)</option>
                    <option value="Kg">Kg (கிலோகிராம்)</option>
                    <option value="Grams">Grams (கிராம்)</option>
                    <option value="Litres">Litres (லிட்டர்)</option>
                    <option value="ml">ml (மில்லிலிட்டர்)</option>
                    <option value="Bottles">Bottles (பாட்டில்)</option>
                    <option value="Boxes">Boxes (பாக்ஸ்)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    name="stockQty"
                    step="any"
                    min="0"
                    required
                    value={formData.stockQty}
                    onChange={handleChange}
                    placeholder="e.g. 4.5"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cost (₹)</label>
                  <input
                    type="number"
                    name="costPrice"
                    step="any"
                    min="0"
                    value={formData.costPrice}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Selling (₹)</label>
                  <input
                    type="number"
                    name="sellingPrice"
                    step="any"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  {editingItem ? 'Update Stock' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}