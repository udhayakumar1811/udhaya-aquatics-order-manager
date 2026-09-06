import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

const TEMPLATES = [
  {
    id: 'new_stock',
    title: '🐟 New Guppy Varieties Arrival',
    message: 'Hello *{name}*! Exciting news from *Udhaya Aquatics* 🌊. New premium guppy varieties (Full Gold, AFR & imported strains) have just arrived at our farm! Check out our latest combos and grab yours before stock runs out. Reply here to book your pair!'
  },
  {
    id: 'combo_offer',
    title: '🔥 Special Combo Offer',
    message: 'Hi *{name}*, we have a special weekend combo pack available at *Udhaya Aquatics*! High-grade guppy pairs + free live food culture samples. Limited batches only. Message us now to place your order!'
  },
  {
    id: 'reorder_reminder',
    title: '⭐ Reorder / Follow-up Reminder',
    message: 'Hello *{name}*, hope your previous guppies and setup from *Udhaya Aquatics* are doing great! Let us know if you need any fresh stock, breeding equipment, or live feed (Moina/Yeast). Have a wonderful day!'
  }
];

export default function WhatsAppMarketing() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].message);
  const [customMessage, setCustomMessage] = useState(TEMPLATES[0].message);
  const [filterType, setFilterType] = useState('all'); // 'all' or 'repeat'

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => doc.data());
      
      // Aggregate unique customers by phone
      const customerMap = {};
      orders.forEach(order => {
        const phone = order.phone || order.mobileNumber || order.whatsappNumber || '';
        const name = order.customerName ? order.customerName.trim() : 'Customer';
        if (phone && phone.length >= 10) {
          if (!customerMap[phone]) {
            customerMap[phone] = { name, phone, totalOrders: 0 };
          }
          customerMap[phone].totalOrders += 1;
          if (order.customerName) customerMap[phone].name = order.customerName.trim();
        }
      });

      setCustomers(Object.values(customerMap));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleTemplateChange = (e) => {
    const template = TEMPLATES.find(t => t.id === e.target.value);
    if (template) {
      setSelectedTemplate(template.message);
      setCustomMessage(template.message);
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (filterType === 'repeat') return c.totalOrders > 1;
    return true;
  });

  const sendWhatsApp = (phone, name) => {
    // Format phone number (remove spaces, symbols)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Default to India country code
    }
    
    const personalizedMsg = customMessage.replace('{name}', name);
    const encodedMsg = encodeURIComponent(personalizedMsg);
    const url = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">WhatsApp Broadcast & Reminders</h1>
          <p className="text-xs text-gray-500 mt-0.5">Send instant WhatsApp messages, new guppy stock updates, and reorder reminders to your customers.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-600">Audience Filter:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Customers ({customers.length})</option>
            <option value="repeat">Repeat Buyers Only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Message Editor Section */}
        <div className="md:col-span-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4 h-fit">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Message Templates</h2>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Select Template</label>
            <select
              onChange={handleTemplateChange}
              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customize Message (Use {'{name}'} for customer name)</label>
            <textarea
              rows="6"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <p className="text-[11px] text-gray-400">Clicking "Chat on WhatsApp" next to any customer will automatically open WhatsApp Web or App with this message pre-filled.</p>
        </div>

        {/* Customer List Section */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-bold text-gray-800 text-xs uppercase tracking-wider flex justify-between items-center">
            <span>Customer Contacts ({filteredCustomers.length})</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg">WhatsApp Ready</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading customer numbers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No customer phone numbers found.</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {filteredCustomers.map((cust, index) => (
                <div key={index} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900">{cust.name}</p>
                    <p className="text-xs text-gray-500">{cust.phone} • <span className="font-semibold text-blue-600">{cust.totalOrders} order(s)</span></p>
                  </div>
                  <button
                    onClick={() => sendWhatsApp(cust.phone, cust.name)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>💬 Send WhatsApp</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}