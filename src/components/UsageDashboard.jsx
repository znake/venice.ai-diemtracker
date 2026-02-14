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
    <p className={`mt-2 text-2xl sm:text-3xl font-black tracking-tight ${accent}`}>
      {value}
    </p>
    {sublabel && (
      <p className="mt-1 text-xs text-zinc-500">{sublabel}</p>
    )}
  </div>
);


const UsageTable = ({ perModel, modelColors }) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-zinc-100">Model breakdown</h3>
      <span className="text-[11px] text-zinc-500">Cost (DIEM)</span>
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
              <p className="text-sm font-bold text-emerald-400">
                {formatNumber(model.cost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
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
  onRefresh,
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
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-200 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:w-auto"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border min-h-[44px] px-4 py-2 text-sm font-semibold transition-all duration-200
              ${isLoading
                ? 'cursor-not-allowed border-white/5 bg-white/5 text-zinc-600'
                : 'border-white/10 bg-zinc-900 text-zinc-300 hover:border-white/20 hover:bg-zinc-800 hover:text-white active:scale-95'
              }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            >
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                clipRule="evenodd"
              />
            </svg>
            {isLoading ? 'Refreshing' : 'Refresh Usage'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <UsageTable perModel={perModel} modelColors={modelColors} />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total cost"
          value={formatNumber(summary.totalCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          sublabel="DIEM spent"
          accent="text-emerald-400"
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
    </section>
  );
};

export default UsageDashboard;
