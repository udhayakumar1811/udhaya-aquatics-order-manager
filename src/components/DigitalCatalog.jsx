import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function DigitalCatalog() {
  const { showToast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredItems = inventory.filter(item =>
    (item.varietyName || item.itemName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to share Web App Catalog Link via WhatsApp
  const handleShareCatalogLink = () => {
    const currentUrl = window.location.href; // Gets current page link (e.g. your deployed web app URL)
    const message = `🌟 *Udhaya Aquatics - Live Guppy Stock Catalog* 🌟\n\nCheck out our live available fish varieties, photos, videos, and prices here:\n👉 ${currentUrl}\n\n*Browse and order directly via WhatsApp!* 🐟`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    showToast('Catalog web link opened in WhatsApp!', 'success');
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
            const stockQty = item.stockQty ?? item.quantity ?? 10;
            const unit = item.unit || 'pair';
            const imageUrl = item.imageUrl || item.photoUrl || '';
            const videoUrl = item.videoUrl || '';

            const singleWhatsappMessage = encodeURIComponent(
              `Hello Udhaya Aquatics! 🐟 I saw this on your digital catalog:\n\n*Item:* ${name}\n*Price:* ₹${price}\n*Stock:* ${stockQty} ${unit}\n\nI would like to order this. Please confirm availability.`
            );
            const singleWhatsappUrl = `https://wa.me/919003278284?text=${singleWhatsappMessage}`;

            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="relative h-48 bg-gray-100 overflow-hidden flex items-center justify-center">
                    {imageUrl ? (
                      <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">No Image Uploaded</span>
                    )}
                    <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      {stockQty > 0 ? `🟢 Stock: ${stockQty} ${unit}` : '🔴 Out of Stock'}
                    </span>
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
    </div>
  );
}