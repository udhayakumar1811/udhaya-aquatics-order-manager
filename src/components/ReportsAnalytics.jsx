<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function ReportsAnalytics() {
=======
import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

const STATUS_COLORS = {
  Pending: '#f59e0b',
  Packed: '#3b82f6',
  Shipped: '#a855f7',
  Delivered: '#10b981',
};

function DonutChart({ segments, centerLabel }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <div className="w-48 h-48 rounded-full border-[18px] border-slate-100 flex items-center justify-center">
        <span className="text-xs text-slate-400">No data</span>
      </div>
    );
  }

  const visibleSegments = segments.filter((s) => s.value > 0);
  const stops = visibleSegments
    .map((s, i) => {
      const before = visibleSegments.slice(0, i).reduce((sum, x) => sum + x.value, 0);
      const start = (before / total) * 360;
      const end = ((before + s.value) / total) * 360;
      return `${s.color} ${start}deg ${end}deg`;
    })
    .join(', ');

  return (
    <div
      className="w-48 h-48 rounded-full flex items-center justify-center shadow-inner relative"
      style={{ background: `conic-gradient(${stops})` }}
    >
      <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center">
        <span className="text-sm font-bold text-slate-700 text-center px-2">{centerLabel}</span>
      </div>
    </div>
  );
}

export default function ReportsAnalytics() {
  const { showToast } = useToast();
>>>>>>> claude-upgrade
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

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.revenueTotal || o.billTotal || 0), 0);
  const totalNetProfit = orders.reduce((sum, o) => sum + Number(o.netProfit || 0), 0);
<<<<<<< HEAD
  
  const thermocolCount = orders.filter(o => (o.boxType || o.boxChoice) === 'Thermocol').length;
  const totalBoxes = orders.length;

  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,Order ID,Date,Customer Name,Phone,Bill Total,Net Profit,Status,Box Type\n";
    orders.forEach(o => {
      csvContent += `"${o.orderId || o.id}","${o.date || ''}","${o.customerName || ''}","${o.phone || o.mobileNumber || ''}","${o.revenueTotal || o.billTotal || 0}","${o.netProfit || 0}","${o.status || o.orderStatus || 'Pending'}","${o.boxType || o.boxChoice || 'Cardboard'}"\n`;
=======

  const thermocolCount = orders.filter(o => (o.boxType || o.boxChoice) === 'Thermocol').length;
  const cardboardCount = orders.filter(o => (o.boxType || o.boxChoice) === 'Cardboard').length;
  const totalBoxes = orders.length;

  const statusCounts = { Pending: 0, Packed: 0, Shipped: 0, Delivered: 0 };
  orders.forEach((o) => {
    const status = o.status || o.orderStatus || 'Pending';
    if (statusCounts[status] !== undefined) statusCounts[status] += 1;
  });

  const exportToCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,Order ID,Date,Customer Name,Phone,Bill Total,Net Profit,Status,Box Type\n";
    orders.forEach(o => {
      csvContent += `"${o.orderId || o.id}","${o.date || ''}","${o.customerName || ''}","${o.phone || o.mobileNumber || ''}","${o.revenueTotal || o.billTotal || 0}","${o.netProfit || 0}","${o.status || o.orderStatus || 'Pending'}","${o.boxType || o.boxChoice || ''}"\n`;
>>>>>>> claude-upgrade
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "business_reports_analysis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
<<<<<<< HEAD
=======
    showToast('Report exported.', 'success');
>>>>>>> claude-upgrade
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Business Reports & Net Profit Analysis</h1>
          <p className="text-xs text-gray-500 mt-0.5">Overview of sales, net profit, packing metrics, and data export.</p>
        </div>
        <button
<<<<<<< HEAD
          onClick={exportToExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <span>📊 Export Excel Spreadsheet (.xlsx)</span>
=======
          onClick={exportToCsv}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <span>📊 Export CSV</span>
>>>>>>> claude-upgrade
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading reports...</div>
<<<<<<< HEAD
=======
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">No orders yet — reports will appear once you add some.</div>
>>>>>>> claude-upgrade
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL REVENUE (INCL. SHIPPING)</p>
<<<<<<< HEAD
              <h3 className="text-3xl font-extrabold text-indigo-600 mt-2">₹{totalRevenue}</h3>
=======
              <h3 className="text-3xl font-extrabold text-indigo-600 mt-2">₹{totalRevenue.toLocaleString()}</h3>
>>>>>>> claude-upgrade
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL NET PROFIT (நிகர லாபம்)</p>
<<<<<<< HEAD
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">₹{totalNetProfit}</h3>
=======
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">₹{totalNetProfit.toLocaleString()}</h3>
>>>>>>> claude-upgrade
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">THERMOCOL VS CARDBOARD USED</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{thermocolCount} / {totalBoxes}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-center font-bold text-gray-800 text-xs uppercase tracking-wider">Order Status Ratio</h3>
<<<<<<< HEAD
              
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
=======

              <div className="flex justify-center items-center gap-4 text-xs text-gray-600 flex-wrap">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <span key={status} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: color }}></span>
                    {status} ({statusCounts[status]})
                  </span>
                ))}
              </div>

              <div className="flex justify-center py-4">
                <DonutChart
                  centerLabel={`${totalBoxes} orders`}
                  segments={Object.entries(statusCounts).map(([status, value]) => ({
                    value,
                    color: STATUS_COLORS[status],
                  }))}
                />
>>>>>>> claude-upgrade
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-center font-bold text-gray-800 text-xs uppercase tracking-wider">Packaging Box Preference</h3>
<<<<<<< HEAD
              
              <div className="flex justify-center items-center gap-6 text-xs text-gray-600">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#06b6d4' }}></span> Thermocol Box 🧊</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#f59e0b' }}></span> Cardboard Box 📦</span>
              </div>

              <div className="flex justify-center py-4">
                <div className="w-48 h-48 rounded-full border-[18px] flex items-center justify-center bg-white shadow-inner relative" style={{ borderColor: '#f59e0b' }}>
                  <div className="w-24 h-24 bg-white rounded-full"></div>
                </div>
=======

              <div className="flex justify-center items-center gap-6 text-xs text-gray-600">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#06b6d4' }}></span> Thermocol ({thermocolCount})</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#f59e0b' }}></span> Cardboard ({cardboardCount})</span>
              </div>

              <div className="flex justify-center py-4">
                <DonutChart
                  centerLabel={`${totalBoxes} orders`}
                  segments={[
                    { value: thermocolCount, color: '#06b6d4' },
                    { value: cardboardCount, color: '#f59e0b' },
                  ]}
                />
>>>>>>> claude-upgrade
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> claude-upgrade
