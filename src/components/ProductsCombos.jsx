import { useEffect, useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

const emptyForm = { name: '', price: '', unit: 'Pair (பேர்)', status: 'Available' };

export default function ProductsCombos() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      console.error('Error loading products: ', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setForm({ name: product.name, price: product.price, unit: product.unit, status: product.status });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || Number(form.price) <= 0) {
      showToast('Enter a name and a price greater than 0.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), { ...form, price: Number(form.price) });
        showToast('Product updated.', 'success');
      } else {
        await addDoc(collection(db, 'products'), { ...form, price: Number(form.price) });
        showToast('Product added.', 'success');
      }
      cancelEdit();
    } catch (error) {
      console.error('Error saving product: ', error);
      showToast('Could not save the product. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this product from the catalog?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      showToast('Product removed.', 'success');
    } catch (error) {
      console.error('Error deleting product: ', error);
      showToast('Could not remove the product. Please try again.', 'error');
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 text-sm">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800">Products & Combos</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage your fish varieties, combos, and reference pricing.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Full Red Guppy" className="w-full p-2 border rounded text-sm bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Price (₹) *</label>
          <input type="number" min="0" name="price" value={form.price} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Unit</label>
          <input type="text" name="unit" value={form.unit} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white">
            <option value="Available">Available</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
        <div className="md:col-span-5 flex gap-2 justify-end">
          {editingId && (
            <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          )}
          <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-lg">
            {saving ? 'Saving...' : editingId ? 'Save Changes' : '+ Add Product'}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">No products yet. Add your first fish variety or combo above.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((prod) => (
            <div key={prod.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{prod.name}</h3>
                <p className="text-xs text-gray-400 mt-1">Standard selling unit: {prod.unit}</p>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <div className="font-bold text-blue-600 text-base">₹{prod.price}</div>
                  <div className={`text-xs font-semibold mt-1 ${prod.status === 'Available' ? 'text-emerald-600' : 'text-rose-500'}`}>{prod.status}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => startEdit(prod)} aria-label={`Edit ${prod.name}`} className="w-7 h-7 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">✏️</button>
                  <button onClick={() => handleDelete(prod.id)} aria-label={`Delete ${prod.name}`} className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
