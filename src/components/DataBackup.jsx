import { useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function DataBackup() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Export all collections (orders, inventory, expenses) to a JSON file
  const handleExportData = async () => {
    try {
      setLoading(true);
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const inventorySnap = await getDocs(collection(db, 'inventory'));
      const expensesSnap = await getDocs(collection(db, 'expenses'));

      const backupData = {
        exportDate: new Date().toISOString(),
        orders: ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        inventory: inventorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        expenses: expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `udhaya_aquatics_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast('Failed to export data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Import JSON file and restore data to Firebase
  const handleImportData = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm("Warning: Importing data will add records to your current database. Proceed?")) {
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        const jsonContent = JSON.parse(event.target.result);

        if (jsonContent.orders && Array.isArray(jsonContent.orders)) {
          for (const order of jsonContent.orders) {
            const { id, ...orderData } = order;
            await addDoc(collection(db, 'orders'), orderData);
          }
        }

        if (jsonContent.inventory && Array.isArray(jsonContent.inventory)) {
          for (const item of jsonContent.inventory) {
            const { id, ...itemData } = item;
            await addDoc(collection(db, 'inventory'), itemData);
          }
        }

        if (jsonContent.expenses && Array.isArray(jsonContent.expenses)) {
          for (const exp of jsonContent.expenses) {
            const { id, ...expData } = exp;
            await addDoc(collection(db, 'expenses'), expData);
          }
        }

        showToast('Data imported and synced to Firebase successfully!', 'success');
      } catch (error) {
        console.error('Error importing data:', error);
        showToast('Invalid backup file format.', 'error');
      } finally {
        setLoading(false);
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Data Backup & Restore (Export / Import)</h1>
        <p className="text-xs text-gray-500 mt-0.5">Secure your business data by exporting a JSON backup or restore from a previous backup file.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">📤</div>
          <h3 className="font-bold text-gray-900 text-base">Export Business Data</h3>
          <p className="text-xs text-gray-500">Download a complete backup file containing all your orders, stock inventory, and expense records.</p>
          <button
            onClick={handleExportData}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-3 rounded-xl shadow-sm transition-all"
          >
            {loading ? 'Processing...' : 'Download JSON Backup'}
          </button>
        </div>

        {/* Import Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">📥</div>
          <h3 className="font-bold text-gray-900 text-base">Restore / Import Data</h3>
          <p className="text-xs text-gray-500">Upload your previously saved JSON backup file to restore or sync records into your database.</p>
          <label className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-3 rounded-xl shadow-sm transition-all cursor-pointer">
            {loading ? 'Restoring...' : 'Upload & Restore Backup'}
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              disabled={loading}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}   