import { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, ShoppingBag, Package, DollarSign, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import styles from './ReportsTab.module.css';

function fmt(n) { return '$' + Math.round(n).toLocaleString(); }
function fmtShort(n) { return n >= 1000 ? '$' + (n / 1000).toFixed(0) + 'k' : '$' + n; }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return MONTHS[d.getMonth()] + ' ' + d.getFullYear().toString().slice(2);
}

export function ReportsTab() {
  const { sales, batches, products, deleteSale, inventoryValuation } = useStore();
  const [activeSection, setActiveSection] = useState('overview');

  const totalRevenue  = sales.reduce((s, x) => s + x.totalPrice, 0);
  const totalCogs     = sales.reduce((s, x) => s + (x.totalCogs || 0), 0);
  const totalProfit   = totalRevenue - totalCogs;
  
  // Total cost of all purchase batches registered
  const totalBatchCost = batches.reduce((s, x) => s + x.totalCost, 0);
  const inStockValue  = inventoryValuation;
  const avgMargin     = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  // Monthly chart data
  const monthlyData = useMemo(() => {
    const map = {};
    sales.forEach(s => {
      const k = getMonthKey(s.date);
      map[k] = map[k] || { month: k, revenue: 0, profit: 0, units: 0 };
      map[k].revenue += s.totalPrice;
      map[k].profit  += s.profit;
      
      const totalQty = s.items.reduce((sum, item) => sum + item.qty, 0);
      map[k].units   += totalQty;
    });
    return Object.values(map).slice(-8);
  }, [sales]);

  // Category breakdown
  const catData = useMemo(() => {
    let bagsRev = 0;
    let jewelryRev = 0;
    let bagsUnits = 0;
    let jewelryUnits = 0;

    sales.forEach(s => {
      s.items.forEach(item => {
        // Find category
        const p = products.find(prod => prod.id === item.productId) || {};
        if (p.cat === 'bags') {
          bagsRev += item.totalPrice;
          bagsUnits += item.qty;
        } else {
          jewelryRev += item.totalPrice;
          jewelryUnits += item.qty;
        }
      });
    });

    return [
      { name: 'Bags',    revenue: bagsRev,    units: bagsUnits },
      { name: 'Jewelry', revenue: jewelryRev, units: jewelryUnits },
    ];
  }, [sales, products]);

  const STATS = [
    { label: 'Total Revenue',   value: fmt(totalRevenue),   icon: DollarSign, color: '#3B6D11', bg: '#F0F7F0' },
    { label: 'Net Profit',      value: fmt(totalProfit),    icon: TrendingUp,  color: '#C9A84C', bg: '#FBF5E8' },
    { label: 'Items Sold',      value: sales.reduce((sum, s) => sum + s.items.reduce((sumI, i) => sumI + i.qty, 0), 0), icon: ShoppingBag, color: '#185FA5', bg: '#E6F1FB' },
    { label: 'Inventory Valuation', value: fmt(inStockValue), icon: Package,     color: '#993C1D', bg: '#FDF0EE' },
  ];

  const SECTIONS = [
    { key: 'overview', label: 'Overview' },
    { key: 'sales',    label: 'Sales Transactions Log' },
    { key: 'purchases',label: 'Acquisitions Purchase Log' },
  ];

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>Reports & Analytics</h2>

      <div className={styles.statGrid}>
        {STATS.map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: s.bg }}>
              <s.icon size={16} color={s.color} strokeWidth={1.5} />
            </div>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={styles.tabs}>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            className={`${styles.tab} ${activeSection === s.key ? styles.activeTab : ''}`}
            onClick={() => setActiveSection(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'overview' && (
        <div className={styles.charts}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Monthly Revenue & Profit (USD)</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1C1410" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1C1410" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DE" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8C7B6E' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#8C7B6E' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v, n) => [fmt(v), n === 'revenue' ? 'Revenue' : 'Profit']} contentStyle={{ fontSize: 12, border: '1px solid #E8D5C4', borderRadius: 4 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#C9A84C" fill="url(#revGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="profit"  name="Profit"  stroke="#1C1410" fill="url(#profGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Sales by Category</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DE" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8C7B6E' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#8C7B6E' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v, n) => [n === 'revenue' ? fmt(v) : v, n === 'revenue' ? 'Revenue' : 'Units Sold']} contentStyle={{ fontSize: 12, border: '1px solid #E8D5C4', borderRadius: 4 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#C9A84C" radius={[3,3,0,0]} />
                  <Bar dataKey="units"   name="Units Sold" fill="#1C1410" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.summaryRow}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Avg. profit margin</div>
              <div className={styles.summaryVal} style={{ color: '#3B6D11' }}>{avgMargin}%</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total acquisitions cost</div>
              <div className={styles.summaryVal}>{fmt(totalBatchCost)}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Items in Stock</div>
              <div className={styles.summaryVal}>{batches.reduce((sum, b) => sum + b.remainingQty, 0)}</div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'sales' && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr>
              <th>Date</th>
              <th>Buyer</th>
              <th>Items Sold</th>
              <th>Selection Method</th>
              <th>Gross Revenue</th>
              <th>Matched COGS</th>
              <th>Profit / Loss</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              {[...sales].sort((a,b) => new Date(b.date) - new Date(a.date)).map(s => (
                <tr key={s.id}>
                  <td className={styles.dateCell}>{s.date}</td>
                  <td className="font-semibold text-xs text-stone-800">{s.buyer}</td>
                  <td>
                    <div className="space-y-1">
                      {s.items.map((it, idx) => (
                        <div key={idx} className="text-xs text-stone-700">
                          <strong>{it.qty}x</strong> {it.brand} {it.name} @ ${it.pricePerItem}
                          <div className="text-[10px] text-stone-400 pl-2">
                            Deducted from: {it.batches.map(b => `${b.batchNumber} (${b.qty} items @ $${b.costPerItem})`).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded uppercase font-mono">
                      {s.selectionMethod || 'FIFO'}
                    </span>
                  </td>
                  <td className={styles.numCell}>${s.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className={styles.numCell}>${s.totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className={`${styles.numCell} ${styles.profit}`}>
                    ${s.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <button
                      className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                      title="Delete sale & refund stock to batch"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this sale? This will refund the allocated stock back to its corresponding batches.')) {
                          deleteSale(s.id);
                        }
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan={8} className={styles.empty}>No sales recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === 'purchases' && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr>
              <th>Date</th>
              <th>Batch Number</th>
              <th>Product Specs</th>
              <th>Condition</th>
              <th>Acquisition Cost</th>
              <th>Init Qty</th>
              <th>Rem Qty</th>
              <th>Ledger Total</th>
            </tr></thead>
            <tbody>
              {[...batches].sort((a,b) => new Date(b.date) - new Date(a.date)).map(b => {
                const prod = products.find(p => p.id === b.productId) || { name: 'Unknown', brand: 'Unknown' };
                return (
                  <tr key={b.id}>
                    <td className={styles.dateCell}>{b.date}</td>
                    <td className="font-semibold text-xs font-mono">{b.batchNumber}</td>
                    <td>
                      <div className="text-xs">
                        <strong className="text-stone-800">{prod.brand} {prod.name}</strong>
                        {b.enteredInPhp && <div className="text-[9px] font-semibold text-amber-700 font-mono">PHP Entry ({b.exchangeRateUsed}x conversion)</div>}
                      </div>
                    </td>
                    <td>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full" style={{ background: b.condition === 'new' || b.condition === 'mint' ? '#F0F7F0' : '#FFF8E8', color: b.condition === 'new' || b.condition === 'mint' ? '#3B6D11' : '#854F0B' }}>
                        {b.condition}
                      </span>
                    </td>
                    <td className={styles.numCell}>${b.costPerItem.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="text-center font-mono text-xs">{b.quantity}</td>
                    <td className="text-center font-mono text-xs font-semibold text-amber-700">{b.remainingQty}</td>
                    <td className={styles.numCell}>${b.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
              {batches.length === 0 && <tr><td colSpan={8} className={styles.empty}>No purchases/batches recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
