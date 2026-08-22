import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function ProductAnalytics() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // புராஜெக்ட்டில் உள்ள ஆர்டர்களில் இருந்து பொருட்களைப் பிரித்து கணக்கிடுதல்
  const productMap = {};

  orders.forEach(order => {
    // order-ல் உள்ள items லிஸ்ட் அல்லது itemsSummary-ஐ கையாளுதல்
    const items = order.items || [{ name: order.itemsSummary || 'Guppies Pair', type: 'FISH', unitType: 'Pair', qty: 1, price: order.billTotal || 0 }];
    
    items.forEach(item => {
      const name = item.name || 'General Fish';
      if (!productMap[name]) {
        productMap[name] = {
          name: name,
          category: item.type || 'FISH',
          totalUnits: 0,
          totalSales: 0,
          unitTypes: {}
        };
      }
      const qty = Number(item.qty || 1);
      const price = Number(item.price || order.billTotal || 0);
      
      productMap[name].totalUnits += qty;
      productMap[name].totalSales += price;

      const uType = item.unitType || 'Pair';
      productMap[name].unitTypes[uType] = (productMap[name].unitTypes[uType] || 0) + qty;
    });
  });

  const productsList = Object.values(productMap);
  const maxUnits = Math.max(...productsList.map(p => p.totalUnits), 1);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 text-sm">
      
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800">Product & Combo Analytics</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Analyze which fish varieties and combo packs sell the most using charts.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">Loading analytics...</div>
      ) : productsList.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">No product sales data found yet.</div>
      ) : (
        <>
          {/* Bar Chart Section */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-center font-bold text-gray-700 text-xs uppercase tracking-wider">Top Selling Fish Varieties & Combos</h3>
            
            <div className="flex justify-center items-center gap-2 text-xs text-gray-500">
              <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block"></span>
              <span>Units Sold</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 items-end h-64 border-b border-gray-200 pb-2">
              {productsList.map((prod, idx) => {
                const heightPercent = (prod.totalUnits / maxUnits) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end">
                    <span className="text-xs font-bold text-gray-700 mb-1">{prod.totalUnits}</span>
                    <div 
                      className="w-full bg-blue-500 rounded-t-lg transition-all duration-500" 
                      style={{ height: `${Math.max(heightPercent, 15)}%` }}
                    ></div>
                    <span className="text-xs font-semibold text-gray-700 mt-2 text-center truncate w-full">{prod.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {productsList.map((prod, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {prod.category}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">{prod.totalUnits} Units Sold</span>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-base">{prod.name}</h3>
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <p className="font-semibold text-[11px] text-gray-400 uppercase">Unit Type Breakdown:</p>
                    {Object.entries(prod.unitTypes).map(([uType, count], uIdx) => (
                      <p key={uIdx} className="bg-gray-50 px-2 py-1 rounded inline-block mr-1">
                        {uType}: {count}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-500">Total Sales:</span>
                  <span className="font-bold text-emerald-600 text-sm">₹{prod.totalSales}</span>
                </div>

              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}