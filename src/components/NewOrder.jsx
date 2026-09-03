<<<<<<< HEAD
import React, { useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function NewOrder({ setActiveTab }) {
  const [items, setItems] = useState([
    {
      itemType: 'Fish Variety',
      varietyName: '',
      sellingUnit: 'Pair (பேர்)',
      qty: 1,
      costPrice: 0,
      sellingPrice: 0
    }
  ]);

  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    whatsappNumber: '',
    fullAddress: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    shippingCharged: 0,
    actualCourier: 0,
    packingBoxCost: 0,
    courierPartner: 'Professional Courier',
    trackingId: '',
    paymentMode: 'UPI General',
    paymentStatus: 'Paid',
    orderStatus: 'Pending',
    boxChoice: 'Thermocol',
    oxygenFilled: true,
    doubleBag: true
  });

  const [loading, setLoading] = useState(false);

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...items];
    newItems[index][name] = value;
    setItems(newItems);
  };

  const addFishItem = () => {
    setItems([...items, {
      itemType: 'Fish Variety',
      varietyName: '',
      sellingUnit: 'Pair (பேர்)',
      qty: 1,
      costPrice: 0,
      sellingPrice: 0
    }]);
  };

  const addComboItem = () => {
    setItems([...items, {
      itemType: 'Combo / Offer Pack',
      varietyName: '',
      sellingUnit: 'Pair (பேர்)',
      qty: 1,
      costPrice: 0,
      sellingPrice: 0
    }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const itemsRevenue = items.reduce((sum, item) => sum + (Number(item.sellingPrice) * Number(item.qty)), 0);
  const itemsCost = items.reduce((sum, item) => sum + (Number(item.costPrice) * Number(item.qty)), 0);

  const revenueTotal = itemsRevenue + Number(formData.shippingCharged);
  const totalExpenses = itemsCost + Number(formData.actualCourier) + Number(formData.packingBoxCost);
  const netProfit = revenueTotal - totalExpenses;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const itemsSummary = items.map(i => `${i.varietyName} (${i.qty})`).join(', ');
      await addDoc(collection(db, "orders"), {
        ...formData,
        items,
        itemsSummary,
        revenueTotal,
        billTotal: revenueTotal,
        totalExpenses,
        netProfit,
        status: formData.orderStatus,
        boxType: formData.boxChoice,
        phone: formData.mobileNumber,
        address: formData.fullAddress,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });
      alert('Order registered successfully and synced to Firebase!');
      setActiveTab('orders-list');
    } catch (error) {
      console.error("Error adding order: ", error);
      alert('Error registering order. Please check console.');
    } finally {
      setLoading(false);
    }
  };

=======
import React from 'react';
import OrderForm from './OrderForm';

export default function NewOrder({ setActiveTab }) {
>>>>>>> claude-upgrade
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Add New WhatsApp Order</h2>
          <p className="text-sm text-slate-500">Enter order details, selling price, and cost expenses.</p>
        </div>
<<<<<<< HEAD
        <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
          Order ID: ADQ001
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">1. CUSTOMER DETAILS (MANDATORY)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name *</label>
              <input type="text" name="customerName" required value={formData.customerName} onChange={handleFieldChange} placeholder="e.g. Kumar" className="w-full p-2 border rounded text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Number *</label>
              <input type="text" name="mobileNumber" required value={formData.mobileNumber} onChange={handleFieldChange} placeholder="e.g. 9876543210" className="w-full p-2 border rounded text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">WhatsApp Number</label>
              <input type="text" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleFieldChange} placeholder="Same as mobile or different" className="w-full p-2 border rounded text-sm bg-white" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Address *</label>
              <input type="text" name="fullAddress" required value={formData.fullAddress} onChange={handleFieldChange} placeholder="Door No, Street Name, Landmark" className="w-full p-2 border rounded text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">City / District *</label>
              <input type="text" name="city" required value={formData.city} onChange={handleFieldChange} placeholder="e.g. Madurai" className="w-full p-2 border rounded text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">State *</label>
              <input type="text" name="state" required value={formData.state} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">PIN Code *</label>
              <input type="text" name="pincode" required value={formData.pincode} onChange={handleFieldChange} placeholder="e.g. 625001" className="w-full p-2 border rounded text-sm bg-white" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-slate-700 text-sm">2. ORDER ITEMS & PRODUCTION COST</h3>
            <div className="flex gap-2">
              <button type="button" onClick={addFishItem} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg text-xs font-semibold border border-blue-200 cursor-pointer">
                + Add Fish
              </button>
              <button type="button" onClick={addComboItem} className="bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1 rounded-lg text-xs font-semibold border border-purple-200 cursor-pointer">
                ✨ + Add Combo
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border border-slate-200 relative">
                <div className="flex justify-between items-center mb-2">
                  <span className={`inline-block text-white text-[10px] font-bold px-2 py-0.5 rounded ${item.itemType === 'Combo / Offer Pack' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                    ITEM #{index + 1} [{item.itemType.toUpperCase()}]
                  </span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="text-rose-500 text-xs font-semibold hover:underline cursor-pointer">
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Item Type</label>
                    <select name="itemType" value={item.itemType} onChange={(e) => handleItemChange(index, e)} className="w-full p-2 border rounded text-sm bg-white">
                      <option value="Fish Variety">Fish Variety</option>
                      <option value="Combo / Offer Pack">Combo / Offer Pack</option>
                      <option value="Plants & Live Feeds">Plants & Live Feeds</option>
                      <option value="Aquarium Accessories">Aquarium Accessories</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Variety Name *</label>
                    <input type="text" name="varietyName" required value={item.varietyName} onChange={(e) => handleItemChange(index, e)} placeholder="e.g. Full Red Guppy" className="w-full p-2 border rounded text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Selling Unit</label>
                    <select name="sellingUnit" value={item.sellingUnit} onChange={(e) => handleItemChange(index, e)} className="w-full p-2 border rounded text-sm bg-white">
                      <option value="Pair (பேர்)">Pair (பேர்)</option>
                      <option value="Trio (ட்ரியோ - 1M+2F)">Trio (ட்ரியோ - 1M+2F)</option>
                      <option value="Male Only (ஆண்)">Male Only (ஆண்)</option>
                      <option value="Female Only (பெண்)">Female Only (பெண்)</option>
                      <option value="Piece / Set (எண்ணிக்கை)">Piece / Set (எண்ணிக்கை)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Qty</label>
                    <input type="number" name="qty" min="1" value={item.qty} onChange={(e) => handleItemChange(index, e)} className="w-full p-2 border rounded text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-red-600 mb-1">Cost Price (₹)</label>
                    <input type="number" name="costPrice" value={item.costPrice} onChange={(e) => handleItemChange(index, e)} placeholder="e.g." className="w-full p-2 border rounded text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-emerald-600 mb-1">Selling Price (₹)</label>
                    <input type="number" name="sellingPrice" value={item.sellingPrice} onChange={(e) => handleItemChange(index, e)} placeholder="e.g." className="w-full p-2 border rounded text-sm bg-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">3. SHIPPING CHARGES & PACKING EXPENSES</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Shipping Charge Collected (₹)</label>
              <input type="number" name="shippingCharged" value={formData.shippingCharged} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Actual Courier Expense (₹)</label>
              <input type="number" name="actualCourier" value={formData.actualCourier} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Packing Box Expense (₹)</label>
              <input type="number" name="packingBoxCost" value={formData.packingBoxCost} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Courier Service Partner</label>
              <select name="courierPartner" value={formData.courierPartner} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white">
                <option value="Professional Courier">Professional Courier</option>
                <option value="ST Courier">ST Courier</option>
                <option value="DTDC Courier">DTDC Courier</option>
                <option value="Anchal">Anchal</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">Courier Tracking Number / ID</label>
              <input type="text" name="trackingId" value={formData.trackingId} onChange={handleFieldChange} placeholder="e.g. DT12345678IN" className="w-full p-2 border rounded text-sm bg-white" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">4. PAYMENT & ORDER PROGRESS STATUS</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white">
                <option value="UPI General">UPI General</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Payment Status</label>
              <select name="paymentStatus" value={formData.paymentStatus} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white">
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Order Status</label>
              <select name="orderStatus" value={formData.orderStatus} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white">
                <option value="Pending">Pending</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">5. PACKING BOX CHOICE</h3>
          <div className="flex flex-wrap gap-6 items-center">
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer bg-white ${formData.boxChoice === 'Thermocol' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-300'}`}>
              <input type="radio" name="boxChoice" value="Thermocol" checked={formData.boxChoice === 'Thermocol'} onChange={handleFieldChange} />
              <span className="text-sm font-medium">📦 Thermocol</span>
            </label>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer bg-white ${formData.boxChoice === 'Cardboard' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-300'}`}>
              <input type="radio" name="boxChoice" value="Cardboard" checked={formData.boxChoice === 'Cardboard'} onChange={handleFieldChange} />
              <span className="text-sm font-medium">📦 Cardboard</span>
            </label>

            <div className="flex items-center gap-6 ml-auto">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="checkbox" name="oxygenFilled" checked={formData.oxygenFilled} onChange={handleFieldChange} className="w-4 h-4 rounded text-blue-600" />
                Oxygen Filled
              </label>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="checkbox" name="doubleBag" checked={formData.doubleBag} onChange={handleFieldChange} className="w-4 h-4 rounded text-blue-600" />
                Double Bag
              </label>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap justify-between items-center">
          <div className="flex gap-8">
            <div>
              <p className="text-[11px] text-slate-400">Total Revenue Collected</p>
              <p className="text-lg font-bold text-white">₹{revenueTotal}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Total Expenses</p>
              <p className="text-lg font-bold text-amber-400">₹{totalExpenses}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Estimated Net Profit (நிகர லாபம்)</p>
              <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₹{netProfit}</p>
            </div>
          </div>
          <button type="submit" disabled={loading} className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition shadow cursor-pointer">
            {loading ? 'Saving...' : 'Save & Register Order'}
          </button>
        </div>
      </form>
=======
      </div>
      <OrderForm mode="create" onDone={() => setActiveTab('orders-list')} />
>>>>>>> claude-upgrade
    </div>
  );
}