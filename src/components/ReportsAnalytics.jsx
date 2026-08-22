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
  
  const thermocolCount = orders.filter(o => o.boxType === 'Thermocol').length;
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
    <div className="p-4 max-w-7xl mx-auto space-y-4 text-sm">
      
      {/* Top Header & Export Button */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Business Reports & Net Profit Analysis</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Overview of sales, net profit, packing metrics, and data export.
          </p>
        </div>
        <button
          onClick={exportToExcel}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
        >
          <span>📊 Export Excel Spreadsheet (.xlsx)</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">Loading reports...</div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Total Revenue */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">TOTAL REVENUE (INCL. SHIPPING)</p>
              <h3 className="text-3xl font-bold text-indigo-600 mt-1">₹{totalRevenue}</h3>
            </div>

            {/* Total Net Profit */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">TOTAL NET PROFIT (நிகர லாபம்)</p>
              <h3 className="text-3xl font-bold text-emerald-600 mt-1">₹{totalNetProfit}</h3>
            </div>

            {/* Box Used */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">THERMOCOL VS CARDBOARD USED</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{thermocolCount} / {totalBoxes}</h3>
            </div>

          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Order Status Ratio */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-center font-bold text-gray-700 text-xs uppercase tracking-wider">Order Status Ratio</h3>
              
              <div className="flex justify-center items-center gap-4 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded-sm"></span> Pending</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Packed</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-sm"></span> Shipped</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Delivered</span>
              </div>

              <div className="flex justify-center py-6">
                <div className="w-40 h-40 rounded-full border-8 border-amber-500 flex items-center justify-center bg-white shadow-inner">
                  <div className="w-20 h-20 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Packaging Box Preference */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-center font-bold text-gray-700 text-xs uppercase tracking-wider">Packaging Box Preference</h3>
              
              <div className="flex justify-center items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-cyan-500 rounded-sm"></span> Thermocol Box 🧊</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded-sm"></span> Cardboard Box 📦</span>
              </div>

              <div className="flex justify-center py-6">
                <div className="w-40 h-40 rounded-full border-8 border-amber-500 flex items-center justify-center bg-white shadow-inner">
                  <div className="w-20 h-20 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}