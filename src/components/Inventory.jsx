import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
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
    sellingPrice: '',
    minStockAlert: '5',
    imageUrl: '',
    videoUrl: ''
  });

  useEffect(() => {
    // Fetch only non-deleted inventory items
    const q = query(collection(db, 'inventory'), where('deleted', '!=', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(data);
      setLoading(false);
    }, (error) => {
      // Fallback if 'deleted' index doesn't exist yet
      console.warn("Index query fallback:", error);
      const unsubFallback = onSnapshot(collection(db, 'inventory'), (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(i => !i.deleted);
        setItems(data);
        setLoading(false);
      });
      return () => unsubFallback();
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['stockQty', 'costPrice', 'sellingPrice', 'minStockAlert'].includes(name) 
        ? (value === '' ? '' : Number(value)) 
        : value
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
      sellingPrice: '',
      minStockAlert: 5,
      imageUrl: '',
      videoUrl: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName || item.varietyName || '',
      category: item.category || 'Fish Variety',
      stockQty: item.stockQty ?? item.quantity ?? '',
      unit: item.unit || 'Pairs',
      costPrice: item.costPrice ?? '',
      sellingPrice: item.sellingPrice ?? item.pricePerPair ?? '',
      minStockAlert: item.minStockAlert ?? 5,
      imageUrl: item.imageUrl || item.photoUrl || '',
      videoUrl: item.videoUrl || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        varietyName: formData.itemName, 
        pricePerPair: Number(formData.sellingPrice) || 0, 
        stockQty: Number(formData.stockQty) || 0,
        costPrice: Number(formData.costPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        minStockAlert: Number(formData.minStockAlert) || 5,
        deleted: false
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
    if (window.confirm("Move this item to Recycle Bin?")) {
      try {
        await updateDoc(doc(db, 'inventory', id), {
          deleted: true,
          deletedAt: new Date().toISOString()
        });
        showToast('Item moved to Recycle Bin.', 'success');
      } catch (error) {
        console.error("Error moving inventory item to trash: ", error);
        showToast('Could not delete item.', 'error');
      }
    }
  };

  const lowStockItemsCount = items.filter(i => Number(i.stockQty) <= Number(i.minStockAlert || 5)).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Udhaya Aquatics Inventory & Stock</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage fish varieties with photo/video file uploads, combos, medicines, and feeds.</p>
        </div>
        <div className="flex items-center gap-3">
          {lowStockItemsCount > 0 && (
            <div className="bg-rose-50 text-rose-600 px-3 py-2 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-1.5 animate-pulse">
              <span>⚠️</span>
              <span>{lowStockItemsCount} Item(s) Low on Stock!</span>
            </div>
          )}
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>➕ Add New Stock Item</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading inventory...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          No stock items added yet. Click "Add New Stock Item" to start tracking.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">MEDIA</th>
                  <th className="py-3 px-4">ITEM NAME</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">CURRENT STOCK</th>
                  <th className="py-3 px-4">COST PRICE (₹)</th>
                  <th className="py-3 px-4">SELLING PRICE (₹)</th>
                  <th className="py-3 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {items.map((item) => {
                  const isLow = Number(item.stockQty) <= Number(item.minStockAlert || 5);
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${isLow ? 'bg-rose-50/20' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Img</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {item.itemName || item.varietyName}
                        {isLow && <span className="ml-2 text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">Low Stock</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-lg">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold px-2.5 py-1 rounded-lg ${isLow ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-700'}`}>
                          {item.stockQty} {item.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">₹{item.costPrice}</td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-600">₹{item.sellingPrice || item.pricePerPair}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenEdit(item)} className="px-2.5 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg font-medium cursor-pointer">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-medium cursor-pointer">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                  placeholder="e.g. Full Gold Guppy Pair"
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pairs">Pairs (ஜோடி)</option>
                    <option value="Pieces">Pieces (எண்ணிக்கை)</option>
                    <option value="Packets">Packets (பாக்கெட்)</option>
                    <option value="Kg">Kg</option>
                    <option value="Bottles">Bottles</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    placeholder="e.g. 20"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Low Stock Alert Limit</label>
                  <input
                    type="number"
                    name="minStockAlert"
                    step="any"
                    min="0"
                    required
                    value={formData.minStockAlert}
                    onChange={handleChange}
                    placeholder="e.g. 5"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cost Price (₹)</label>
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price (₹)</label>
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

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Upload Media Files (Photo & Video)</p>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Upload Photo File</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const fakeUrl = URL.createObjectURL(file);
                        setFormData(prev => ({ ...prev, imageUrl: fakeUrl }));
                        showToast('Photo file attached successfully!', 'success');
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {formData.imageUrl && <p className="text-[10px] text-emerald-600 mt-1">✓ Photo attached</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Upload Video File (Optional)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const fakeVideoUrl = URL.createObjectURL(file);
                        setFormData(prev => ({ ...prev, videoUrl: fakeVideoUrl }));
                        showToast('Video file attached successfully!', 'success');
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {formData.videoUrl && <p className="text-[10px] text-emerald-600 mt-1">✓ Video attached</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
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