import { useMemo, useState } from 'react';
import { parseModelFromSku } from '../api/venice';

const COLOR_PALETTE = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-fuchsia-500',
  'bg-teal-500',
  'bg-orange-500',
];

const formatNumber = (value, options = {}) => {
  if (value === null || value === undefined) return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return number.toLocaleString(undefined, options);
};

const formatDateTime = (value) => {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Never' : date.toLocaleString();
};

const costFormat = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

const CostDisplay = ({ diem, usd, className = 'text-sm font-bold' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {diem > 0 && (
      <span className="text-emerald-400">
        {formatNumber(diem, costFormat)} DIEM
      </span>
    )}
    {diem > 0 && usd > 0 && <span className="text-zinc-600">/</span>}
    {usd > 0 && (
      <span className="text-blue-400">
        {formatNumber(usd, costFormat)} USD
      </span>
    )}
    {diem === 0 && usd === 0 && <span className="text-zinc-500">—</span>}
  </div>
);

const SummaryCard = ({ label, value, sublabel, accent = 'text-emerald-400' }) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
    <div className={`mt-2 text-2xl sm:text-3xl font-black tracking-tight ${accent}`}>
      {value}
    </div>
    {sublabel && (
      <p className="mt-1 text-xs text-zinc-500">{sublabel}</p>
    )}
  </div>
);

const buildModelWalletBreakdown = (filteredRaw, keys, modelName) => {
  const keyMap = new Map(keys.map((k) => [k.id, k]));
  const perWallet = new Map();

  filteredRaw.forEach((item) => {
    if (parseModelFromSku(item?.sku) !== modelName) return;
    const keyId = item._sourceKeyId;
    const keyInfo = keyMap.get(keyId);
    const walletName = keyInfo?.wallet || keyInfo?.label || item._sourceKeyLabel || 'Unknown';

    const entry = perWallet.get(walletName) || { wallet: walletName, costDiem: 0, costUsd: 0, tokens: 0 };
    const amount = Math.abs(Number(item?.amount ?? 0));
    const currency = item?._fetchedCurrency || item?.currency || 'DIEM';
    if (currency === 'USD') {
      entry.costUsd += amount;
    } else {
      entry.costDiem += amount;
    }
    entry.tokens +=
      Number(item?.inferenceDetails?.promptTokens ?? 0) +
      Number(item?.inferenceDetails?.completionTokens ?? 0);
    perWallet.set(walletName, entry);
  });

  return Array.from(perWallet.values()).sort(
    (a, b) => (b.costDiem + b.costUsd) - (a.costDiem + a.costUsd)
  );
};

const ModelExpanded = ({ filteredRaw, keys, modelName }) => {
  const walletBreakdown = useMemo(
    () => buildModelWalletBreakdown(filteredRaw, keys, modelName),
    [filteredRaw, keys, modelName]
  );

  if (walletBreakdown.length === 0) {
    return <p className="text-xs text-zinc-600 px-2 py-1">No data available.</p>;
  }

  return (
    <div className="mt-1 space-y-2 border-t border-zinc-800/50 pt-3">
      {walletBreakdown.map((wallet) => (
        <div key={wallet.wallet} className="flex items-center justify-between rounded-lg bg-zinc-900/60 px-3 py-2">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-zinc-400">
              <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 0 1 4.25 2h7.5A2.25 2.25 0 0 1 14 4.25v.636a.75.75 0 0 1-.149.596l-.042.048A2.25 2.25 0 0 0 14 7.75v3A2.25 2.25 0 0 1 11.75 13h-7.5A2.25 2.25 0 0 1 2 10.75v-6.5Zm10.5 3.5a.75.75 0 0 0-.75.75v.5a.75.75 0 0 0 1.5 0v-.5a.75.75 0 0 0-.75-.75Z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-bold text-zinc-200">{wallet.wallet}</span>
          </div>
          <div className="flex items-center gap-3">
            <CostDisplay diem={wallet.costDiem} usd={wallet.costUsd} className="text-xs font-semibold" />
            <span className="text-[10px] text-zinc-500">{formatNumber(wallet.tokens)} tok</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const UsageTable = ({ perModel, modelColors, filteredRaw, keys }) => {
  const [expandedModel, setExpandedModel] = useState(null);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-100">Model breakdown</h3>
        <span className="text-[11px] text-zinc-500">Cost</span>
      </div>
      <div className="mt-4 space-y-3">
        {perModel.length === 0 ? (
          <p className="text-sm text-zinc-500">No model usage yet.</p>
        ) : (
          perModel.map((model) => {
            const isExpanded = expandedModel === model.model;
            return (
              <div key={model.model} className="rounded-xl border border-zinc-800/70 bg-zinc-950/30">
                <button
                  type="button"
                  onClick={() => setExpandedModel(isExpanded ? null : model.model)}
                  className="flex w-full flex-col gap-2 p-3 text-left transition-colors hover:bg-zinc-900/40 rounded-xl"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`h-3 w-3 text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      >
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                      <span className={`h-2.5 w-2.5 rounded-full ${modelColors[model.model]}`} />
                      <p className="text-sm font-semibold text-zinc-100">{model.model}</p>
                    </div>
                    <CostDisplay diem={model.costDiem} usd={model.costUsd} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 pl-[30px]">
                    <span>{formatNumber(model.tokens)} tokens</span>
                    <span>Last used {formatDateTime(model.lastUsed)}</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 pl-[30px]">
                    <ModelExpanded
                      filteredRaw={filteredRaw}
                      keys={keys}
                      modelName={model.model}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const ApiKeyTable = ({ analyticsKeyBreakdown, filterWallet }) => {
  const grouped = useMemo(() => {
    let entries = analyticsKeyBreakdown;
    if (filterWallet !== 'all') {
      entries = entries.filter((e) => e._wallet === filterWallet);
    }

    const walletGroups = new Map();
    entries.forEach((entry) => {
      const wallet = entry._wallet || 'Unknown';
      const group = walletGroups.get(wallet) || [];
      group.push(entry);
      walletGroups.set(wallet, group);
    });

    return Array.from(walletGroups.entries()).sort((a, b) => {
      const totalA = a[1].reduce((s, e) => s + (e.totalDiem ?? 0) + (e.totalUsd ?? 0), 0);
      const totalB = b[1].reduce((s, e) => s + (e.totalDiem ?? 0) + (e.totalUsd ?? 0), 0);
      return totalB - totalA;
    });
  }, [analyticsKeyBreakdown, filterWallet]);

  if (grouped.length === 0) return null;

  const hasMultipleWallets = grouped.length > 1;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-100">API key breakdown</h3>
        <div className="flex gap-4 text-[11px] text-zinc-500">
          <span>DIEM</span>
          <span>USD</span>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {grouped.map(([walletName, entries]) => (
          <div key={walletName}>
            {hasMultipleWallets && (
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-zinc-500">
                  <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 0 1 4.25 2h7.5A2.25 2.25 0 0 1 14 4.25v.636a.75.75 0 0 1-.149.596l-.042.048A2.25 2.25 0 0 0 14 7.75v3A2.25 2.25 0 0 1 11.75 13h-7.5A2.25 2.25 0 0 1 2 10.75v-6.5Zm10.5 3.5a.75.75 0 0 0-.75.75v.5a.75.75 0 0 0 1.5 0v-.5a.75.75 0 0 0-.75-.75Z" clipRule="evenodd" />
                </svg>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{walletName}</span>
              </div>
            )}
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.apiKeyId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/30 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2.5 w-2.5 rounded-full ${COLOR_PALETTE[entries.indexOf(entry) % COLOR_PALETTE.length]}`} />
                    <span className="text-sm font-semibold text-zinc-100 truncate">
                      {entry.description || entry.apiKeyId}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-sm font-bold">
                    <span className="text-emerald-400 min-w-[70px] text-right">
                      {formatNumber(entry.totalDiem ?? 0, costFormat)}
                    </span>
                    <span className="text-blue-400 min-w-[50px] text-right">
                      ${formatNumber(entry.totalUsd ?? 0, costFormat)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UsageDashboard = ({
  periodOptions,
  periodDays,
  onPeriodChange,
  keys = [],
  walletOptions = [],
  filterKeyId = 'all',
  onFilterKeyChange,
  filterWallet = 'all',
  onFilterWalletChange,
  isLoading,
  error,
  summary,
  perModel,
  filteredRaw = [],
  analyticsKeyBreakdown = [],
}) => {
  const visibleKeys = useMemo(() => {
    if (filterWallet === 'all') return keys;
    return keys.filter((k) => k.wallet === filterWallet);
  }, [keys, filterWallet]);

  const modelColors = useMemo(() => {
    const map = {};
    perModel.forEach((model, index) => {
      map[model.model] = COLOR_PALETTE[index % COLOR_PALETTE.length];
    });
    return map;
  }, [perModel]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">Usage dashboard</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Model usage, costs, and token breakdown for the selected period.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={periodDays}
            onChange={(event) => onPeriodChange(Number(event.target.value))}
            disabled={isLoading}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-200 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {keys.length > 1 && (
            <select
              value={filterKeyId}
              onChange={(event) => {
                const value = event.target.value;
                onFilterKeyChange(value);
                if (value !== 'all') {
                  const selectedKey = keys.find((k) => k.id === value);
                  if (selectedKey?.wallet && filterWallet !== selectedKey.wallet) {
                    onFilterWalletChange(selectedKey.wallet);
                  }
                }
              }}
              disabled={isLoading}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-200 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
            >
              <option value="all">All Keys</option>
              {visibleKeys.map((k) => (
                <option key={k.id} value={k.id}>{k.label}</option>
              ))}
            </select>
          )}
          {walletOptions.length > 0 && (
            <select
              value={filterWallet}
              onChange={(event) => {
                const value = event.target.value;
                onFilterWalletChange(value);
                if (value !== 'all' && filterKeyId !== 'all') {
                  const selectedKey = keys.find((k) => k.id === filterKeyId);
                  if (selectedKey?.wallet !== value) {
                    onFilterKeyChange('all');
                  }
                }
              }}
              disabled={isLoading}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-200 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
            >
              <option value="all">All Wallets</option>
              {walletOptions.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          )}
          {isLoading && (
            <svg className="h-4 w-4 animate-spin text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
        </div>
      </div>

      <div className={`space-y-6 transition-opacity duration-300 ${isLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
      <UsageTable perModel={perModel} modelColors={modelColors} filteredRaw={filteredRaw} keys={keys} />

      {analyticsKeyBreakdown.length > 0 && (
        <ApiKeyTable analyticsKeyBreakdown={analyticsKeyBreakdown} filterWallet={filterWallet} />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total cost"
          value={
            <div className="flex flex-wrap items-baseline gap-x-2">
              {summary.totalCostDiem > 0 && (
                <span className="text-emerald-400">
                  {formatNumber(summary.totalCostDiem, costFormat)} DIEM
                </span>
              )}
              {summary.totalCostDiem > 0 && summary.totalCostUsd > 0 && <span className="text-zinc-600">/</span>}
              {summary.totalCostUsd > 0 && (
                <span className="text-blue-400">
                  {formatNumber(summary.totalCostUsd, costFormat)} USD
                </span>
              )}
              {summary.totalCostDiem === 0 && summary.totalCostUsd === 0 && (
                <span className="text-zinc-500">—</span>
              )}
            </div>
          }
          sublabel="Cost"
          accent="text-white"
        />
        <SummaryCard
          label="Total tokens"
          value={formatNumber(summary.totalTokens)}
          sublabel="Prompt + completion"
          accent="text-blue-400"
        />
        <SummaryCard
          label="Requests"
          value={formatNumber(summary.totalRequests)}
          sublabel={
            summary.totalRecords > summary.fetchedRecords
              ? `${formatNumber(summary.fetchedRecords)} of ${formatNumber(summary.totalRecords)} loaded`
              : `Updated ${formatDateTime(summary.lastUpdated)}`
          }
          accent="text-purple-400"
        />
      </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </section>
  );
};

export default UsageDashboard;
