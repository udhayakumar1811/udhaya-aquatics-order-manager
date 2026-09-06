import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function MortalityTracker() {
  const { showToast } = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    tubLocation: '',
    varietyName: '',
    deadCount: '',
    causeOfLoss: 'Water Parameter Issue', // 'Water Parameter Issue', 'Temperature Fluctuation', 'Disease / Parasite', 'Natural / Old Age', 'Unknown'
    treatmentGiven: '',
    notes: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'mortalityRecords'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecords(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'deadCount' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      tubLocation: '',
      varietyName: '',
      deadCount: '',
      causeOfLoss: 'Water Parameter Issue',
      treatmentGiven: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingRecord(item);
    setFormData({
      date: item.date || new Date().toISOString().split('T')[0],
      tubLocation: item.tubLocation || '',
      varietyName: item.varietyName || '',
      deadCount: item.deadCount ?? '',
      causeOfLoss: item.causeOfLoss || 'Water Parameter Issue',
      treatmentGiven: item.treatmentGiven || '',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        deadCount: Number(formData.deadCount) || 0
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'mortalityRecords', editingRecord.id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
        showToast('Mortality record updated successfully.', 'success');
      } else {
        await addDoc(collection(db, 'mortalityRecords'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        showToast('Mortality record added.', 'success');
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error saving mortality record: ", error);
      showToast('Error saving record.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this mortality record?")) {
      try {
        await deleteDoc(doc(db, 'mortalityRecords', id));
        showToast('Record deleted successfully.', 'success');
      } catch (error) {
        console.error("Error deleting record: ", error);
        showToast('Could not delete record.', 'error');
      }
    }
  };

  const totalLossCount = records.reduce((sum, r) => sum + (Number(r.deadCount) || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mortality & Health Loss Tracker</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track fish mortality across tubs, identify root causes (water, temp, disease), and protect farm stock.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>➕ Record Loss / Mortality</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-rose-600 uppercase">TOTAL FISH LOSS (RECORDED)</p>
          <h3 className="text-3xl font-extrabold text-rose-700 mt-2">{totalLossCount} Fishes</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL INCIDENTS LOGGED</p>
          <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{records.length} Batches / Tubs</h3>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading mortality records...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          No mortality records logged. Click "Record Loss / Mortality" to add an entry.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">DATE & TUB</th>
                  <th className="py-3 px-4">VARIETY</th>
                  <th className="py-3 px-4 text-center">DEAD COUNT</th>
                  <th className="py-3 px-4">CAUSE OF LOSS</th>
                  <th className="py-3 px-4">TREATMENT GIVEN</th>
                  <th className="py-3 px-4">NOTES</th>
                  <th className="py-3 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {records.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900">{item.date}</p>
                      <p className="text-[11px] text-slate-500">📍 {item.tubLocation || '—'}</p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-blue-600">{item.varietyName || '—'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                        -{item.deadCount} fishes
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-amber-700">{item.causeOfLoss}</td>
                    <td className="py-3.5 px-4 text-gray-600">{item.treatmentGiven || '—'}</td>
                    <td className="py-3.5 px-4 text-gray-500 truncate max-w-xs">{item.notes || '—'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenEdit(item)} className="px-2.5 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg font-medium cursor-pointer">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-medium cursor-pointer">Delete</button>
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
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">{editingRecord ? 'Edit Mortality Record' : 'Record Fish Mortality'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tub Location (டப் / தொட்டி)</label>
                  <input
                    type="text"
                    name="tubLocation"
                    value={formData.tubLocation}
                    onChange={handleChange}
                    placeholder="e.g. Roof Tub #3"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Guppy Variety *</label>
                  <input
                    type="text"
                    name="varietyName"
                    required
                    value={formData.varietyName}
                    onChange={handleChange}
                    placeholder="e.g. Full Gold / AFR"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dead Count (இறந்த எண்ணிக்கை) *</label>
                  <input
                    type="number"
                    name="deadCount"
                    min="1"
                    required
                    value={formData.deadCount}
                    onChange={handleChange}
                    placeholder="e.g. 5"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cause of Loss (இழப்புக்கான காரணம்) *</label>
                <select
                  name="causeOfLoss"
                  value={formData.causeOfLoss}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Water Parameter Issue">Water Parameter Issue (TDS / pH மாற்றம்)</option>
                  <option value="Temperature Fluctuation">Temperature Fluctuation (வெப்பநிலை மாற்றம்)</option>
                  <option value="Disease / Parasite">Disease / Parasite (நோய் / ஒட்டுண்ணித் தாக்கம்)</option>
                  <option value="Natural / Old Age">Natural / Old Age (இயற்கையான முதுமை)</option>
                  <option value="Unknown">Unknown (காரணம் தெரியவில்லை)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Treatment Given (கொடுக்கப்பட்ட சிகிச்சை / மருந்து)</label>
                <input
                  type="text"
                  name="treatmentGiven"
                  value={formData.treatmentGiven}
                  onChange={handleChange}
                  placeholder="e.g. Salt bath, Anti-parasite medicine, 50% water change"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Observations</label>
                <textarea
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional observations regarding water color, aeration, or feed..."
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
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
                  {editingRecord ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}