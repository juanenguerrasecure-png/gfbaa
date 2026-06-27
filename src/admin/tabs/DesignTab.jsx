import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Database, Link, GitMerge, Settings, HelpCircle } from 'lucide-react';

export function DesignTab() {
  const { exchangeRate, setExchangeRate } = useStore();
  const [activeTab, setActiveTab] = useState('schema');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-display text-2xl text-stone-900">System Architecture & Design</h2>
          <p className="text-sm text-stone-500">Interactive system blueprints, schemas, and live configuration for Good Finds by AA.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3 bg-stone-100 px-4 py-2 rounded-lg border border-stone-200">
          <Settings size={16} className="text-stone-600" />
          <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Exchange Rate (USD/PHP):</span>
          <input
            type="number"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(Math.max(1, Number(e.target.value)))}
            className="w-16 text-right px-2 py-1 bg-white border border-stone-300 rounded font-mono text-sm text-stone-800"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200">
        {[
          { id: 'schema', label: 'Database Schema', icon: Database },
          { id: 'endpoints', label: 'Suggested API Endpoints', icon: Link },
          { id: 'logic', label: 'FIFO & Cost Matching Logic', icon: GitMerge },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === t.id
                ? 'border-amber-600 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content 1: Database Schema */}
      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm">
              <h3 className="font-display text-lg text-stone-900 mb-2 flex items-center gap-2">
                <span className="p-1 bg-stone-100 rounded text-amber-700">1</span>
                Products Table (Item Catalog)
              </h3>
              <p className="text-xs text-stone-500 mb-4">Represents unique item models in the pre-loved designer handbag or gold jewelry catalog.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border border-stone-100">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-600">
                      <th className="p-2">Column</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    <tr><td className="p-2 font-semibold">id</td><td className="p-2 text-stone-500">INTEGER PRIMARY KEY</td><td className="p-2">Unique identifier</td></tr>
                    <tr><td className="p-2 font-semibold">name</td><td className="p-2 text-stone-500">VARCHAR(255)</td><td className="p-2">e.g., "Classic Flap"</td></tr>
                    <tr><td className="p-2 font-semibold">brand</td><td className="p-2 text-stone-500">VARCHAR(100)</td><td className="p-2">e.g., "Chanel"</td></tr>
                    <tr><td className="p-2 font-semibold">cat</td><td className="p-2 text-stone-500">VARCHAR(50)</td><td className="p-2">"bags" or "jewelry"</td></tr>
                    <tr><td className="p-2 font-semibold">detail</td><td className="p-2 text-stone-500">TEXT</td><td className="p-2">Specs, details</td></tr>
                    <tr><td className="p-2 font-semibold">price</td><td className="p-2 text-stone-500">DECIMAL(10,2)</td><td className="p-2">Default retail price in USD</td></tr>
                    <tr><td className="p-2 font-semibold">emoji</td><td className="p-2 text-stone-500">VARCHAR(10)</td><td className="p-2">Visual avatar</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm">
              <h3 className="font-display text-lg text-stone-900 mb-2 flex items-center gap-2">
                <span className="p-1 bg-stone-100 rounded text-amber-700">2</span>
                Batches Table (Purchases)
              </h3>
              <p className="text-xs text-stone-500 mb-4">Each batch tracks its specific acquisition cost (including shipping & tariff) and remaining stock.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border border-stone-100">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-600">
                      <th className="p-2">Column</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    <tr><td className="p-2 font-semibold">id</td><td className="p-2 text-stone-500">VARCHAR(50) PK</td><td className="p-2">Unique Batch ID</td></tr>
                    <tr><td className="p-2 font-semibold">product_id</td><td className="p-2 text-stone-500">INTEGER FK</td><td className="p-2">References Products(id)</td></tr>
                    <tr><td className="p-2 font-semibold">batch_number</td><td className="p-2 text-stone-500">VARCHAR(100)</td><td className="p-2">e.g., "BATCH-2024-001"</td></tr>
                    <tr><td className="p-2 font-semibold">date</td><td className="p-2 text-stone-500">DATE</td><td className="p-2">Date of purchase</td></tr>
                    <tr><td className="p-2 font-semibold">quantity</td><td className="p-2 text-stone-500">INTEGER</td><td className="p-2">Initial batch quantity</td></tr>
                    <tr><td className="p-2 font-semibold">remaining_qty</td><td className="p-2 text-stone-500">INTEGER</td><td className="p-2">Current quantity in stock</td></tr>
                    <tr><td className="p-2 font-semibold">product_cost_usd</td><td className="p-2 text-stone-500">DECIMAL(10,2)</td><td className="p-2">Total cost of goods (USD)</td></tr>
                    <tr><td className="p-2 font-semibold">shipping_usd</td><td className="p-2 text-stone-500">DECIMAL(10,2)</td><td className="p-2">Freight / shipping fee (USD)</td></tr>
                    <tr><td className="p-2 font-semibold">tariff_usd</td><td className="p-2 text-stone-500">DECIMAL(10,2)</td><td className="p-2">Customs duty/tariff (USD)</td></tr>
                    <tr><td className="p-2 font-semibold">cost_per_item</td><td className="p-2 text-stone-500">DECIMAL(10,2)</td><td className="p-2">(Product + Ship + Tariff) / Qty</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm">
              <h3 className="font-display text-lg text-stone-900 mb-2 flex items-center gap-2">
                <span className="p-1 bg-stone-100 rounded text-amber-700">3</span>
                Sales & Deductions Table
              </h3>
              <p className="text-xs text-stone-500 mb-4">Relational connection of items drawn during transactions for precise multi-batch COGS calculations.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border border-stone-100">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-600">
                      <th className="p-2">Column</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    <tr><td className="p-2 font-semibold">id</td><td className="p-2 text-stone-500">VARCHAR(50) PK</td><td className="p-2">Sale transaction reference</td></tr>
                    <tr><td className="p-2 font-semibold">buyer</td><td className="p-2 text-stone-500">VARCHAR(255)</td><td className="p-2">Customer details</td></tr>
                    <tr><td className="p-2 font-semibold">date</td><td className="p-2 text-stone-500">DATE</td><td className="p-2">Date of sale</td></tr>
                    <tr><td className="p-2 font-semibold">total_price</td><td className="p-2 text-stone-500">DECIMAL(10,2)</td><td className="p-2">Total gross revenue in USD</td></tr>
                    <tr><td className="p-2 font-semibold">total_cogs</td><td className="p-2 text-stone-500">DECIMAL(10,2)</td><td className="p-2">Summed actual cost of matched items</td></tr>
                    <tr><td className="p-2 font-semibold">profit</td><td className="p-2 text-stone-500">DECIMAL(10,2)</td><td className="p-2">Net profit (Revenue - COGS)</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-3 bg-stone-50 rounded text-xs text-stone-600 space-y-1">
                <div className="font-semibold text-stone-700">Sales Batch Deductions Sub-Schema:</div>
                <div>When a product is sold, the exact batches deducted are registered in a joint table linking <code>sale_id</code>, <code>batch_id</code>, <code>quantity_deducted</code>, and <code>cost_per_item</code>.</div>
              </div>
            </div>

            <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 shadow-sm space-y-3">
              <h4 className="font-semibold text-stone-800 text-sm flex items-center gap-2">
                <HelpCircle size={15} className="text-amber-700" />
                How the Philippines (PHP) auto-conversion stores?
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed">
                When a user inputs costs in PHP, the backend converts those values using the live configured exchange rate. All core storage, bookkeeping, and ledger logs are stored in <strong>USD ($)</strong> to preserve currency uniformity across metrics.
              </p>
              <div className="bg-white p-3 rounded font-mono text-xs text-amber-950 border border-amber-100">
                USD_Product_Cost = PHP_Product_Cost / Exchange_Rate;<br />
                USD_Shipping_Cost = PHP_Shipping_Cost / Exchange_Rate;<br />
                USD_Tariff_Cost = PHP_Tariff_Cost / Exchange_Rate;<br />
                <span className="text-stone-500">// Resulting total batch cost in USD:</span><br />
                USD_Total_Cost = USD_Product_Cost + USD_Shipping_Cost + USD_Tariff_Cost;
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Suggested API Endpoints */}
      {activeTab === 'endpoints' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
            <h3 className="font-display text-lg text-stone-900 mb-2">Restful RESTful API Design</h3>
            <p className="text-xs text-stone-500 mb-6">Designed backend routing configuration for full inventory synchronization and automated valuation reporting.</p>

            <div className="space-y-6">
              {[
                {
                  method: 'GET',
                  url: '/api/products',
                  desc: 'List catalog products with their aggregated stock totals and catalog metadata.',
                  resp: `[
  {
    "id": 1,
    "name": "Classic Flap",
    "brand": "Chanel",
    "cat": "bags",
    "price": 3200.00,
    "available_stock": 12
  }
]`
                },
                {
                  method: 'POST',
                  url: '/api/batches',
                  desc: 'Create a new purchase batch. Every purchase creates a new batch with tracked costs and quantity.',
                  req: `{
  "productId": 1,
  "batchNumber": "BATCH-2024-08",
  "quantity": 10,
  "productCost": 2000.00,
  "shipping": 40.00,
  "tariff": 40.00,
  "condition": "mint",
  "enteredInPhp": false
}`,
                  resp: `{
  "status": "success",
  "batchId": "batch-17195000",
  "costPerItem": 104.00,
  "totalCost": 2080.00
}`
                },
                {
                  method: 'POST',
                  url: '/api/sales',
                  desc: 'Deduct quantities and compute COGS from stock batches using either FIFO algorithm or manual batch arrays.',
                  req: `{
  "buyer": "Maria Santos",
  "date": "2026-06-27",
  "selectionMethod": "FIFO", // or "manual"
  "items": [
    {
      "productId": 1,
      "qty": 2,
      "pricePerItem": 3000.00,
      "selectedBatches": [] // specified if method is "manual"
    }
  ]
}`,
                  resp: `{
  "status": "success",
  "saleId": "sale-1719599",
  "totalPrice": 6000.00,
  "totalCogs": 208.00,
  "profit": 5792.00
}`
                },
              ].map((api, idx) => (
                <div key={idx} className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-stone-50 px-4 py-3 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                        api.method === 'GET' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {api.method}
                      </span>
                      <code className="text-sm font-semibold text-stone-800">{api.url}</code>
                    </div>
                    <span className="text-xs text-stone-500 mt-1 sm:mt-0">{api.desc}</span>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-900 text-stone-200 font-mono text-xs">
                    {api.req && (
                      <div>
                        <div className="text-stone-400 mb-1 border-b border-stone-800 pb-1 uppercase text-[10px]">Request Payload:</div>
                        <pre className="overflow-x-auto text-amber-200">{api.req}</pre>
                      </div>
                    )}
                    <div className={api.req ? '' : 'col-span-2'}>
                      <div className="text-stone-400 mb-1 border-b border-stone-800 pb-1 uppercase text-[10px]">Response Body:</div>
                      <pre className="overflow-x-auto text-emerald-300">{api.resp}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: FIFO & Cost Matching Logic */}
      {activeTab === 'logic' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-display text-lg text-stone-900 mb-2">Inventory Logic Blueprint</h3>
              <p className="text-xs text-stone-500">How the system processes transactions with high precision and flexibility.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 border border-stone-200 rounded-lg bg-stone-50">
                <h4 className="font-semibold text-stone-800 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-xs text-amber-800 font-bold">A</span>
                  FIFO Algorithm (First-In, First-Out)
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  When a sale is recorded as FIFO, the system automatically fetches all active batches belonging to the product that have <code>remainingQty &gt; 0</code>.
                  <br /><br />
                  These batches are sorted by acquisition date in chronological order (oldest first). The system then "draws" from these batches until the requested sales quantity is satisfied.
                </p>
                <div className="p-3 bg-white border border-stone-200 rounded font-mono text-[11px] text-stone-700 leading-relaxed">
                  batches = getProductBatches(prodId).sort(a,b =&gt; a.date - b.date);<br />
                  for (let b of batches) &#123;<br />
                  &nbsp;&nbsp;let deduct = Math.min(b.remainingQty, remainingToDeduct);<br />
                  &nbsp;&nbsp;b.remainingQty -= deduct;<br />
                  &nbsp;&nbsp;totalCogs += deduct * b.costPerItem;<br />
                  &nbsp;&nbsp;remainingToDeduct -= deduct;<br />
                  &#125;
                </div>
              </div>

              <div className="space-y-3 p-4 border border-stone-200 rounded-lg bg-stone-50">
                <h4 className="font-semibold text-stone-800 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-xs text-amber-800 font-bold">B</span>
                  Manual Batch Selection Option
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  For customized pre-loved products, some buyers prefer items from a specific batch (due to matching serial numbers, custom packaging, or specific batch details).
                  <br /><br />
                  The merchant can bypass the automatic FIFO algorithm and manually select exactly which batches are drawn from, specifying the precise quantity to pull from each batch.
                </p>
                <div className="p-3 bg-white border border-stone-200 rounded text-xs text-stone-700">
                  <div className="font-semibold text-amber-700">Key Benefits:</div>
                  <ul className="list-disc list-inside space-y-1 mt-1 text-[11px]">
                    <li>Tracks items with distinct serial numbers</li>
                    <li>Accommodates items bought under specific conditions</li>
                    <li>Saves exact custom costs per bag/jewel</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border border-amber-100 rounded-lg bg-amber-50 p-4 flex gap-4">
              <GitMerge className="text-amber-700 shrink-0" size={20} />
              <div>
                <h4 className="font-semibold text-stone-800 text-xs uppercase tracking-wider mb-1">Precision Inventory Valuation Rule</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  The system tracks the remaining stock on a per-batch basis. The **Inventory Valuation** report is dynamically calculated by summing the remaining quantity of each batch multiplied by its specific cost-per-item:
                </p>
                <div className="mt-2 font-mono text-xs text-amber-900 font-bold">
                  Valuation = SUM( Batch.remainingQty * Batch.costPerItem )
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
