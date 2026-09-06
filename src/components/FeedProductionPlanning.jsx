import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function FeedProductionPlanning() {
  const { showToast } = useToast();
  const [cultures, setCultures] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingCulture, setEditingCulture] = useState(null);

  const [formData, setFormData] = useState({
    cultureName: '',
    feedType: 'Moina', // 'Moina' or 'Yeast' or 'Artemia'
    tubLocation: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: '',
    status: 'Growing', // 'Starting', 'Growing', 'Ready for Harvest', 'Exhausted'
    densityNotes: 'High density green water culture'
  });

  useEffect(() => {
    const q = query(collection(db, 'feedCultures'), orderBy('startDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCultures(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAdd = () => {
    setEditingCulture(null);
    setFormData({
      cultureName: '',
      feedType: 'Moina',
      tubLocation: '',
      startDate: new Date().toISOString().split('T')[0],
      expectedHarvestDate: '',
      status: 'Growing',
      densityNotes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingCulture(item);
    setFormData({
      cultureName: item.cultureName || '',
      feedType: item.feedType || 'Moina',
      tubLocation: item.tubLocation || '',
      startDate: item.startDate || '',
      expectedHarvestDate: item.expectedHarvestDate || '',
      status: item.status || 'Growing',
      densityNotes: item.densityNotes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCulture) {
        await updateDoc(doc(db, 'feedCultures', editingCulture.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        showToast('Culture batch updated successfully.', 'success');
      } else {
        await addDoc(collection(db, 'feedCultures'), {
          ...formData,
          createdAt: serverTimestamp()
        });
        showToast('New feed culture batch added.', 'success');
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error saving feed culture: ", error);
      showToast('Error saving culture record.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this culture record?")) {
      try {
        await deleteDoc(doc(db, 'feedCultures', id));
        showToast('Culture record deleted.', 'success');
      } catch (error) {
        console.error("Error deleting culture: ", error);
        showToast('Could not delete record.', 'error');
      }
    }
  };

  const readyCount = cultures.filter(c => c.status === 'Ready for Harvest').length;
  const growingCount = cultures.filter(c => c.status === 'Growing' || c.status === 'Starting').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Live Feed & Culture Production Planning</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track Moina, Yeast and live feed tubs, harvest cycles, and production schedules for fry feeding.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>➕ Add Culture Batch</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-emerald-600 uppercase">READY FOR HARVEST</p>
          <h3 className="text-3xl font-extrabold text-emerald-700 mt-2">{readyCount} Batches</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">GROWING / IN PROGRESS</p>
          <h3 className="text-3xl font-extrabold text-blue-700 mt-2">{growingCount} Batches</h3>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading feed production logs...</div>
      ) : cultures.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          No live feed cultures recorded yet. Click "Add Culture Batch" to start planning.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">BATCH & FEED TYPE</th>
                  <th className="py-3 px-4">TUB LOCATION</th>
                  <th className="py-3 px-4">START DATE</th>
                  <th className="py-3 px-4">EXPECTED HARVEST</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4">NOTES</th>
                  <th className="py-3 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {cultures.map((item) => {
                  let badgeColor = 'bg-slate-100 text-slate-700';
                  if (item.status === 'Ready for Harvest') badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                  if (item.status === 'Growing') badgeColor = 'bg-blue-50 text-blue-700 border border-blue-100';
                  if (item.status === 'Starting') badgeColor = 'bg-amber-50 text-amber-700 border border-amber-100';
                  if (item.status === 'Exhausted') badgeColor = 'bg-rose-50 text-rose-700 border border-rose-100';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900">{item.cultureName}</p>
                        <span className="text-[11px] font-semibold text-blue-600">🧬 {item.feedType}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{item.locationTub || item.tubLocation || '—'}</td>
                      <td className="py-3.5 px-4 text-gray-500">{item.startDate}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-800">{item.expectedHarvestDate || '—'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] ${badgeColor}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 truncate max-w-xs">{item.densityNotes || '—'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenEdit(item)} className="px-2.5 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg font-medium cursor-pointer">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-medium cursor-pointer">Delete</button>
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
            <h2 className="text-lg font-bold text-gray-900">{editingCulture ? 'Edit Feed Culture Batch' : 'Add Feed Culture Batch'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Batch / Culture Name *</label>
                  <input
                    type="text"
                    name="cultureName"
                    required
                    value={formData.cultureName}
                    onChange={handleChange}
                    placeholder="e.g. Moina Tub #2"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Feed Type *</label>
                  <select
                    name="feedType"
                    value={formData.feedType}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Moina">Moina (லைவ் ஃபீட்)</option>
                    <option value="Yeast">Yeast (ஈஸ்ட் கல்ச்சர்)</option>
                    <option value="Artemia">Artemia / Brine Shrimp</option>
                    <option value="Infusoria">Infusoria</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tub Location (டப் இடம்)</label>
                  <input
                    type="text"
                    name="tubLocation"
                    value={formData.tubLocation}
                    onChange={handleChange}
                    placeholder="e.g. Roof Tub #4"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Starting">Starting (தொடக்கம்)</option>
                    <option value="Growing">Growing (வளர்ச்சி)</option>
                    <option value="Ready for Harvest">Ready for Harvest (அறுவடைக்கு தயார்)</option>
                    <option value="Exhausted">Exhausted (முடிந்தது)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expected Harvest Date</label>
                  <input
                    type="date"
                    name="expectedHarvestDate"
                    value={formData.expectedHarvestDate}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Density & Feeding Notes</label>
                <textarea
                  name="densityNotes"
                  rows="2"
                  value={formData.densityNotes}
                  onChange={handleChange}
                  placeholder="e.g. Added spirulina powder & green water, high density..."
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
                  {editingCulture ? 'Update Culture' : 'Save Culture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}