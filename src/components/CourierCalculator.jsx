import { useState } from 'react';

export default function CourierCalculator() {
  const [pincode, setPincode] = useState('');
  const [boxSize, setBoxSize] = useState('Small Thermocol'); // Thermocol has box fee, Cardboard is FREE
  
  // Items array to support multiple item types, units, and quantities
  const [items, setItems] = useState([
    { category: 'Fish', unitType: 'Trio (1M+2F)', qty: 2 },
    { category: 'Live Feed', unitType: 'Packet (100g)', qty: 1 }
  ]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const addItemRow = () => {
    setItems([...items, { category: 'Fish', unitType: 'Pair (1M+1F)', qty: 1 }]);
  };

  const removeItemRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Professional Couriers Tariff & Weight Calculation Logic
  const handleCalculate = (e) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      alert('Please enter a valid 6-digit Pincode.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // 1. Box Base Weight & Box Cost Calculation (Cardboard Box is FREE, Thermocol has box fee)
      let boxWeightGrams = 300;
      let boxExtraCost = 0;

      if (boxSize === 'Small Thermocol') {
        boxWeightGrams = 350;
        boxExtraCost = 30; // Thermocol box extra charge
      } else if (boxSize === 'Large Thermocol') {
        boxWeightGrams = 700;
        boxExtraCost = 60; // Thermocol box extra charge
      } else if (boxSize === 'Small Cardboard') {
        boxWeightGrams = 200;
        boxExtraCost = 0; // Cardboard Box is FREE
      } else if (boxSize === 'Large Cardboard') {
        boxWeightGrams = 450;
        boxExtraCost = 0; // Cardboard Box is FREE
      }

      // 2. Total Items Weight Calculation based on category & unit
      let totalItemsWeightGrams = 0;
      let totalPairsOrItemsCount = 0;

      items.forEach(item => {
        const q = Number(item.qty) || 1;
        totalPairsOrItemsCount += q;

        if (item.category === 'Fish') {
          if (item.unitType.includes('Trio')) {
            totalItemsWeightGrams += q * 150; // Trio with water & bag ~ 150g
          } else if (item.unitType.includes('Pair')) {
            totalItemsWeightGrams += q * 120; // Pair ~ 120g
          } else {
            totalItemsWeightGrams += q * 100; // Single/Male/Female ~ 100g
          }
        } else if (item.category === 'Live Feed' || item.category === 'Plants') {
          totalItemsWeightGrams += q * 100; // Feed/Plant packet ~ 100g
        } else {
          totalItemsWeightGrams += q * 200; // Accessories ~ 200g
        }
      });

      const totalWeightGrams = boxWeightGrams + totalItemsWeightGrams;
      const totalWeightKg = (totalWeightGrams / 1000).toFixed(2);

      // 3. Zone & Tariff Identification (Rajapalayam Tariff Card rules)
      const pinNum = parseInt(pincode);
      let zone = 'Tamil Nadu';
      let baseRateUpTo1Kg = 50;
      let above1KgExtraPer250gms = 15;

      if (pinNum >= 626100 && pinNum <= 626125) {
        zone = 'Local within Rajapalayam';
        baseRateUpTo1Kg = 50;
        above1KgExtraPer250gms = 10;
      } else if (pinNum >= 600000 && pinNum <= 649999) {
        zone = 'Tamil Nadu';
        baseRateUpTo1Kg = 50;
        above1KgExtraPer250gms = 15;
      } else if (
        (pinNum >= 670000 && pinNum <= 699999) || // Kerala
        (pinNum >= 560000 && pinNum <= 592999) || // Karnataka
        (pinNum >= 500000 && pinNum <= 534999) || // Andhra Pradesh
        (pinNum >= 500000 && pinNum <= 509999)    // Telangana
      ) {
        zone = 'Kerala, Karnataka, Andhra Pradesh & Telangana';
        baseRateUpTo1Kg = 80;
        above1KgExtraPer250gms = 25;
      } else {
        zone = 'Rest Of India (Surface Transit)';
        baseRateUpTo1Kg = 250;
        above1KgExtraPer250gms = 50;
      }

      // 4. Actual Courier Cost
      let actualCourierCost = baseRateUpTo1Kg;
      if (totalWeightGrams > 1000) {
        const extraGrams = totalWeightGrams - 1000;
        const extraSlots = Math.ceil(extraGrams / 250);
        actualCourierCost += (extraSlots * above1KgExtraPer250gms);
      }

      // 5. Customer Shipping Charge Slab (Dynamic based on quantity & box)
      let baseCustomerShipping = 100;
      if (totalPairsOrItemsCount <= 3) {
        baseCustomerShipping = 100;
      } else if (totalPairsOrItemsCount <= 5) {
        baseCustomerShipping = 150;
      } else {
        baseCustomerShipping = 200;
      }

      const recommendedCustomerCharge = baseCustomerShipping + boxExtraCost;

      setResult({
        pincode,
        zone,
        boxSize,
        boxExtraCost,
        totalWeightGrams,
        totalWeightKg,
        actualCourierCost,
        recommendedCustomerCharge,
        profitMargin: recommendedCustomerCharge - actualCourierCost
      });
      setLoading(false);
    }, 300);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Advanced Courier & Box Weight Calculator</h1>
        <p className="text-xs text-gray-500 mt-0.5">Cardboard boxes are free (₹0 box fee), while Thermocol boxes include custom box charges.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 h-fit md:col-span-1">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Shipment Details</h2>
          
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Packing Box Type & Size</label>
              <select
                value={boxSize}
                onChange={(e) => setBoxSize(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Small Thermocol">Small Thermocol Box (~350g | +₹30 Box Fee)</option>
                <option value="Large Thermocol">Large Thermocol Box (~700g | +₹60 Box Fee)</option>
                <option value="Small Cardboard">Small Cardboard Box (~200g | 📦 FREE)</option>
                <option value="Large Cardboard">Large Cardboard Box (~450g | 📦 FREE)</option>
              </select>
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">Items in Box</label>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                >
                  + Add Item
                </button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Item #{idx + 1}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItemRow(idx)} className="text-rose-500 text-xs font-bold">×</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={item.category}
                      onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                      className="p-2 border rounded-lg text-xs bg-white"
                    >
                      <option value="Fish">Fish Variety</option>
                      <option value="Live Feed">Live Feed (Moina/Yeast)</option>
                      <option value="Plants">Aquarium Plants</option>
                      <option value="Accessories">Accessories</option>
                    </select>

                    <select
                      value={item.unitType}
                      onChange={(e) => handleItemChange(idx, 'unitType', e.target.value)}
                      className="p-2 border rounded-lg text-xs bg-white"
                    >
                      {item.category === 'Fish' ? (
                        <>
                          <option value="Pair (1M+1F)">Pair (1M+1F)</option>
                          <option value="Trio (1M+2F)">Trio (1M+2F)</option>
                          <option value="Male Only">Male Only</option>
                          <option value="Female Only">Female Only</option>
                        </>
                      ) : (
                        <option value="Packet (100g)">Packet (100g)</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Quantity / Sets</label>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      className="w-full p-2 border rounded-lg text-xs bg-white font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Calculating...' : 'Calculate Exact Tariff & Weight'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="md:col-span-2 space-y-4">
          {!result ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 space-y-2">
              <p className="text-3xl">📦</p>
              <p className="font-medium">Select your box type (Cardboard is Free), add items, and enter pincode to compute accurate shipping.</p>
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
                  <p className="text-[10px] text-gray-500">As per Rajapalayam tariff card</p>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Customer Shipping Fee</p>
                  <p className="text-2xl font-extrabold text-emerald-600">₹{result.recommendedCustomerCharge}</p>
                  <p className="text-[10px] text-gray-500">{result.boxExtraCost === 0 ? 'Cardboard Box (FREE)' : `Includes Box Fee (+₹${result.boxExtraCost})`}</p>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Net Shipping Margin</p>
                  <p className={`text-2xl font-extrabold ${result.profitMargin >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {result.profitMargin >= 0 ? `+₹${result.profitMargin}` : `-₹{Math.abs(result.profitMargin)}`}
                  </p>
                  <p className="text-[10px] text-gray-500">Buffer / profit margin</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1.5">
                <p className="font-bold">💡 Shipment Breakdown Summary:</p>
                <p>• Box Selected: {result.boxSize} {result.boxExtraCost === 0 ? '(Cardboard - FREE)' : `(Box Fee: ₹${result.boxExtraCost})`}</p>
                <p>• Total Gross Weight: {result.totalWeightKg} KG</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}