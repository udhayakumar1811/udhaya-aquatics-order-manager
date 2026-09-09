import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function DigitalCatalog() {
  const { showToast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [editModalItem, setEditModalItem] = useState(null);
  const [editForm, setEditForm] = useState({
    itemName: '',
    sellingPrice: '',
    stockQty: '',
    unit: 'Pairs (ஜோடி)',
    category: 'Fish Variety',
    imageUrl: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventory(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenEdit = (item) => {
    setEditModalItem(item);
    setEditForm({
      itemName: item.itemName || item.varietyName || '',
      sellingPrice: item.sellingPrice || item.pricePerPair || '',
      stockQty: item.stockQty ?? item.quantity ?? '',
      unit: item.unit || 'Pairs (ஜோடி)',
      category: item.category || 'Fish Variety',
      imageUrl: item.imageUrl || item.photoUrl || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModalItem) return;

    try {
      const itemRef = doc(db, 'inventory', editModalItem.id);
      await updateDoc(itemRef, {
        itemName: editForm.itemName,
        varietyName: editForm.itemName,
        sellingPrice: Number(editForm.sellingPrice) || 0,
        pricePerPair: Number(editForm.sellingPrice) || 0,
        stockQty: Number(editForm.stockQty) || 0,
        unit: editForm.unit,
        category: editForm.category,
        imageUrl: editForm.imageUrl
      });

      showToast('Catalog item updated successfully!', 'success');
      setEditModalItem(null);
    } catch (err) {
      console.error("Error updating catalog item:", err);
      showToast('Could not update catalog item.', 'error');
    }
  };

  const filteredItems = inventory.filter(item =>
    (item.varietyName || item.itemName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShareCatalogLink = () => {
    const baseUrl = window.location.origin;
    const catalogUrl = `${baseUrl}/catalog`;
    const message = `🌟 *Udhaya Aquatics - Live Guppy Stock Catalog* 🌟\n\nCheck out our live available fish varieties, photos, videos, and prices here:\n👉 ${catalogUrl}\n\n*Browse and order directly via WhatsApp!* 🐟`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    showToast('Public catalog link opened in WhatsApp!', 'success');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">🌐 Digital Guppy Stock Catalog & WhatsApp Linker</h1>
          <p className="text-xs text-gray-500 mt-0.5">Share your live catalog web link so customers can view photos, videos & buy on WhatsApp.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search strains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-60 p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleShareCatalogLink}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <span>🔗 Share Catalog Link (WhatsApp)</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading catalog...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          No stock items found in inventory. Add strains in the Stock tab to publish them here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const name = item.itemName || item.varietyName || 'Guppy Strain';
            const price = item.sellingPrice || item.pricePerPair || 350;
            const stockQty = Number(item.stockQty ?? item.quantity ?? 0);
            const unit = item.unit || 'Pairs';
            const imageUrl = item.imageUrl || item.photoUrl || '';
            const isAvailable = stockQty > 0;

            const singleWhatsappMessage = encodeURIComponent(
              `Hello Udhaya Aquatics! 🐟 I saw this on your digital catalog:\n\n*Item:* ${name}\n*Price:* ₹${price}\n*Stock:* ${stockQty} ${unit}\n\nI would like to order this. Please confirm availability.`
            );
            const singleWhatsappUrl = `https://wa.me/919003278284?text=${singleWhatsappMessage}`;

            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow relative">
                <div>
                  <div className="relative h-48 bg-gray-100 overflow-hidden flex items-center justify-center">
                    {imageUrl ? (
                      <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">No Image Uploaded</span>
                    )}
                    
                    <span className={`absolute top-3 right-3 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg ${isAvailable ? 'bg-emerald-600/90' : 'bg-rose-600/90'}`}>
                      {isAvailable ? `🟢 Available (${stockQty} ${unit})` : '🔴 Out of Stock'}
                    </span>

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="absolute top-3 left-3 bg-white/90 hover:bg-white text-gray-800 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow cursor-pointer transition-all"
                    >
                      ✏️ Edit
                    </button>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="text-base font-bold text-gray-900">{name}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-extrabold text-emerald-600">₹{price} <span className="text-xs font-normal text-gray-500">/ {unit}</span></span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">{item.category || 'Fish Variety'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <a
                    href={singleWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>💬 Buy on WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editModalItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditModalItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-sm">Edit Catalog Item</h3>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={editForm.itemName}
                  onChange={(e) => setEditForm({ ...editForm, itemName: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editForm.sellingPrice}
                    onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editForm.stockQty}
                    onChange={(e) => setEditForm({ ...editForm, stockQty: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs bg-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Unit</label>
                <input
                  type="text"
                  value={editForm.unit}
                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Photo Image URL</label>
                <input
                  type="text"
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalItem(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}