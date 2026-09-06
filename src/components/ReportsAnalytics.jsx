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
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ordersLoaded = false;
    let expensesLoaded = false;

    const checkLoading = () => {
      if (ordersLoaded && expensesLoaded) setLoading(false);
    };

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
      ordersLoaded = true;
      checkLoading();
    });

    const qExpenses = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
      expensesLoaded = true;
      checkLoading();
    });

    return () => {
      unsubOrders();
      unsubExpenses();
    };
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.revenueTotal || o.billTotal || 0), 0);
  const ordersEstimatedProfit = orders.reduce((sum, o) => sum + Number(o.netProfit || 0), 0);
  
  // Total business expenses (Petrol, courier, maintenance, stock purchases, etc.)
  const totalBusinessExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  // Real Net Profit = Orders Estimated Profit - General Business Expenses
  const realNetProfit = ordersEstimatedProfit - totalBusinessExpenses;

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
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "business_reports_analysis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report exported.', 'success');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Business Reports & P&L Analysis</h1>
          <p className="text-xs text-gray-500 mt-0.5">Overview of sales, total expenses, real net profit, and analytics.</p>
        </div>
        <button
          onClick={exportToCsv}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <span>📊 Export CSV</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading reports...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL REVENUE</p>
              <h3 className="text-3xl font-extrabold text-indigo-600 mt-2">₹{totalRevenue.toLocaleString()}</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">TOTAL EXPENSES (பெட்ரோல்/செலவு)</p>
              <h3 className="text-3xl font-extrabold text-rose-600 mt-2">₹{totalBusinessExpenses.toLocaleString()}</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">REAL NET PROFIT (உண்மையான லாபம்)</p>
              <h3 className={`text-3xl font-extrabold mt-2 ${realNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ₹{realNetProfit.toLocaleString()}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">PACKING BOXES USED</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{thermocolCount} / {totalBoxes}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-center font-bold text-gray-800 text-xs uppercase tracking-wider">Order Status Ratio</h3>

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
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-center font-bold text-gray-800 text-xs uppercase tracking-wider">Packaging Box Preference</h3>

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
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}