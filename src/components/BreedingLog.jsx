import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function BreedingLog() {
  const { showToast } = useToast();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const [formData, setFormData] = useState({
    batchName: '',
    varietyName: '',
    locationTub: '',
    birthDate: new Date().toISOString().split('T')[0],
    initialFryCount: '',
    currentSurvivalCount: '',
    feedingType: 'Moina + Yeast',
    waterParameters: 'TDS: 250, pH: 7.2',
    notes: ''
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'breedingBatches'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBatches(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['initialFryCount', 'currentSurvivalCount'].includes(name) 
        ? (value === '' ? '' : Number(value)) 
        : value
    }));
  };

  const handleOpenAdd = () => {
    setEditingBatch(null);
    setFormData({
      batchName: '',
      varietyName: '',
      locationTub: '',
      birthDate: new Date().toISOString().split('T')[0],
      initialFryCount: '',
      currentSurvivalCount: '',
      feedingType: 'Moina + Yeast',
      waterParameters: 'TDS: 250, pH: 7.2',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (batch) => {
    setEditingBatch(batch);
    setFormData({
      batchName: batch.batchName || '',
      varietyName: batch.varietyName || '',
      locationTub: batch.locationTub || '',
      birthDate: batch.birthDate || '',
      initialFryCount: batch.initialFryCount ?? '',
      currentSurvivalCount: batch.currentSurvivalCount ?? '',
      feedingType: batch.feedingType || 'Moina + Yeast',
      waterParameters: batch.waterParameters || '',
      notes: batch.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        initialFryCount: Number(formData.initialFryCount) || 0,
        currentSurvivalCount: Number(formData.currentSurvivalCount) || Number(formData.initialFryCount) || 0,
      };

      if (editingBatch) {
        await updateDoc(doc(db, 'breedingBatches', editingBatch.id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
        showToast('Breeding batch updated successfully.', 'success');
      } else {
        await addDoc(collection(db, 'breedingBatches'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        showToast('New breeding batch recorded.', 'success');
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error saving breeding batch: ", error);
      showToast('Error saving batch record.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this breeding log?")) {
      try {
        await deleteDoc(doc(db, 'breedingBatches', id));
        showToast('Batch record deleted.', 'success');
      } catch (error) {
        console.error("Error deleting batch: ", error);
        showToast('Could not delete record.', 'error');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Udhaya Aquatics - Batch & Breeding Log</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track fry birth, survival rate, tub locations, and feeding routines (Moina/Yeast).</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>➕ Add New Breeding Batch</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading breeding logs...</div>
      ) : batches.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          No breeding batches recorded yet. Click "Add New Breeding Batch" to start tracking your guppy fries.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">BATCH & VARIETY</th>
                  <th className="py-3 px-4">LOCATION / TUB</th>
                  <th className="py-3 px-4">BIRTH DATE</th>
                  <th className="py-3 px-4 text-center">INITIAL FRY</th>
                  <th className="py-3 px-4 text-center">SURVIVAL COUNT</th>
                  <th className="py-3 px-4">FEEDING / WATER</th>
                  <th className="py-3 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {batches.map((batch) => {
                  const survivalRate = batch.initialFryCount > 0 
                    ? ((batch.currentSurvivalCount / batch.initialFryCount) * 100).toFixed(0) 
                    : 100;
                  return (
                    <tr key={batch.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900">{batch.batchName || 'Batch'}</p>
                        <p className="text-blue-600 font-semibold">{batch.varietyName}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{batch.locationTub || '—'}</td>
                      <td className="py-3.5 px-4 text-gray-500">{batch.birthDate || '—'}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-800">{batch.initialFryCount}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          {batch.currentSurvivalCount} ({survivalRate}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <p className="font-medium">🍽️ {batch.feedingType}</p>
                        <p className="text-[11px] text-gray-400">💧 {batch.waterParameters}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenEdit(batch)} className="px-2.5 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg font-medium cursor-pointer">Edit</button>
                          <button onClick={() => handleDelete(batch.id)} className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-medium cursor-pointer">Delete</button>
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
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">{editingBatch ? 'Edit Breeding Batch' : 'Add Breeding Batch'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Batch Code / Name *</label>
                  <input
                    type="text"
                    name="batchName"
                    required
                    value={formData.batchName}
                    onChange={handleChange}
                    placeholder="e.g. Batch #12"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location / Tub (பெட்டி / டப்)</label>
                  <input
                    type="text"
                    name="locationTub"
                    value={formData.locationTub}
                    onChange={handleChange}
                    placeholder="e.g. Tub #3 (Rooftop)"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Birth Date *</label>
                  <input
                    type="date"
                    name="birthDate"
                    required
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Initial Fry Count (பிறந்த குஞ்சுகள்)</label>
                  <input
                    type="number"
                    name="initialFryCount"
                    min="0"
                    required
                    value={formData.initialFryCount}
                    onChange={handleChange}
                    placeholder="e.g. 50"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Current Survival Count (தற்போதைய எண்ணிக்கை)</label>
                  <input
                    type="number"
                    name="currentSurvivalCount"
                    min="0"
                    required
                    value={formData.currentSurvivalCount}
                    onChange={handleChange}
                    placeholder="e.g. 45"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Feeding Type (உணவு முறை)</label>
                  <input
                    type="text"
                    name="feedingType"
                    value={formData.feedingType}
                    onChange={handleChange}
                    placeholder="e.g. Moina + Yeast / Artemia"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Water Parameters (தண்ணீர் தரம்)</label>
                  <input
                    type="text"
                    name="waterParameters"
                    value={formData.waterParameters}
                    onChange={handleChange}
                    placeholder="e.g. TDS: 250, pH: 7.2"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Observations</label>
                <textarea
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any specific observations about growth or water change..."
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
                  {editingBatch ? 'Update Batch' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}