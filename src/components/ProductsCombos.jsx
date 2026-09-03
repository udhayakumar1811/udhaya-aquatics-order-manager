<<<<<<< HEAD
import React from 'react';

export default function ProductsCombos() {
  const products = [
    { name: "Full Red Guppy", price: "300", unit: "Pair (Pr.)", status: "Available" },
    { name: "Albino Koi Guppy", price: "350", unit: "Pair (Pr.)", status: "Available" },
    { name: "Blue Moscow Guppy", price: "400", unit: "Pair (Pr.)", status: "Available" },
    { name: "Black Cobra Guppy", price: "250", unit: "Pair (Pr.)", status: "Available" }
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 text-sm">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800">Products & Combos</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage your fish varieties and pricing units.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((prod, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900 text-base">{prod.name}</h3>
              <p className="text-xs text-gray-400 mt-1">Standard selling unit: {prod.unit}</p>
            </div>
            <div className="text-right">
              <div className="font-bold text-blue-600 text-base">₹{prod.price} / Pair</div>
              <div className="text-xs font-semibold text-emerald-600 mt-1">{prod.status}</div>
            </div>
          </div>
        ))}
      </div>
=======
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function ProductsCombos() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    price: '',
    costPrice: '',
    qty: '',
    unit: 'Pair (Pr.)',
    status: 'Available'
  });

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prodsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(prodsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;

    try {
      await addDoc(collection(db, 'products'), {
        name: form.name,
        price: Number(form.price),
        costPrice: Number(form.costPrice || 0),
        qty: Number(form.qty || 0),
        unit: form.unit,
        status: form.status,
        createdAt: serverTimestamp()
      });
      setForm({ name: '', price: '', costPrice: '', qty: '', unit: 'Pair (Pr.)', status: 'Available' });
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        console.error("Error deleting product: ", error);
      }
    }
  };

  // கணக்கீடுகள்
  const totalStockQty = products.reduce((sum, p) => sum + Number(p.qty || 0), 0);
  const totalInvestment = products.reduce((sum, p) => sum + (Number(p.costPrice || 0) * Number(p.qty || 0)), 0);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6 text-sm">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Products, Combos & Stock Management</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage your fish varieties, stock quantity, and total investment.</p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">📦 TOTAL STOCK QUANTITY</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{totalStockQty} Units</h3>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-base">📦</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">💰 TOTAL INVESTMENT</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹{totalInvestment.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-base">💰</div>
        </div>
      </div>

      {/* Add Product Form */}
      <form onSubmit={handleAddProduct} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Add New Fish Variety / Combo / Stock</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input 
              type="text" 
              placeholder="e.g. Full Red Guppy" 
              value={form.name} 
              onChange={(e) => setForm({...form, name: e.target.value})} 
              required 
              className="w-full p-2 border rounded-lg text-xs bg-white" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price (₹) *</label>
            <input 
              type="number" 
              placeholder="e.g. 300" 
              value={form.price} 
              onChange={(e) => setForm({...form, price: e.target.value})} 
              required 
              className="w-full p-2 border rounded-lg text-xs bg-white" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cost Price (₹)</label>
            <input 
              type="number" 
              placeholder="e.g. 150" 
              value={form.costPrice} 
              onChange={(e) => setForm({...form, costPrice: e.target.value})} 
              className="w-full p-2 border rounded-lg text-xs bg-white" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Stock Qty</label>
            <input 
              type="number" 
              placeholder="e.g. 20" 
              value={form.qty} 
              onChange={(e) => setForm({...form, qty: e.target.value})} 
              className="w-full p-2 border rounded-lg text-xs bg-white" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select 
              value={form.status} 
              onChange={(e) => setForm({...form, status: e.target.value})} 
              className="w-full p-2 border rounded-lg text-xs bg-white"
            >
              <option value="Available">Available</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2 rounded-lg shadow-sm transition-all">
            + Add Product / Stock
          </button>
        </div>
      </form>

      {/* Products List Grid */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">No products added yet. Use the form above to add products.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((prod) => (
            <div key={prod.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{prod.name}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Stock Qty: <span className="font-semibold text-blue-600">{prod.qty || 0}</span> | Cost: ₹{prod.costPrice || 0}
                </p>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <div className="font-bold text-blue-600 text-base">₹{prod.price}</div>
                  <div className="text-xs font-semibold text-emerald-600 mt-0.5">{prod.status}</div>
                </div>
                <button onClick={() => handleDelete(prod.id)} className="text-red-500 hover:text-red-700 p-1 text-xs" title="Delete">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

>>>>>>> claude-upgrade
    </div>
  );
}