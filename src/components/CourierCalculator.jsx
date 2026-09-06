import { useState } from 'react';

export default function CourierCalculator() {
  const [pincode, setPincode] = useState('');
  const [pairsCount, setPairsCount] = useState(2); // Number of pairs ordered
  const [boxType, setBoxType] = useState('Thermocol'); // Thermocol / Cardboard
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Function to calculate exact rate based on the Professional Couriers tariff image
  const calculateTariff = (pin, totalWeightGrams) => {
    const pinNum = parseInt(pin);
    let zone = 'Tamil Nadu';
    let baseRateUpTo1Kg = 50;
    let above1KgExtraPer250gms = 15;

    // 1. Zone & Tariff Identification from Image
    if (pin >= 626100 && pin <= 626125) { // Rajapalayam local range
      zone = 'Local within Rajapalayam';
      baseRateUpTo1Kg = 50; // Image says Up to 1Kg = 50 (Surface Transit)
      above1KgExtraPer250gms = 10;
    } else if (pinNum >= 600000 && pinNum <= 649999) {
      zone = 'Tamil Nadu';
      baseRateUpTo1Kg = 50;
      above1KgExtraPer250gms = 15;
    } else if (
      (pinNum >= 670000 && pinNum <= 699999) || // Kerala
      (pinNum >= 560000 && pinNum <= 592999) || // Karnataka
      (pinNum >= 500000 && pinNum <= 534999) || // Andhra Pradesh
      (pinNum >= 500000 && pinNum <= 509999)    // Telangana (approx range)
    ) {
      zone = 'Kerala, Karnataka, Andhra Pradesh & Telangana';
      baseRateUpTo1Kg = 80;
      above1KgExtraPer250gms = 25;
    } else {
      zone = 'Rest Of India (Surface Transit)';
      baseRateUpTo1Kg = 250;
      above1KgExtraPer250gms = 50;
    }

    // 2. Calculate Actual Courier Cost based on weight
    let actualCourierCost = baseRateUpTo1Kg;
    if (totalWeightGrams > 1000) {
      const extraGrams = totalWeightGrams - 1000;
      const extraSlots = Math.ceil(extraGrams / 250);
      actualCourierCost += (extraSlots * above1KgExtraPer250gms);
    }

    // 3. Customer Shipping Charge Slab (as requested)
    let customerShippingCharge = 100;
    if (pairsCount >= 1 && pairsCount <= 3) {
      customerShippingCharge = 100;
    } else if (pairsCount >= 4 && pairsCount <= 5) {
      customerShippingCharge = 150;
    } else {
      customerShippingCharge = 200;
    }

    return {
      zone,
      actualCourierCost,
      customerShippingCharge,
      profitOrLossOnShipping: customerShippingCharge - actualCourierCost
    };
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      alert('Please enter a valid 6-digit Pincode.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Weight Calculation logic:
      // Box weight: Thermocol (~300g), Cardboard (~200g)
      const baseBoxWeight = boxType === 'Thermocol' ? 300 : 200;
      // Each fish pair bag with water & oxygen ~ 120g
      const totalFishWeight = pairsCount * 120;
      const totalWeightGrams = baseBoxWeight + totalFishWeight;
      const totalWeightKg = (totalWeightGrams / 1000).toFixed(2);

      const tariffData = calculateTariff(pincode, totalWeightGrams);

      setResult({
        pincode,
        pairsCount,
        boxType,
        totalWeightGrams,
        totalWeightKg,
        ...tariffData
      });
      setLoading(false);
    }, 300);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Professional Courier Rate & Shipping Calculator</h1>
        <p className="text-xs text-gray-500 mt-0.5">Calculates actual courier tariff (based on Rajapalayam tariff card) and customer shipping slabs automatically.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 h-fit">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Shipment Parameters</h2>
          
          <form onSubmit={handleCalculate} className="space-y-4">
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Number of Fish Pairs (கப்பி ஜோடிகள்)</label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={pairsCount}
                onChange={(e) => setPairsCount(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <p className="text-[10px] text-gray-400 mt-1">1-3 Pairs: ₹100 | 4-5 Pairs: ₹150 | 6+ Pairs: ₹200</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Packing Box Type</label>
              <select
                value={boxType}
                onChange={(e) => setBoxType(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Thermocol">Thermocol Box (~300g)</option>
                <option value="Cardboard">Cardboard Box (~200g)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Calculating Tariff...' : 'Calculate Shipping & Rates'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="md:col-span-2 space-y-4">
          {!result ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 space-y-2">
              <p className="text-3xl">⚖️</p>
              <p className="font-medium">Enter destination pincode and pair quantity to evaluate courier cost vs customer charge.</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Pincode: {result.pincode}</h3>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">Zone: {result.zone}</p>
                </div>
                <div className="text-right">
                  <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-xl text-xs font-bold border border-purple-100">
                    Total Weight: {result.totalWeightKg} KG ({result.totalWeightGrams} g)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actual Courier Cost</p>
                  <p className="text-2xl font-extrabold text-rose-600">₹{result.actualCourierCost}</p>
                  <p className="text-[10px] text-gray-500">Payable at courier office</p>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Customer Charge</p>
                  <p className="text-2xl font-extrabold text-emerald-600">₹{result.customerShippingCharge}</p>
                  <p className="text-[10px] text-gray-500">Collected from customer</p>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Net Shipping Margin</p>
                  <p className={`text-2xl font-extrabold ${result.profitOrLossOnShipping >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {result.profitOrLossOnShipping >= 0 ? `+₹${result.profitOrLossOnShipping}` : `-₹{Math.abs(result.profitOrLossOnShipping)}`}
                  </p>
                  <p className="text-[10px] text-gray-500">Shipping buffer amount</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
                <p className="font-bold">💡 Packing Breakdown Analysis:</p>
                <p>• Box Used: {result.boxType} ({result.boxType === 'Thermocol' ? '300g' : '200g'})</p>
                <p>• Fish Bags: {result.pairsCount} Pairs (~{result.pairsCount * 120}g with water & oxygen)</p>
                <p>• Based on Professional Couriers Rajapalayam Surface Transit Tariff card.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}