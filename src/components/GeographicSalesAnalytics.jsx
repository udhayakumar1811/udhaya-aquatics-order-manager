import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function GeographicSalesAnalytics() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // ALL, TAMIL_NADU, SOUTH_OTHER, NORTH_INDIA

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(data);
      } catch (err) {
        console.error("Error loading geographic orders:", err);
        showToast('Could not load shipping distribution data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Helper to categorize state
  const getStateCategory = (stateName = '', pin = '') => {
    const s = stateName.trim().toLowerCase();
    if (s.includes('tamil') || s.includes('tn') || s.includes('rajapalayam')) {
      return 'TAMIL_NADU';
    } else if (
      s.includes('kerala') || s.includes('karnataka') || 
      s.includes('andhra') || s.includes('telangana') || s.includes('ap') || s.includes('ts')
    ) {
      return 'SOUTH_OTHER';
    } else {
      return 'NORTH_INDIA';
    }
  };

  // Group orders by Region -> State -> District/City
  const groupedData = {
    TAMIL_NADU: { title: '1. Tamil Nadu (தமிழ்நாடு)', states: {} },
    SOUTH_OTHER: { title: '2. South India States (கேரளா, கர்நாடகா, ஆந்திரா, தெலங்கானா)', states: {} },
    NORTH_INDIA: { title: '3. Rest of India / North India (வட மற்றும் பிற மாநிலங்கள்)', states: {} }
  };

  orders.forEach(order => {
    const stateName = (order.state || 'Tamil Nadu').trim();
    const districtName = (order.city || order.district || 'General / Unknown').trim();
    const category = getStateCategory(stateName, order.pincode);

    if (!groupedData[category].states[stateName]) {
      groupedData[category].states[stateName] = {
        totalParcels: 0,
        totalRevenue: 0,
        districts: {}
      };
    }

    const stateObj = groupedData[category].states[stateName];
    stateObj.totalParcels += 1;
    stateObj.totalRevenue += Number(order.revenueTotal || order.billTotal || 0);

    if (!stateObj.districts[districtName]) {
      stateObj.districts[districtName] = { count: 0, revenue: 0, orders: [] };
    }

    stateObj.districts[districtName].count += 1;
    stateObj.districts[districtName].revenue += Number(order.revenueTotal || order.billTotal || 0);
    stateObj.districts[districtName].orders.push(order);
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Geographic Courier & Sales Distribution</h1>
          <p className="text-xs text-gray-500 mt-0.5">Analyze parcel shipments and revenue breakdown across Tamil Nadu, South Indian states, and North India.</p>
        </div>

        <div className="flex gap-2">
          {['ALL', 'TAMIL_NADU', 'SOUTH_OTHER', 'NORTH_INDIA'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'ALL' ? 'All Regions' : cat === 'TAMIL_NADU' ? 'Tamil Nadu' : cat === 'SOUTH_OTHER' ? 'South States' : 'North India'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading geographic data...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 space-y-2">
          <p className="text-3xl">🗺️</p>
          <p className="font-medium">No order data found to generate geographic distribution.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedData).map(([catKey, categoryGroup]) => {
            if (selectedCategory !== 'ALL' && selectedCategory !== catKey) return null;
            const hasStates = Object.keys(categoryGroup.states).length > 0;
            if (!hasStates) return null;

            return (
              <div key={catKey} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex justify-between items-center">
                  <span>{categoryGroup.title}</span>
                  <span className="text-slate-400 font-mono">
                    Total Parcels: {Object.values(categoryGroup.states).reduce((sum, s) => sum + s.totalParcels, 0)}
                  </span>
                </div>

                <div className="p-5 space-y-6">
                  {Object.entries(categoryGroup.states).map(([stateName, stateData]) => (
                    <div key={stateName} className="space-y-3 pb-5 border-b border-gray-100 last:border-none last:pb-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          {stateName}
                        </h3>
                        <div className="flex gap-4 text-xs">
                          <span className="text-gray-500">Parcels: <strong className="text-gray-800">{stateData.totalParcels}</strong></span>
                          <span className="text-gray-500">Revenue: <strong className="text-emerald-600">₹{stateData.totalRevenue.toLocaleString()}</strong></span>
                        </div>
                      </div>

                      {/* Districts Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pl-4">
                        {Object.entries(stateData.districts).map(([districtName, distData]) => (
                          <div key={districtName} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-800 text-xs">{districtName}</span>
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                                {distData.count} {distData.count === 1 ? 'Parcel' : 'Parcels'}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 flex justify-between pt-1">
                              <span>Sales Amount:</span>
                              <span className="font-semibold text-gray-800">₹{distData.revenue.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}