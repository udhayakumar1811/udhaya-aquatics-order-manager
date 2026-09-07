import { Suspense, lazy, useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Modal from './components/Modal';
import OrderForm from './components/OrderForm';
import OrderDetailView from './components/OrderDetailView';
import ShippingSticker from './components/ShippingSticker';
import Login from './components/Login';
import { useAuth } from './context/AuthContext';

const DigitalCatalog = lazy(() => import('./components/DigitalCatalog'));
const WholesaleInvestmentLog = lazy(() => import('./components/WholesaleInvestmentLog'));
const RecycleBin = lazy(() => import('./components/RecycleBin'));
const GeographicSalesAnalytics = lazy(() => import('./components/GeographicSalesAnalytics'));
const FishGradingLog = lazy(() => import('./components/FishGradingLog'));
const ProfitLossReport = lazy(() => import('./components/ProfitLossReport'));
const CourierCalculator = lazy(() => import('./components/CourierCalculator'));
const WhatsAppApiSettings = lazy(() => import('./components/WhatsAppApiSettings'));
const ChannelSalesTracker = lazy(() => import('./components/ChannelSalesTracker'));
const MortalityTracker = lazy(() => import('./components/MortalityTracker'));
const FeedProductionPlanning = lazy(() => import('./components/FeedProductionPlanning'));
const WhatsAppMarketing = lazy(() => import('./components/WhatsAppMarketing'));
const FarmChecklist = lazy(() => import('./components/FarmChecklist'));
const CustomerCRM = lazy(() => import('./components/CustomerCRM'));
const BreedingLog = lazy(() => import('./components/BreedingLog'));
const ExpenseCategoriesBreakdown = lazy(() => import('./components/ExpenseCategoriesBreakdown'));
const VarietySalesAnalytics = lazy(() => import('./components/VarietySalesAnalytics'));
const CustomerLedger = lazy(() => import('./components/CustomerLedger'));
const DataBackup = lazy(() => import('./components/DataBackup'));
const Expenses = lazy(() => import('./components/Expenses'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const NewOrder = lazy(() => import('./components/NewOrder'));
const OrdersList = lazy(() => import('./components/OrdersList'));
const Inventory = lazy(() => import('./components/Inventory'));
const CustomerHistory = lazy(() => import('./components/CustomerHistory'));
const ProductsCombos = lazy(() => import('./components/ProductsCombos'));
const ReportsAnalytics = lazy(() => import('./components/ReportsAnalytics'));

function TabLoading() {
  return <div className="text-center py-16 text-slate-400 text-sm">Loading...</div>;
}

export default function App() {
  const { user, authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPublicCatalogRoute, setIsPublicCatalogRoute] = useState(false);

  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [stickerOrder, setStickerOrder] = useState(null);

  // Check if URL contains /catalog for public view
  useEffect(() => {
    const checkRoute = () => {
      if (window.location.pathname.includes('/catalog') || window.location.hash.includes('/catalog')) {
        setIsPublicCatalogRoute(true);
      }
    };
    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  // If URL explicitly points to public catalog, bypass login and render ONLY Digital Catalog
  if (isPublicCatalogRoute) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <header className="bg-slate-900 text-white px-6 py-4 shadow-md flex justify-between items-center">
          <div className="font-bold text-lg">Udhaya Aquatics — Public Stock Catalog</div>
          <a href="/" className="text-xs bg-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700">Admin Login</a>
        </header>
        <main>
          <Suspense fallback={<TabLoading />}>
            <DigitalCatalog />
          </Suspense>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="p-6 max-w-7xl mx-auto">
        <Suspense fallback={<TabLoading />}>
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'new-order' && <NewOrder setActiveTab={setActiveTab} />}
          {activeTab === 'orders-list' && (
            <OrdersList
              onEditOrder={setEditingOrder}
              onViewOrder={setViewingOrder}
              onOpenSticker={setStickerOrder}
            />
          )}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'digital-catalog' && <DigitalCatalog />}
          {activeTab === 'expenses' && <Expenses />}
          {activeTab === 'wholesale-investment' && <WholesaleInvestmentLog />}
          {activeTab === 'expense-analytics' && <ExpenseCategoriesBreakdown />}
          {activeTab === 'customer-ledger' && <CustomerLedger />}
          {activeTab === 'customer-history' && <CustomerHistory />}
          {activeTab === 'customer-crm' && <CustomerCRM />}
          {activeTab === 'whatsapp-marketing' && <WhatsAppMarketing />}
          {activeTab === 'whatsapp-api-settings' && <WhatsAppApiSettings />}
          {activeTab === 'feed-production' && <FeedProductionPlanning />}
          {activeTab === 'mortality-tracker' && <MortalityTracker />}
          {activeTab === 'channel-sales' && <ChannelSalesTracker />}
          {activeTab === 'courier-calculator' && <CourierCalculator />}
          {activeTab === 'profit-loss-report' . report && <ProfitLossReport />}
          {activeTab === 'fish-grading' && <FishGradingLog />}
          {activeTab === 'geo-analytics' && <GeographicSalesAnalytics />}
          {activeTab === 'recycle-bin' && <RecycleBin />}
          {activeTab === 'products-combos' && <ProductsCombos />}
          {activeTab === 'reports-analytics' && <ReportsAnalytics />}
          {activeTab === 'backup' && <DataBackup />}
          {activeTab === 'variety-analytics' && <VarietySalesAnalytics />}
          {activeTab === 'breeding-log' && <BreedingLog />}
          {activeTab === 'farm-checklist' && <FarmChecklist />}
        </Suspense>
      </main>

      {editingOrder && (
        <Modal title={`Edit Order ${editingOrder.orderId || ''}`} onClose={() => setEditingOrder(null)}>
          <OrderForm mode="edit" initialOrder={editingOrder} onDone={() => setEditingOrder(null)} onCancel={() => setEditingOrder(null)} />
        </Modal>
      )}

      {viewingOrder && (
        <Modal title="Order Details" onClose={() => setViewingOrder(null)}>
          <OrderDetailView order={viewingOrder} />
        </Modal>
      )}

      {stickerOrder && (
        <Modal title="Shipping Sticker" onClose={() => setStickerOrder(null)} widthClass="max-w-md">
          <ShippingSticker order={stickerOrder} />
        </Modal>
      )}
    </div>
  );
}