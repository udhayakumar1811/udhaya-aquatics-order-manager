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
    </div>
  );
}