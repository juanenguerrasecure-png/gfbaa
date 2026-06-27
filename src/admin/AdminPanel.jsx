import { useState } from 'react';
import {
  Package, PlusCircle, BarChart2, LogOut, X, Menu, Code, Users, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { InventoryTab } from './tabs/InventoryTab';
import { AddItemTab }   from './tabs/AddItemTab';
import { ReportsTab }   from './tabs/ReportsTab';
import { DesignTab }    from './tabs/DesignTab';
import { UsersTab }     from './tabs/UsersTab';
import { RequestsTab }  from './tabs/RequestsTab';
import styles from './AdminPanel.module.css';

const NAV = [
  { key: 'inventory', label: 'Products & Stock', icon: Package,     tab: InventoryTab },
  { key: 'requests',  label: 'Buyer Requests',   icon: Bell,        tab: RequestsTab },
  { key: 'add',       label: 'Add Batch / Purchase', icon: PlusCircle, tab: AddItemTab },
  { key: 'reports',   label: 'Reports & Logs', icon: BarChart2,    tab: ReportsTab },
  { key: 'users',     label: 'Users & Control', icon: Users,         tab: UsersTab },
  { key: 'design',    label: 'System Design', icon: Code,           tab: DesignTab },
];

export function AdminPanel({ onExitAdmin }) {
  const { logout, currentUser } = useAuth();
  const { purchaseRequests = [] } = useStore();
  const [activeKey, setActiveKey] = useState('inventory');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingCount = purchaseRequests.filter(r => r.status === 'pending').length;

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
      {/* Top bar */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className={styles.brand}>
            <span className={styles.brandName}>Good Finds by AA</span>
            <span className={styles.brandBadge}>Admin</span>
          </div>
        </div>
        <div className={styles.topRight}>
          <button className={styles.storeLinkBtn} onClick={onExitAdmin}>
            ← Back to store
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={14} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </header>

      <div className={styles.body}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <nav className={styles.nav}>
            {NAV.map(({ key, label, icon: Icon }) => {
              const isRequests = key === 'requests';
              return (
                <button
                  key={key}
                  className={`${styles.navItem} ${activeKey === key ? styles.navActive : ''}`}
                  onClick={() => handleNav(key)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={16} strokeWidth={1.5} />
                    <span>{label}</span>
                  </div>
                  {isRequests && pendingCount > 0 && (
                    <span 
                      style={{
                        backgroundColor: '#C9A84C',
                        color: '#FAF8F5',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        minWidth: '1.5rem',
                        textAlign: 'center'
                      }}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.adminInfo}>
              <div className={styles.adminAvatar}>
                {currentUser?.username ? currentUser.username[0].toUpperCase() : 'A'}
              </div>
              <div>
                <div className={styles.adminName}>
                  {currentUser?.username || 'Administrator'}
                </div>
                <div className={styles.adminRole}>
                  {currentUser?.role || 'Full access'}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className={styles.overlay}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content */}
        <main className={styles.main}>
          <div className={styles.mainInner}>
            <ActiveTab onSwitchTab={handleNav} />
          </div>
        </main>
      </div>
    </div>
  );
}
