import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function RecycleBin() {
  const { showToast } = useToast();
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // orders, expenses, inventory, etc.

  const collectionsList = [
    { id: 'orders', label: '📦 Orders', collectionName: 'orders' },
    { id: 'expenses', label: '💸 Expenses', collectionName: 'expenses' },
    { id: 'inventory', label: '🐟 Inventory / Stock', collectionName: 'inventory' },
    { id: 'fishGrading', label: '📏 Fish Grading', collectionName: 'fishGrading' },
    { id: 'breedingLog', label: '🧬 Breeding Logs', collectionName: 'breedingLog' }
  ];

  useEffect(() => {
    fetchDeletedItems();
  }, [activeTab]);

  const fetchDeletedItems = async () => {
    try {
      setLoading(true);
      const targetCol = collectionsList.find(c => c.id === activeTab)?.collectionName || 'orders';
      const q = query(collection(db, targetCol), where('deleted', '==', true));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, collectionName: targetCol, ...doc.data() }));
      setDeletedItems(data);
    } catch (err) {
      console.error("Error fetching recycle bin items:", err);
      // If 'deleted' index doesn't exist yet, fallback gracefully
      setDeletedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item) => {
    try {
      const docRef = doc(db, item.collectionName, item.id);
      await updateDoc(docRef, { deleted: false, deletedAt: null });
      showToast('Item restored successfully!', 'success');
      fetchDeletedItems();
    } catch (err) {
      console.error("Error restoring item:", err);
      showToast('Could not restore item.', 'error');
    }
  };

  const handlePermanentDelete = async (item) => {
    if (!window.confirm('Are you sure you want to permanently delete this item? This cannot be undone!')) return;
    try {
      const docRef = doc(db, item.collectionName, item.id);
      await deleteDoc(docRef);
      showToast('Item permanently deleted.', 'success');
      fetchDeletedItems();
    } catch (err) {
      console.error("Error permanently deleting item:", err);
      showToast('Could not delete item permanently.', 'error');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">🗑️ Recycle Bin (Trash / Deleted Items)</h1>
          <p className="text-xs text-gray-500 mt-0.5">Recover accidentally deleted records or permanently erase them from storage.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {collectionsList.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveTab(col.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === col.id ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {col.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex justify-between items-center">
          <span>Deleted {collectionsList.find(c => c.id === activeTab)?.label} Records</span>
          <span className="text-slate-400 font-mono">Total in Bin: {deletedItems.length}</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading trash bin...</div>
        ) : deletedItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <p className="text-3xl">✨</p>
            <p className="font-medium">Recycle bin is empty for this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">Record Identifier / ID</th>
                  <th className="py-3 px-4">Main Details</th>
                  <th className="py-3 px-4">Deleted Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {deletedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {item.orderId || item.expenseTitle || item.varietyName || item.tankName || item.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {item.customerName ? `Customer: ${item.customerName} (₹${item.revenueTotal || item.billTotal || 0})` :
                       item.amount ? `Amount: ₹${item.amount}` :
                       item.quantity ? `Qty: ${item.quantity}` : 'Record Data Stored'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                      {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : 'Recently'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleRestore(item)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 transition-all cursor-pointer text-xs flex items-center gap-1"
                        >
                          <span>♻️ Restore</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-3 py-1.5 rounded-lg border border-rose-200 transition-all cursor-pointer text-xs flex items-center gap-1"
                        >
                          <span>🗑️ Delete Forever</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}