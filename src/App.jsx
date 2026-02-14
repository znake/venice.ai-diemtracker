import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useLocalStorage from './hooks/useLocalStorage';
import useInterval from './hooks/useInterval';
import { aggregateUsage, fetchBalance, fetchRateLimits, fetchUsage } from './api/venice';
import KeyCard from './components/KeyCard';
import KeyForm from './components/KeyForm';
import UsageDashboard from './components/UsageDashboard';

const STORAGE_KEY = 'venice-keys';
const AUTO_REFRESH_MS = 60_000;
const DEFAULT_USAGE_DAYS = 7;

const PERIOD_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function App() {
  const [keys, setKeys] = useLocalStorage(STORAGE_KEY, []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [usagePeriodDays, setUsagePeriodDays] = useState(DEFAULT_USAGE_DAYS);
  const [usageState, setUsageState] = useState({
    isLoading: false,
    error: null,
    summary: {
      totalCost: 0,
      totalTokens: 0,
      totalRequests: 0,
      lastUpdated: null,
      nextEpoch: null,
    },
    perModel: [],
    dailySeries: [],
  });

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

  const usageLoadingRef = useRef(false);

  const refreshUsage = useCallback(
    async (periodOverride = null) => {
      if (!keys.length) return;
      if (usageLoadingRef.current) return;

      const primaryKey = keys[0]?.apiKey;
      if (!primaryKey) return;

      usageLoadingRef.current = true;
      const periodDays = periodOverride ?? usagePeriodDays;
      setUsageState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const combinedUsage = [];
        let errorMessage = null;
        let totalRecords = 0;

        for (const key of keys) {
          if (!key.apiKey) continue;
          const usageResult = await fetchUsage(key.apiKey, {
            days: periodDays,
            currency: 'DIEM',
            limit: 200,
          });

          if (usageResult.error && !errorMessage) {
            errorMessage = `${key.label || 'Key'}: ${usageResult.error}`;
          }

          combinedUsage.push(...usageResult.usage);
          if (usageResult.totalRecords != null) {
            totalRecords += usageResult.totalRecords;
          }
          await sleep(150);
        }

        const rateResult = await fetchRateLimits(primaryKey);
        if (rateResult.error && !errorMessage) {
          errorMessage = rateResult.error;
        }

        const aggregated = aggregateUsage(combinedUsage);

        setUsageState({
          isLoading: false,
          error: errorMessage,
          summary: {
            ...aggregated.summary,
            nextEpoch: rateResult.nextEpoch,
            fetchedRecords: combinedUsage.length,
            totalRecords,
          },
          perModel: aggregated.perModel,
          dailySeries: aggregated.dailySeries,
        });
      } finally {
        usageLoadingRef.current = false;
      }
    },
    [keys, usagePeriodDays]
  );

  // Initial refresh on mount when keys exist
  useEffect(() => {
    if (keys.length > 0) {
      refreshAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (keys.length > 0) {
      refreshUsage();
    }
    // Intentionally only re-run when key count or period changes, not on refreshUsage identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.length, usagePeriodDays]);

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white sm:text-4xl lg:text-5xl bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
              Venice Balance Tracker
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-400 leading-relaxed">
              Track USD/DIEM/VCU balances across multiple API keys with automatic refresh.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={refreshAll}
              disabled={!keys.length || isRefreshing}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border min-h-[44px] px-4 py-3 text-sm font-semibold transition-all duration-200
                ${!keys.length || isRefreshing
                  ? 'cursor-not-allowed border-white/5 bg-white/5 text-zinc-600'
                  : 'border-white/10 bg-zinc-900 text-zinc-300 hover:border-white/20 hover:bg-zinc-800 hover:text-white active:scale-95'
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
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 min-h-[44px] px-5 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:bg-emerald-400 hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <span className="text-lg leading-none font-black">+</span>
              Add Key
            </button>
          </div>
        </header>

        <main className="mt-8 space-y-10 sm:mt-12">
          {!keys.length ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center sm:p-16">
              <div className="mx-auto max-w-md flex flex-col items-center">
                <div className="mb-4 rounded-full bg-zinc-900 p-4 ring-1 ring-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-zinc-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-100">
                  No API keys yet
                </h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                  Add your Venice API key to start tracking your balances. Your keys are stored locally in your browser.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-8 inline-flex items-center justify-center rounded-lg bg-zinc-100 px-6 py-2.5 text-sm font-bold text-zinc-900 transition-all hover:bg-white hover:scale-105 active:scale-95"
                >
                  Add your first key
                </button>
              </div>
            </div>
          ) : (
            <>
              <UsageDashboard
                periodOptions={PERIOD_OPTIONS}
                periodDays={usagePeriodDays}
                onPeriodChange={setUsagePeriodDays}
                onRefresh={() => refreshUsage(usagePeriodDays)}
                isLoading={usageState.isLoading}
                error={usageState.error}
                summary={usageState.summary}
                perModel={usageState.perModel}
                dailySeries={usageState.dailySeries}
              />
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
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
            </>
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
              key={editingKey ? editingKey.id : 'new'}
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
