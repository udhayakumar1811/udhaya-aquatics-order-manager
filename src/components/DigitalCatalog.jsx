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
    (item.varietyName || item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">🌐 Digital Guppy Stock Catalog & WhatsApp Linker</h1>
          <p className="text-xs text-gray-500 mt-0.5">Publish live farm inventory strains with photos, videos, and prices, generating instant "Buy on WhatsApp" links.</p>
        </div>
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search strains (Full Gold, AFR...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            const name = item.varietyName || item.name || 'Guppy Strain';
            const price = item.pricePerPair || item.price || 350;
            const stockQty = item.quantity || item.pairsCount || 10;
            const imageUrl = item.imageUrl || item.photoUrl || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=500&auto=format&fit=crop';
            const videoUrl = item.videoUrl || item.video || ''; // Support for product video link/embed

            const whatsappMessage = encodeURIComponent(
              `Hello Udhaya Aquatics! 🐟 I would like to order the following strain from your digital catalog:\n\n*Strain:* ${name}\n*Price:* ₹${price}\n*Available Stock:* ${stockQty} pairs/pcs\n\nPlease confirm availability and shipping to my address.`
            );
            const whatsappUrl = `https://wa.me/919003278284?text=${whatsappMessage}`;

            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  {/* Media Section: Image or Video */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {videoUrl ? (
                      <video
                        src={videoUrl}
                        controls
                        className="w-full h-full object-cover"
                        poster={imageUrl}
                      />
                    ) : (
                      <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                    )}
                    <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      {stockQty > 0 ? `🟢 Stock: ${stockQty}` : '🔴 Out of Stock'}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="text-base font-bold text-gray-900">{name}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-extrabold text-emerald-600">₹{price} <span className="text-xs font-normal text-gray-500">/ pair</span></span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">{item.grade || 'Grade A'}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{item.notes || 'High purity active guppy strain bred in outdoor green water tubs.'}</p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <a
                    href={whatsappUrl}
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