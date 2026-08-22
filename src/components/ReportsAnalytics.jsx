import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function ReportsAnalytics() {
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

  // கணக்கீடுகள்
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.billTotal || 0), 0);
  const totalNetProfit = orders.reduce((sum, o) => sum + Number(o.netProfit || 0), 0);
  
  // Thermocol vs Cardboard கணக்கீடு
  const thermocolCount = orders.filter(o => o.boxType === 'Thermocol' || o.boxType === 'thermocol').length;
  const totalBoxes = orders.length;

  // Excel Export
  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,Order ID,Date,Customer Name,Phone,Bill Total,Net Profit,Status,Box Type\n";
    orders.forEach(o => {
      csvContent += `"${o.orderId || o.id}","${o.date || ''}","${o.customerName || ''}","${o.phone || ''}","${o.billTotal || 0}","${o.netProfit || 0}","${o.status || 'Pending'}","${o.boxType || 'Cardboard'}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "business_reports_analysis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header & Export Button */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Business Reports & Net Profit Analysis</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Overview of sales, net profit, packing metrics, and data export.
          </p>
        </div>
        <button
          onClick={exportToExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <span>📊 Export Excel Spreadsheet (.xlsx)</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading reports...</div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Total Revenue */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL REVENUE (INCL. SHIPPING)</p>
              <h3 className="text-3xl font-extrabold text-indigo-600 mt-2">₹{totalRevenue}</h3>
            </div>

            {/* Total Net Profit */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL NET PROFIT (நிகர லாபம்)</p>
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">₹{totalNetProfit}</h3>
            </div>

            {/* Box Used */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">THERMOCOL VS CARDBOARD USED</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{thermocolCount} / {totalBoxes}</h3>
            </div>

          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Order Status Ratio */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-center font-bold text-gray-800 text-xs uppercase tracking-wider">Order Status Ratio</h3>
              
              <div className="flex justify-center items-center gap-4 text-xs text-gray-600 flex-wrap">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#f59e0b' }}></span> Pending</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#3b82f6' }}></span> Packed</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#a855f7' }}></span> Shipped</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#10b981' }}></span> Delivered</span>
              </div>

              <div className="flex justify-center py-4">
                <div className="w-48 h-48 rounded-full border-[18px] flex items-center justify-center bg-white shadow-inner relative" style={{ borderColor: '#f59e0b' }}>
                  <div className="w-24 h-24 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Packaging Box Preference */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-center font-bold text-gray-800 text-xs uppercase tracking-wider">Packaging Box Preference</h3>
              
              <div className="flex justify-center items-center gap-6 text-xs text-gray-600">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#06b6d4' }}></span> Thermocol Box 🧊</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#f59e0b' }}></span> Cardboard Box 📦</span>
              </div>

              <div className="flex justify-center py-4">
                <div className="w-48 h-48 rounded-full border-[18px] flex items-center justify-center bg-white shadow-inner relative" style={{ borderColor: '#f59e0b' }}>
                  <div className="w-24 h-24 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}