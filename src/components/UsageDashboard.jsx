import { useMemo } from 'react';

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


const UsageTable = ({ perModel, modelColors }) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-zinc-100">Model breakdown</h3>
      <span className="text-[11px] text-zinc-500">Cost</span>
    </div>
    <div className="mt-4 space-y-3">
      {perModel.length === 0 ? (
        <p className="text-sm text-zinc-500">No model usage yet.</p>
      ) : (
        perModel.map((model) => (
          <div key={model.model} className="flex flex-col gap-2 rounded-xl border border-zinc-800/70 bg-zinc-950/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${modelColors[model.model]}`} />
                <p className="text-sm font-semibold text-zinc-100">{model.model}</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                {model.costDiem > 0 && (
                  <span className="text-emerald-400">
                    {formatNumber(model.costDiem, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DIEM
                  </span>
                )}
                {model.costDiem > 0 && model.costUsd > 0 && <span className="text-zinc-600">/</span>}
                {model.costUsd > 0 && (
                  <span className="text-blue-400">
                    {formatNumber(model.costUsd, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                )}
                {model.costDiem === 0 && model.costUsd === 0 && (
                  <span className="text-zinc-500">—</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
              <span>{formatNumber(model.tokens)} tokens</span>
              <span>Last used {formatDateTime(model.lastUsed)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const UsageDashboard = ({
  periodOptions,
  periodDays,
  onPeriodChange,
  isLoading,
  error,
  summary,
  perModel,
}) => {
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={periodDays}
            onChange={(event) => onPeriodChange(Number(event.target.value))}
            disabled={isLoading}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-200 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:w-auto disabled:opacity-50"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isLoading && (
            <svg className="h-4 w-4 animate-spin text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
        </div>
      </div>

      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
      <UsageTable perModel={perModel} modelColors={modelColors} />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total cost"
          value={
            <div className="flex flex-wrap items-baseline gap-x-2">
              {summary.totalCostDiem > 0 && (
                <span className="text-emerald-400">
                  {formatNumber(summary.totalCostDiem, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DIEM
                </span>
              )}
              {summary.totalCostDiem > 0 && summary.totalCostUsd > 0 && <span className="text-zinc-600">/</span>}
              {summary.totalCostUsd > 0 && (
                <span className="text-blue-400">
                  {formatNumber(summary.totalCostUsd, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
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
