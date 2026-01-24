import React from 'react';

const KeyCard = ({ keyData, onEdit, onDelete, onRefresh }) => {
  const { id, label, apiKey, balance, lastUpdated, isLoading } = keyData;

  const maskedKey = apiKey && apiKey.length > 6 
    ? `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`
    : '***';

  const formattedDate = lastUpdated 
    ? new Date(lastUpdated).toLocaleString() 
    : 'Never';

  const formatValue = (val) => {
    if (val === null || val === undefined) return '—';
    return val;
  };

  const hasError = balance?.error;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] p-5 transition-all hover:border-white/20 hover:shadow-lg hover:shadow-black/50">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative z-10 mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-white">{label}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
              {maskedKey}
            </span>
          </div>
        </div>
        
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button 
            onClick={() => onEdit(id)}
            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
            </svg>
          </button>
          <button 
            onClick={() => onDelete(id)}
            className="rounded p-1.5 text-zinc-500 hover:bg-red-900/30 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 001.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/5 py-4">
        {hasError ? (
          <div className="col-span-3 flex items-center justify-center rounded bg-red-900/10 py-3 text-sm text-red-400 border border-red-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-2 w-4 h-4">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {balance.error}
          </div>
        ) : (
          <>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">USD Balance</span>
              <span className={`mt-1 font-mono text-xl font-semibold tracking-tight ${isLoading ? 'animate-pulse text-zinc-600' : 'text-emerald-400'}`}>
                {isLoading ? '---' : `$${formatValue(balance?.usd)}`}
              </span>
            </div>

            <div className="flex flex-col border-l border-white/5 pl-4">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">DIEM</span>
              <span className={`mt-1 font-mono text-xl font-semibold tracking-tight ${isLoading ? 'animate-pulse text-zinc-600' : 'text-blue-400'}`}>
                {isLoading ? '---' : formatValue(balance?.diem)}
              </span>
            </div>

            <div className="flex flex-col border-l border-white/5 pl-4">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">VCU</span>
              <span className={`mt-1 font-mono text-xl font-semibold tracking-tight ${isLoading ? 'animate-pulse text-zinc-600' : 'text-purple-400'}`}>
                {isLoading ? '---' : formatValue(balance?.vcu)}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="relative z-10 mt-2 flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : hasError ? 'bg-red-500' : 'bg-emerald-500/50'}`}></div>
          <span className="text-[10px] text-zinc-600">
            Updated: {formattedDate}
          </span>
        </div>

        <button
          onClick={() => onRefresh(id)}
          disabled={isLoading}
          className={`group/refresh flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-all
            ${isLoading 
              ? 'cursor-not-allowed text-zinc-600' 
              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            className={`w-3.5 h-3.5 transition-transform ${isLoading ? 'animate-spin' : 'group-hover/refresh:rotate-180'}`}
          >
            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
          </svg>
          {isLoading ? 'Syncing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default KeyCard;
