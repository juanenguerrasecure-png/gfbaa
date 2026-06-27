import { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, ShoppingBag, Package, DollarSign, Trash2, PlusCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import styles from './ReportsTab.module.css';

function fmt(n) { return '$' + Math.round(n).toLocaleString(); }
function fmtShort(n) { return n >= 1000 ? '$' + (n / 1000).toFixed(0) + 'k' : '$' + n; }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return MONTHS[d.getMonth()] + ' ' + d.getFullYear().toString().slice(2);
}

export function ReportsTab({ onSwitchTab }) {
  const { sales, batches, products, catalogItems, recordManualSale, deleteSale, inventoryValuation } = useStore();
  const [activeSection, setActiveSection] = useState('overview');

  // --- Manual Sale Entry States ---
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualBuyer, setManualBuyer] = useState('');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualBatchId, setManualBatchId] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const [manualPrice, setManualPrice] = useState('');
  const [manualPriceType, setManualPriceType] = useState('bulk'); // 'unit' | 'bulk'
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const handleBatchChange = (batchId) => {
    setManualBatchId(batchId);
    setFormError('');
    setFormSuccess('');
    
    if (!batchId) {
      setManualPrice('');
      return;
    }
    
    // Find if there is a catalog item linked to this batch
    const linkedCatalogItem = catalogItems.find(c => c.batchId === batchId);
    if (linkedCatalogItem && linkedCatalogItem.price) {
      setManualPrice(linkedCatalogItem.price);
    } else {
      setManualPrice('');
    }
  };

  const handleManualQtyChange = (val) => {
    const nextQty = Number(val) || 1;
    if (manualPriceType === 'bulk' && manualPrice && manualQty) {
      const perUnit = Number(manualPrice) / manualQty;
      setManualPrice(String(Math.round(perUnit * nextQty * 100) / 100));
    }
    setManualQty(nextQty);
  };

  const handleManualSaleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!manualBatchId) {
      setFormError('Please select a batch from inventory.');
      return;
    }

    const qty = Number(manualQty);
    if (isNaN(qty) || qty <= 0) {
      setFormError('Quantity must be a positive number.');
      return;
    }

    const price = Number(manualPrice);
    if (isNaN(price) || price < 0 || manualPrice === '') {
      setFormError('Price cannot be negative or empty.');
      return;
    }

    const batch = batches.find(b => b.id === manualBatchId);
    if (!batch) {
      setFormError('Selected batch was not found.');
      return;
    }

    if (batch.remainingQty < qty) {
      setFormError(`Insufficient stock in Batch "${batch.batchNumber}". Requested: ${qty}, Available: ${batch.remainingQty}`);
      return;
    }

    const calculatedPricePerItem = manualPriceType === 'unit' ? price : (price / qty);

    try {
      recordManualSale({
        buyer: manualBuyer.trim() || 'Offline Customer',
        date: manualDate,
        batchId: manualBatchId,
        qty: qty,
        pricePerItem: calculatedPricePerItem
      });

      setFormSuccess(`Successfully recorded manual sale of ${qty} item(s)!`);
      // Reset form fields
      setManualBuyer('');
      setManualBatchId('');
      setManualQty(1);
      setManualPrice('');
      // Keep form open or close after some delay
      setTimeout(() => {
        setShowManualForm(false);
        setFormSuccess('');
      }, 2000);
    } catch (err) {
      setFormError(err.message || 'Failed to record manual sale.');
    }
  };

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
        <div className="space-y-6" id="reports_tab_sales_section">
          {/* Direct Sales Header / Toggle Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-stone-50 p-4 rounded-lg border border-stone-200" id="reports_manual_sales_header">
            <div>
              <h3 className="text-sm font-semibold text-stone-800" id="reports_manual_sales_title">Direct Sales Manual Entry</h3>
              <p className="text-xs text-stone-500" id="reports_manual_sales_desc">Record offline/direct sales and immediately deplete inventory of the chosen batch.</p>
            </div>
            <button
              id="btn_toggle_manual_sales_form"
              onClick={() => {
                setShowManualForm(!showManualForm);
                setFormError('');
                setFormSuccess('');
              }}
              className="px-4 py-2 text-xs font-semibold rounded bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              {showManualForm ? 'Close Manual Form' : '➕ Record Manual Sale'}
            </button>
          </div>

          {/* Collapsible Form */}
          {showManualForm && (
            <form onSubmit={handleManualSaleSubmit} className="bg-stone-50 p-6 rounded-lg border border-stone-200 space-y-4 max-w-3xl animate-fade-in" id="manual_sale_entry_form">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-500" id="form_subtitle">New Direct Sales Entry</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Batch Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">Select Stock Batch *</label>
                  <select
                    id="manual_sale_batch_select"
                    value={manualBatchId}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded text-xs bg-white h-11"
                    required
                  >
                    <option value="">-- Choose active batch --</option>
                    {batches.filter(b => b.remainingQty > 0).map(b => {
                      const prod = products.find(p => p.id === b.productId) || { name: 'Unknown', brand: 'Unknown' };
                      return (
                        <option key={b.id} value={b.id}>
                          {b.batchNumber} — {prod.brand} {prod.name} ({b.remainingQty} available — cost ${b.costPerItem}/ea)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Pricing Method Selector */}
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">Pricing Method</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-stone-200/50 p-1 rounded border border-stone-200 max-w-sm">
                    <button
                      type="button"
                      onClick={() => {
                        if (manualPriceType === 'unit') return;
                        setManualPriceType('unit');
                        if (manualPrice && manualQty) {
                          setManualPrice(String(Math.round((Number(manualPrice) / manualQty) * 100) / 100));
                        }
                      }}
                      className={`py-1.5 text-[11px] font-semibold rounded text-center transition-all ${
                        manualPriceType === 'unit' 
                          ? 'bg-stone-900 text-white shadow-sm' 
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Per Unit Price
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (manualPriceType === 'bulk') return;
                        setManualPriceType('bulk');
                        if (manualPrice && manualQty) {
                          setManualPrice(String(Math.round(Number(manualPrice) * manualQty * 100) / 100));
                        }
                      }}
                      className={`py-1.5 text-[11px] font-semibold rounded text-center transition-all ${
                        manualPriceType === 'bulk' 
                          ? 'bg-stone-900 text-white shadow-sm' 
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Bulk / Total Price
                    </button>
                  </div>
                </div>

                {/* Price input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">
                    {manualPriceType === 'unit' ? 'Selling Price (USD per unit) *' : 'Total Selling Price (Bulk/Total USD) *'}
                  </label>
                  <input
                    id="manual_sale_price_input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    placeholder={manualPriceType === 'unit' ? 'Enter sale price per unit' : 'Enter total bulk sale price'}
                    className="w-full p-2 border border-stone-300 rounded text-xs bg-white h-11"
                    required
                  />
                  {manualBatchId && (
                    <div className="flex justify-between text-[10px] text-stone-500 mt-0.5">
                      <span>Acquisition cost: ${batches.find(b => b.id === manualBatchId)?.costPerItem}/ea</span>
                      {manualPriceType === 'bulk' && manualPrice && (
                        <span className="font-semibold text-stone-600">
                          Computed: ${(Number(manualPrice) / manualQty).toFixed(2)}/ea
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">Quantity Sold *</label>
                  <input
                    id="manual_sale_qty_input"
                    type="number"
                    min="1"
                    max={manualBatchId ? (batches.find(b => b.id === manualBatchId)?.remainingQty || 1) : undefined}
                    value={manualQty}
                    onChange={(e) => handleManualQtyChange(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded text-xs bg-white h-11"
                    required
                  />
                </div>

                {/* Buyer / Client */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">Buyer Name / Client</label>
                  <input
                    id="manual_sale_buyer_input"
                    type="text"
                    value={manualBuyer}
                    onChange={(e) => setManualBuyer(e.target.value)}
                    placeholder="e.g. Walk-in customer, Boutique wholesale"
                    className="w-full p-2 border border-stone-300 rounded text-xs bg-white h-11"
                  />
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">Transaction Date</label>
                  <input
                    id="manual_sale_date_input"
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded text-xs bg-white h-11"
                    required
                  />
                </div>
              </div>

              {formError && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded border border-red-200" id="manual_sale_form_error">
                  ⚠️ {formError}
                </div>
              )}

              {formSuccess && (
                <div className="text-xs font-semibold text-green-700 bg-green-50 p-2.5 rounded border border-green-200" id="manual_sale_form_success">
                  ✓ {formSuccess}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2" id="manual_sale_form_actions">
                <button
                  id="btn_manual_sale_cancel"
                  type="button"
                  onClick={() => {
                    setShowManualForm(false);
                    setFormError('');
                    setFormSuccess('');
                  }}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-100 rounded text-xs font-semibold text-stone-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn_manual_sale_confirm"
                  type="submit"
                  className="px-5 py-2 bg-[#C9A84C] text-stone-950 font-bold hover:bg-[#b7963d] rounded text-xs transition-colors"
                >
                  Confirm and Deplete Stock
                </button>
              </div>
            </form>
          )}

          <div className={styles.tableWrap} id="manual_sales_table_wrap">
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
              {sales.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-stone-50/50 border border-dashed border-stone-200 rounded-lg m-4" id="empty_sales_state">
                      <span className="text-3xl mb-3">📈</span>
                      <h3 className="font-display text-lg font-medium text-stone-800 mb-1">No Sales Transactions Recorded</h3>
                      <p className="text-stone-500 text-xs max-w-sm mb-5 font-sans">
                        You haven't recorded any storefront sales or direct wholesale transactions yet. When sales are completed, they will appear here.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => onSwitchTab && onSwitchTab('inventory')}
                          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-semibold rounded shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          id="empty_sales_sell_btn"
                        >
                          <TrendingUp size={13} />
                          Sell from Active Inventory
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
              {batches.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-stone-50/50 border border-dashed border-stone-200 rounded-lg m-4" id="empty_ledger_state">
                      <span className="text-3xl mb-3">📂</span>
                      <h3 className="font-display text-lg font-medium text-stone-800 mb-1">No Purchase Batches Logged</h3>
                      <p className="text-stone-500 text-xs max-w-sm mb-5 font-sans">
                        You have not imported or registered any acquisition batches. Ledger calculations and asset margins will update once registered.
                      </p>
                      <button
                        onClick={() => onSwitchTab && onSwitchTab('add')}
                        className="px-4 py-2 bg-[#C9A84C] text-stone-950 font-bold hover:bg-[#b7963d] rounded text-xs transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                        id="empty_ledger_add_btn"
                      >
                        <PlusCircle size={13} />
                        Register Your First Batch
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
