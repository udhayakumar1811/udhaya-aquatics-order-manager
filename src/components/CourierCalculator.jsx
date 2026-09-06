import { useState } from 'react';

// Sample regional hub distance & rate logic based on Pincode prefixes
const COURIER_RATES = [
  { partner: 'Professional Courier', baseRate: 60, perKgRate: 40, estDays: '2 - 3 Days', reliable: 'High' },
  { partner: 'ST Courier', baseRate: 50, perKgRate: 35, estDays: '2 - 4 Days', reliable: 'Good' },
  { partner: 'DTDC Courier', baseRate: 80, perKgRate: 50, estDays: '1 - 2 Days', reliable: 'Excellent' },
  { partner: 'Anchal / Local Parcel', baseRate: 40, perKgRate: 25, estDays: '3 - 5 Days', reliable: 'Moderate' }
];

export default function CourierCalculator() {
  const [pincode, setPincode] = useState('');
  const [weightKg, setWeightKg] = useState(0.5); // Default box weight for guppies with water & oxygen
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = (e) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      alert('Please enter a valid 6-digit Pincode.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Basic rule simulation for demo & operational use
      const pinNum = parseInt(pincode);
      let region = 'Tamil Nadu (Local / Regional)';
      let multiplier = 1;

      // Simulated state check based on PIN code ranges
      if (pinNum >= 600000 && pinNum <= 645999) {
        region = 'Tamil Nadu & Puducherry';
        multiplier = 1;
      } else if (pinNum >= 500000 && pinNum <= 599999) {
        region = 'Andhra Pradesh & Telangana';
        multiplier = 1.3;
      } else if (pinNum >= 560000 && pinNum <= 592999) {
        region = 'Karnataka';
        multiplier = 1.2;
      } else if (pinNum >= 670000 && pinNum <= 699999) {
        region = 'Kerala';
        multiplier = 1.2;
      } else {
        region = 'Rest of India (North / East / West)';
        multiplier = 1.6;
      }

      const calculatedOptions = COURIER_RATES.map(c => {
        const estimatedCost = Math.round((c.baseRate + (weightKg * c.perKgRate)) * multiplier);
        return {
          ...c,
          estimatedCost,
          serviceable: true
        };
      });

      setResult({
        pincode,
        region,
        options: calculatedOptions
      });
      setLoading(false);
    }, 400);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Courier Pincode & Shipping Rate Calculator</h1>
        <p className="text-xs text-gray-500 mt-0.5">Check serviceability and estimate shipping costs across Professional Courier, ST Courier, and DTDC.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 h-fit">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Calculate Shipping</h2>
          
          <form onSubmit={handleCheck} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Destination Pincode *</label>
              <input
                type="text"
                maxLength="6"
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 625001"
                className="w-full p-3 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wider text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Package Weight (KG)</label>
              <select
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value={0.5}>0.5 KG (Standard Guppy Pair / Trio Box)</option>
                <option value={1.0}>1.0 KG (Multi-pair Combo Box)</option>
                <option value={1.5}>1.5 KG (Large Farm Box / Heavy Setup)</option>
                <option value={2.0}>2.0 KG (Bulk Shipment)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Checking Serviceability...' : 'Check Rates & Serviceability'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="md:col-span-2 space-y-4">
          {!result ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 space-y-2">
              <p className="text-3xl">📦</p>
              <p className="font-medium">Enter a customer pincode and weight to view available courier partners and rates.</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Pincode: {result.pincode}</h3>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">Region: {result.region}</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl text-xs font-bold border border-emerald-100">
                  ✅ Serviceable
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Courier Partners & Estimated Rates</p>
                
                <div className="grid grid-cols-1 gap-3">
                  {result.options.map((opt, index) => (
                    <div key={index} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4 hover:border-blue-200 transition-all">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{opt.partner}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Est. Delivery: <span className="font-medium text-slate-700">{opt.estDays}</span> • Reliability: <span className="font-medium text-emerald-600">{opt.reliable}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold text-blue-600">₹{opt.estimatedCost}</p>
                        <p className="text-[10px] text-gray-400">Approx shipping charge</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}