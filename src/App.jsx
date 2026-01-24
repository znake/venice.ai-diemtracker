import { useCallback, useMemo, useState } from 'react';

import useLocalStorage from './hooks/useLocalStorage';
import useInterval from './hooks/useInterval';
import { fetchBalance } from './api/venice';
import KeyCard from './components/KeyCard';
import KeyForm from './components/KeyForm';

const STORAGE_KEY = 'venice-keys';
const AUTO_REFRESH_MS = 60_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function App() {
  const [keys, setKeys] = useLocalStorage(STORAGE_KEY, []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState(null);

  const isFormOpen = showForm || !!editingKey;

  const sortedKeys = useMemo(() => {
    // Keep UI stable/predictable; users typically expect latest updated first.
    return [...keys].sort((a, b) => {
      const aTime = a?.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const bTime = b?.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      return bTime - aTime;
    });
  }, [keys]);

  const resetFormState = useCallback(() => {
    setShowForm(false);
    setEditingKey(null);
  }, []);

  const refreshSingle = useCallback(
    async (id, apiKeyOverride = null) => {
      const keyToRefresh = keys.find((k) => k.id === id);
      const apiKeyToUse = apiKeyOverride ?? keyToRefresh?.apiKey;
      if (!apiKeyToUse) return;

      setKeys((prev) =>
        prev.map((k) =>
          k.id === id
            ? {
                ...k,
                isLoading: true,
                balance: {
                  usd: k.balance?.usd ?? null,
                  diem: k.balance?.diem ?? null,
                  vcu: k.balance?.vcu ?? null,
                  error: null,
                },
              }
            : k
        )
      );

      const result = await fetchBalance(apiKeyToUse);
      const now = new Date().toISOString();

      setKeys((prev) =>
        prev.map((k) =>
          k.id === id
            ? {
                ...k,
                isLoading: false,
                balance: {
                  usd: result.usd,
                  diem: result.diem,
                  vcu: result.vcu,
                  error: result.error,
                },
                lastUpdated: now,
              }
            : k
        )
      );
    },
    [keys, setKeys]
  );

  const refreshAll = useCallback(async () => {
    if (isRefreshing) return;
    if (!keys.length) return;

    setIsRefreshing(true);
    try {
      // Sequential refresh to keep rate limits happy.
      // We iterate over a snapshot to avoid surprises while state changes.
      for (const k of [...keys]) {
        await refreshSingle(k.id, k.apiKey);
        await sleep(150);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, keys, refreshSingle]);

  useInterval(
    () => {
      if (isRefreshing) return;
      if (!keys.length) return;
      refreshAll();
    },
    keys.length ? AUTO_REFRESH_MS : null
  );

  const addKey = useCallback(
    async ({ label, apiKey }) => {
      const newKey = {
        id: crypto.randomUUID(),
        label,
        apiKey,
        balance: { usd: null, diem: null, vcu: null, error: null },
        lastUpdated: null,
        isLoading: true,
      };

      setKeys((prev) => [newKey, ...prev]);
      resetFormState();

      const result = await fetchBalance(apiKey);
      const now = new Date().toISOString();

      setKeys((prev) =>
        prev.map((k) =>
          k.id === newKey.id
            ? {
                ...k,
                isLoading: false,
                balance: {
                  usd: result.usd,
                  diem: result.diem,
                  vcu: result.vcu,
                  error: result.error,
                },
                lastUpdated: now,
              }
            : k
        )
      );
    },
    [resetFormState, setKeys]
  );

  const updateKey = useCallback(
    async (id, { label, apiKey }) => {
      setKeys((prev) =>
        prev.map((k) =>
          k.id === id
            ? {
                ...k,
                label,
                apiKey,
              }
            : k
        )
      );

      resetFormState();
      await refreshSingle(id, apiKey);
    },
    [resetFormState, refreshSingle, setKeys]
  );

  const deleteKey = useCallback(
    (id) => {
      setKeys((prev) => prev.filter((k) => k.id !== id));
      if (editingKey?.id === id) {
        resetFormState();
      }
    },
    [editingKey?.id, resetFormState, setKeys]
  );

  const handleEdit = useCallback(
    (id) => {
      const k = keys.find((item) => item.id === id);
      if (!k) return;
      setShowForm(false);
      setEditingKey(k);
    },
    [keys]
  );

  const handleFormSubmit = useCallback(
    (data) => {
      if (editingKey) {
        return updateKey(editingKey.id, data);
      }
      return addKey(data);
    },
    [addKey, editingKey, updateKey]
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Venice Balance Tracker
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Track USD/DIEM/VCU balances across multiple API keys with automatic refresh.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={refreshAll}
              disabled={!keys.length || isRefreshing}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all
                ${!keys.length || isRefreshing
                  ? 'cursor-not-allowed border-white/10 bg-white/5 text-zinc-500'
                  : 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10'
                }`}
              title={!keys.length ? 'Add a key to refresh' : 'Refresh all keys'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                  clipRule="evenodd"
                />
              </svg>
              {isRefreshing ? 'Refreshing…' : 'Refresh All'}
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingKey(null);
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-extrabold text-zinc-950 transition-all hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <span className="text-base leading-none">+</span>
              Add Key
            </button>
          </div>
        </header>

        <main className="mt-10">
          {!keys.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
              <div className="mx-auto max-w-md">
                <p className="text-sm font-semibold text-zinc-200">
                  No API keys yet. Add one to get started.
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Your keys are stored locally in your browser.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-zinc-950 transition-colors hover:bg-zinc-100"
                >
                  Add your first key
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedKeys.map((keyData) => (
                <KeyCard
                  key={keyData.id}
                  keyData={keyData}
                  onEdit={handleEdit}
                  onDelete={deleteKey}
                  onRefresh={refreshSingle}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close form"
            onClick={resetFormState}
          />
          <div className="relative z-10 w-full max-w-md">
            <KeyForm
              initialData={editingKey}
              onSubmit={handleFormSubmit}
              onCancel={resetFormState}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
