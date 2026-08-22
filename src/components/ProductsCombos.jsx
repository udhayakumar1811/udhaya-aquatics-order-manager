import React from 'react';

export default function ProductsCombos() {
  const varieties = [
    { name: 'Full Red Guppy', price: '₹300 / Pair', stock: 'Available' },
    { name: 'Albino Koi Guppy', price: '₹350 / Pair', stock: 'Available' },
    { name: 'Blue Moscow Guppy', price: '₹400 / Pair', stock: 'Available' },
    { name: 'Black Cobra Guppy', price: '₹250 / Pair', stock: 'Available' }
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Products & Combos</h2>
      <p className="text-sm text-slate-500 mb-6">Manage your fish varieties and pricing units.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {varieties.map((v, i) => (
          <div key={i} className="p-4 border rounded-xl flex justify-between items-center bg-slate-50">
            <div>
              <h4 className="font-bold text-slate-800">{v.name}</h4>
              <p className="text-xs text-slate-500 mt-1">Standard selling unit: Pair (Pr.)</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-blue-600">{v.price}</span>
              <div className="text-xs text-emerald-600 font-semibold mt-1">{v.stock}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}