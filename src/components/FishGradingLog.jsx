import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function FishGradingLog() {
  const { showToast } = useToast();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    tankName: '',
    varietyName: '',
    sizeCategory: 'Medium (M)',
    qualityGrade: 'Grade A',
    quantity: '',
    notes: ''
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'fishGrading'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGrades(data);
    } catch (err) {
      console.error("Error fetching grading logs:", err);
      showToast('Could not load grading logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tankName || !form.varietyName || !form.quantity) {
      showToast('Please fill out all mandatory fields.', 'error');
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'fishGrading', editingId), {
          ...form,
          quantity: Number(form.quantity),
          updatedAt: serverTimestamp()
        });
        showToast('Grading log updated successfully.', 'success');
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'fishGrading'), {
          ...form,
          quantity: Number(form.quantity),
          date: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });
        showToast('New fish grading record added.', 'success');
      }

      setForm({
        tankName: '',
        varietyName: '',
        sizeCategory: 'Medium (M)',
        qualityGrade: 'Grade A',
        quantity: '',
        notes: ''
      });
      fetchGrades();
    } catch (err) {
      console.error("Error saving grading log:", err);
      showToast('Could not save grading record.', 'error');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      tankName: item.tankName || '',
      varietyName: item.varietyName || '',
      sizeCategory: item.sizeCategory || 'Medium (M)',
      qualityGrade: item.qualityGrade || 'Grade A',
      quantity: item.quantity || '',
      notes: item.notes || ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this grading record?')) return;
    try {
      await deleteDoc(doc(db, 'fishGrading', id));
      showToast('Record deleted.', 'success');
      fetchGrades();
    } catch (err) {
      console.error("Error deleting grading record:", err);
      showToast('Could not delete record.', 'error');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Fish Size & Quality Grading Log</h1>
        <p className="text-xs text-gray-500 mt-0.5">Track growth stages (S, M, L) and quality grades (Grade A, Grade B) across your farm tanks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 h-fit">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            {editingId ? 'Edit Grading Record' : 'Add New Tank Grading'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tank Name / ID *</label>
              <input
                type="text"
                name="tankName"
                required
                value={form.tankName}
                onChange={handleChange}
                placeholder="e.g. Tub #04 or Glass Tank 2"
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fish Variety *</label>
              <input
                type="text"
                name="varietyName"
                required
                value={form.varietyName}
                onChange={handleChange}
                placeholder="e.g. Full Red Guppy"
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Size Category</label>
              <select
                name="sizeCategory"
                value={form.sizeCategory}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Small (S)">Small (S - குட்டிகள் / Fry)</option>
                <option value="Medium (M)">Medium (M - வளரும் மீன்)</option>
                <option value="Large (L)">Large (L - முழு வளர்ச்சி / Breeder)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quality Grade</label>
              <select
                name="qualityGrade"
                value={form.qualityGrade}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Grade A">Grade A (Premium Show Quality)</option>
                <option value="Grade B">Grade B (Standard Quality)</option>
                <option value="Cull / Reject">Cull / Reject (Not for sale)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fish Quantity *</label>
              <input
                type="number"
                name="quantity"
                min="1"
                required
                value={form.quantity}
                onChange={handleChange}
                placeholder="e.g. 45"
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Remarks</label>
              <textarea
                name="notes"
                rows="2"
                value={form.notes}
                onChange={handleChange}
                placeholder="Health status, feeding remarks..."
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div className="flex gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setForm({ tankName: '', varietyName: '', sizeCategory: 'Medium (M)', qualityGrade: 'Grade A', quantity: '', notes: '' }); }}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className={`${editingId ? 'w-1/2' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm transition-all cursor-pointer`}
              >
                {editingId ? 'Update Record' : 'Save Grading Log'}
              </button>
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 font-bold text-gray-800 text-xs uppercase tracking-wider">
            Farm Tanks Grading Records ({grades.length})
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">Tank & Date</th>
                  <th className="py-3 px-4">Variety</th>
                  <th className="py-3 px-4">Size & Grade</th>
                  <th className="py-3 px-4">Count</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-8 text-gray-400">Loading records...</td></tr>
                ) : grades.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-gray-400">No grading records found. Add your first tank log.</td></tr>
                ) : (
                  grades.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{item.tankName}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{item.date || '—'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-blue-600">
                        {item.varietyName}
                      </td>
                      <td className="py-3.5 px-4 space-x-1">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                          {item.sizeCategory}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.qualityGrade === 'Grade A' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          item.qualityGrade === 'Grade B' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {item.qualityGrade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-gray-900">
                        {item.quantity} pcs
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleEdit(item)} title="Edit" className="w-7 h-7 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center transition-all cursor-pointer">✏️</button>
                          <button onClick={() => handleDelete(item.id)} title="Delete" className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-all cursor-pointer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}