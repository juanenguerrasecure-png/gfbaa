import { lazy, Suspense, useState } from 'react';
import { Package, PlusCircle, BarChart2, LogOut, X, Menu, Code, Users, Bell, ShoppingCart, Share2, CreditCard, Image, BookOpen, MessageSquare, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import styles from './AdminPanel.module.css';

const InventoryTab = lazy(() => import('./tabs/InventoryTab').then(m => ({ default: m.InventoryTab })));
const AddItemTab = lazy(() => import('./tabs/AddItemTab').then(m => ({ default: m.AddItemTab })));
const ReportsTab = lazy(() => import('./tabs/ReportsTab').then(m => ({ default: m.ReportsTab })));
const DesignTab = lazy(() => import('./tabs/DesignTab').then(m => ({ default: m.DesignTab })));
const UsersTab = lazy(() => import('./tabs/UsersTab').then(m => ({ default: m.UsersTab })));
const RequestsTab = lazy(() => import('./tabs/RequestsTab').then(m => ({ default: m.RequestsTab })));
const SocialLinksTab = lazy(() => import('./tabs/SocialLinksTab').then(m => ({ default: m.SocialLinksTab })));
const PaymentMethodsTab = lazy(() => import('./tabs/PaymentMethodsTab').then(m => ({ default: m.PaymentMethodsTab })));
const GalleryTab = lazy(() => import('./tabs/GalleryTab').then(m => ({ default: m.GalleryTab })));
const PastCollectionsTab = lazy(() => import('./tabs/PastCollectionsTab').then(m => ({ default: m.PastCollectionsTab })));
const MessageBoardTab = lazy(() => import('./tabs/MessageBoardTab').then(m => ({ default: m.MessageBoardTab })));
const NewsletterTab = lazy(() => import('./tabs/NewsletterTab').then(m => ({ default: m.NewsletterTab })));
const GlobalManualSaleModal = lazy(() => import('./components/GlobalManualSaleModal').then(m => ({ default: m.GlobalManualSaleModal })));

function AdminContentFallback() {
  return (
    <div className="min-h-[360px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-stone-500">
        <div className="h-7 w-7 rounded-full border-2 border-[#E5DFD8] border-t-[#C9A84C] animate-spin" />
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">Loading section</span>
      </div>
    </div>
  );
}

const NAV = [
  { key: 'inventory', label: 'Products & Stock', icon: Package, tab: InventoryTab },
  { key: 'requests', label: 'Buyer Requests', icon: Bell, tab: RequestsTab },
  { key: 'messages', label: 'Message Board Review', icon: MessageSquare, tab: MessageBoardTab },
  { key: 'newsletter', label: 'Newsletter Subscribers', icon: Mail, tab: NewsletterTab },
  { key: 'add', label: 'Add Batch / Purchase', icon: PlusCircle, tab: AddItemTab },
  { key: 'gallery', label: 'Storefront Gallery', icon: Image, tab: GalleryTab },
  { key: 'past_collections', label: 'Past Collections', icon: BookOpen, tab: PastCollectionsTab },
  { key: 'reports', label: 'Reports & Logs', icon: BarChart2, tab: ReportsTab },
  { key: 'users', label: 'Users & Control', icon: Users, tab: UsersTab },
  { key: 'social', label: 'Social Links', icon: Share2, tab: SocialLinksTab },
  { key: 'payments', label: 'Payment Setup', icon: CreditCard, tab: PaymentMethodsTab },
  { key: 'design', label: 'System Design', icon: Code, tab: DesignTab },
];

const GROUPS = [
  { title: 'Operations & Stock', items: ['inventory', 'add', 'past_collections'] },
  { title: 'Editorial & Content', items: ['gallery'] },
  { title: 'Customer Management', items: ['requests', 'messages', 'newsletter'] },
  { title: 'System & Settings', items: ['reports', 'users', 'social', 'payments', 'design'] },
];

export function AdminPanel({ onExitAdmin }) {
  const { logout, currentUser } = useAuth();
  const { purchaseRequests = [], comments = [], messages = [] } = useStore();
  const [activeKey, setActiveKey] = useState('inventory');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showGlobalManualSale, setShowGlobalManualSale] = useState(false);

  const pendingCount = purchaseRequests.filter(r => r.status === 'pending').length;
  const pendingComments = comments.filter(c => !c.reviewed).length;
  const pendingMessages = messages.filter(m => !m.reviewed).length;
  const totalPendingMessagesBoard = pendingComments + pendingMessages;

  const ActiveTab = NAV.find(n => n.key === activeKey)?.tab ?? InventoryTab;

  const handleNav = (key) => {
    setActiveKey(key);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    onExitAdmin();
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div className={styles.headerRow1}>
          <div className={styles.topLeft}>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span className={styles.brandName}>Good Finds by AA</span>
          </div>

          <div className={styles.headerActions}>
            <span className={styles.brandBadge}>Admin</span>
            <button className={styles.storeLinkBtn} onClick={onExitAdmin}>← Back to store</button>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <LogOut size={14} strokeWidth={1.5} />
              <span>Sign out</span>
            </button>
          </div>
        </div>

        <div className={styles.headerRow2}>
          <button id="nav_tool_manual_sale_btn" onClick={() => setShowGlobalManualSale(true)} className={styles.manualSaleBtn}>
            <ShoppingCart size={13} strokeWidth={2} />
            <span>Manual Sale Entry</span>
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <nav className="flex flex-col gap-6 px-3">
            {GROUPS.map(group => (
              <div key={group.title} className="space-y-1.5">
                <h4 className="px-3 text-[10px] uppercase tracking-widest text-stone-400 font-semibold font-sans mb-1">{group.title}</h4>
                <div className="space-y-0.5">
                  {group.items.map(key => {
                    const navItem = NAV.find(item => item.key === key);
                    if (!navItem) return null;
                    const Icon = navItem.icon;
                    const isRequests = key === 'requests';
                    const isMessagesBoard = key === 'messages';
                    return (
                      <button key={key} className={`${styles.navItem} ${activeKey === key ? styles.navActive : ''}`} onClick={() => handleNav(key)} id={`admin_nav_item_${key}`}>
                        <div className="flex items-center gap-3">
                          <Icon size={16} strokeWidth={1.5} />
                          <span>{navItem.label}</span>
                        </div>
                        {isRequests && pendingCount > 0 && (
                          <span className="min-w-6 rounded-full bg-[#C9A84C] px-2 py-0.5 text-center text-[0.7rem] font-bold text-[#FAF8F5]">{pendingCount}</span>
                        )}
                        {isMessagesBoard && totalPendingMessagesBoard > 0 && (
                          <span className="min-w-6 rounded-full bg-[#C9A84C] px-2 py-0.5 text-center text-[0.7rem] font-bold text-[#FAF8F5]">{totalPendingMessagesBoard}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.adminInfo}>
              <div className={styles.adminAvatar}>{currentUser?.username ? currentUser.username[0].toUpperCase() : 'A'}</div>
              <div>
                <div className={styles.adminName}>{currentUser?.username || 'Administrator'}</div>
                <div className={styles.adminRole}>{currentUser?.role || 'Full access'}</div>
              </div>
            </div>
          </div>
        </aside>

        {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

        <main className={styles.main}>
          <div className={styles.mainInner}>
            <Suspense fallback={<AdminContentFallback />}>
              <ActiveTab onSwitchTab={handleNav} />
            </Suspense>
          </div>
        </main>
      </div>

      {showGlobalManualSale && (
        <Suspense fallback={<AdminContentFallback />}>
          <GlobalManualSaleModal isOpen={showGlobalManualSale} onClose={() => setShowGlobalManualSale(false)} />
        </Suspense>
      )}
    </div>
  );
}
