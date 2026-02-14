const KeyCard = ({ keyData, onEdit, onDelete }) => {
  const { id, label, apiKey, balance, isLoading } = keyData;

  const maskedKey = apiKey && apiKey.length > 6
    ? `${apiKey.substring(0, 3)}…${apiKey.substring(apiKey.length - 3)}`
    : '***';

  const formatValue = (val) => {
    if (val === null || val === undefined) return '—';
    return val;
  };

  const hasError = balance?.error;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900">
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-bold tracking-tight text-zinc-100 truncate">{label}</h3>
          <span className="font-mono text-[10px] text-zinc-500 shrink-0">{maskedKey}</span>
        </div>

        <div className="flex gap-0.5 shrink-0">
          <button
            onClick={() => onEdit(id)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 active:bg-zinc-700 transition-colors"
            aria-label="Edit key"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(id)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:bg-red-900/30 hover:text-red-400 active:bg-red-900/50 transition-colors"
            aria-label="Delete key"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 001.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-2 mt-3">
        {hasError ? (
          <div className="col-span-3 flex items-center justify-center rounded-lg bg-red-500/5 py-2 text-xs font-medium text-red-400 border border-red-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-1.5 w-3.5 h-3.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {balance.error}
          </div>
        ) : (
          <>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">USD</span>
              <span className={`mt-0.5 font-mono text-base font-bold tracking-tight ${isLoading ? 'animate-pulse text-zinc-700' : 'text-emerald-400'}`}>
                {isLoading ? '—' : `$${formatValue(balance?.usd)}`}
              </span>
            </div>

            <div className="flex flex-col border-l border-zinc-800/50 pl-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">DIEM</span>
              <span className={`mt-0.5 font-mono text-base font-bold tracking-tight ${isLoading ? 'animate-pulse text-zinc-700' : 'text-blue-400'}`}>
                {isLoading ? '—' : formatValue(balance?.diem)}
              </span>
            </div>

            <div className="flex flex-col border-l border-zinc-800/50 pl-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">VCU</span>
              <span className={`mt-0.5 font-mono text-base font-bold tracking-tight ${isLoading ? 'animate-pulse text-zinc-700' : 'text-purple-400'}`}>
                {isLoading ? '—' : formatValue(balance?.vcu)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KeyCard;
