import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const TEMPLATES = [
  {
    id: 'new_stock',
    title: '🐟 New Guppy Varieties Arrival',
    message: 'Hello *{name}*! Exciting news from *Udhaya Aquatics* 🌊. New premium guppy varieties (Full Gold, AFR & imported strains) have just arrived at our farm! Check out our latest combos and grab yours before stock runs out. Reply here to book your pair!'
  },
  {
    id: 'combo_offer',
    title: '🔥 Special Combo Offer',
    message: 'Hi *{name}*, we have a special weekend combo pack available at *Udhaya Aquatics*! High-grade guppy pairs + free live food culture samples (Moina/Yeast). Limited batches only. Message us now to place your order!'
  },
  {
    id: 'reorder_reminder',
    title: '⭐ Auto Reorder Follow-up (Weeks Ago)',
    message: 'Hello *{name}*, hope your guppies and aquarium setup from *Udhaya Aquatics* are doing great! It has been about *{weeksAgo} weeks* since your last order. Let us know if you need any fresh stock, breeding equipment, or live feed cultures!'
  }
];

export default function WhatsAppMarketing() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
  const [customMessage, setCustomMessage] = useState(TEMPLATES[0].message);
  const [filterType, setFilterType] = useState('all'); // 'all', 'repeat', 'followup'

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Aggregate unique customers and calculate last order date & weeks passed
      const customerMap = {};
      const now = new Date();

      orders.forEach(order => {
        const phone = order.phone || order.mobileNumber || order.whatsappNumber || '';
        const name = order.customerName ? order.customerName.trim() : 'Customer';
        const orderDateStr = order.date || order.createdAt?.toDate?.()?.toISOString().split('T')[0] || '';

        if (phone && phone.length >= 10) {
          if (!customerMap[phone]) {
            customerMap[phone] = {
              name,
              phone,
              totalOrders: 0,
              lastOrderDate: orderDateStr,
              weeksSinceLastOrder: 0
            };
          }
          customerMap[phone].totalOrders += 1;
          if (order.customerName) customerMap[phone].name = order.customerName.trim();

          // Track most recent date
          if (orderDateStr && orderDateStr >= customerMap[phone].lastOrderDate) {
            customerMap[phone].lastOrderDate = orderDateStr;
          }
        }
      });

      // Calculate weeks elapsed since last order
      const processedCustomers = Object.values(customerMap).map(cust => {
        let weeks = 0;
        if (cust.lastOrderDate) {
          const lastDate = new Date(cust.lastOrderDate);
          const diffTime = Math.abs(now - lastDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          weeks = Math.floor(diffDays / 7);
        }
        return { ...cust, weeksSinceLastOrder: weeks };
      });

      setCustomers(processedCustomers);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setCustomMessage(template.message);
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (filterType === 'repeat') return c.totalOrders > 1;
    if (filterType === 'followup') return c.weeksSinceLastOrder >= 2; // 2 weeks or more since last order
    return true;
  });

  const sendWhatsApp = (cust) => {
    let cleanPhone = cust.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Default to India country code
    }
    
    let personalizedMsg = customMessage
      .replace(/{name}/g, cust.name)
      .replace(/{weeksAgo}/g, cust.weeksSinceLastOrder);

    const encodedMsg = encodeURIComponent(personalizedMsg);
    const url = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">WhatsApp Broadcast & Auto Follow-up</h1>
          <p className="text-xs text-gray-500 mt-0.5">Broadcast new guppy arrivals or trigger reorder reminders based on customer purchase history.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-600">Filter Audience:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Customers ({customers.length})</option>
            <option value="repeat">Repeat Buyers Only</option>
            <option value="followup">Needs Reorder Follow-up (2+ Weeks)</option>
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
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Edit Message (Supports {'{name}'} & {'{weeksAgo}'})</label>
            <textarea
              rows="6"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <p className="text-[11px] text-gray-400">Clicking "Send WhatsApp" opens WhatsApp Web/App instantly with customer details and calculated weeks automatically inserted.</p>
        </div>

        {/* Customer List Section */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-bold text-gray-800 text-xs uppercase tracking-wider flex justify-between items-center">
            <span>Customer Contacts ({filteredCustomers.length})</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg">Auto Follow-up Ready</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading customer history...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No customers match the selected filter.</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {filteredCustomers.map((cust, index) => (
                <div key={index} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900">{cust.name}</p>
                    <p className="text-xs text-gray-500">
                      {cust.phone} • <span className="font-semibold text-blue-600">{cust.totalOrders} order(s)</span>
                    </p>
                    <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                      Last Order: {cust.lastOrderDate || 'N/A'} ({cust.weeksSinceLastOrder} weeks ago)
                    </p>
                  </div>
                  <button
                    onClick={() => sendWhatsApp(cust)}
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