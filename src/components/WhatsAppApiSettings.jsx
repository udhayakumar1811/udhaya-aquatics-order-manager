import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function WhatsAppApiSettings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    phoneNumberId: '',
    accessToken: '',
    businessAccountId: '',
    autoSendOnCreate: true,
    autoSendOnShip: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'whatsappApi');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (err) {
        console.error("Error loading WhatsApp API settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'whatsappApi'), {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      showToast('WhatsApp Cloud API credentials saved successfully!', 'success');
    } catch (error) {
      console.error("Error saving WhatsApp settings:", error);
      showToast('Could not save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Meta Cloud WhatsApp API Configuration</h1>
        <p className="text-xs text-gray-500 mt-0.5">Configure your Meta Developer credentials to enable automated order confirmation and shipping alerts via WhatsApp.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading API settings...</div>
      ) : (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp Phone Number ID *</label>
              <input
                type="text"
                name="phoneNumberId"
                required
                value={settings.phoneNumberId}
                onChange={handleChange}
                placeholder="e.g. 106958235478962"
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp Business Account ID (WABA)</label>
              <input
                type="text"
                name="businessAccountId"
                value={settings.businessAccountId}
                onChange={handleChange}
                placeholder="e.g. 105847926315482"
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Meta Permanent Access Token *</label>
            <textarea
              name="accessToken"
              rows="3"
              required
              value={settings.accessToken}
              onChange={handleChange}
              placeholder="EAA..."
              className="w-full p-3 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            ></textarea>
            <p className="text-[11px] text-gray-400 mt-1">Get this token from your Meta App Dashboard &gt; WhatsApp &gt; Getting Started section.</p>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Automation Preferences</h3>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="autoSendOnCreate"
                id="autoSendOnCreate"
                checked={settings.autoSendOnCreate}
                onChange={handleChange}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
              <label htmlFor="autoSendOnCreate" className="text-xs font-medium text-gray-700 cursor-pointer">
                Automatically send Order Confirmation message when a new order is registered.
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="autoSendOnShip"
                id="autoSendOnShip"
                checked={settings.autoSendOnShip}
                onChange={handleChange}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
              <label htmlFor="autoSendOnShip" className="text-xs font-medium text-gray-700 cursor-pointer">
                Automatically send Shipped / Tracking ID alert when status is updated to Shipped.
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving Credentials...' : 'Save API Configuration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}