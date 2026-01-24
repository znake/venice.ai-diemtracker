import { useState, useEffect } from 'react';

const KeyForm = ({ onSubmit, initialData = null, onCancel }) => {
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label || '');
      setApiKey(initialData.apiKey || '');
    } else {
      setLabel('');
      setApiKey('');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!label.trim() || !apiKey.trim()) {
      setError('Both fields are required.');
      return;
    }

    onSubmit({ label, apiKey });
    
    if (!initialData) {
      setLabel('');
      setApiKey('');
    }
  };

  const isEditMode = !!initialData;

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-6 shadow-2xl max-w-md w-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-500/20 to-transparent -mr-8 -mt-8 rotate-45 pointer-events-none" />

      <h2 className="text-xl font-bold text-zinc-100 mb-6 tracking-tight">
        {isEditMode ? 'Edit API Key' : 'Add New Key'}
      </h2>

      <div className="space-y-5">
        <div className="space-y-1">
          <label htmlFor="label" className="block text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Label
          </label>
          <input
            type="text"
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200 placeholder-zinc-700"
            placeholder="e.g. Production, Staging"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="apiKey" className="block text-xs font-mono text-zinc-500 uppercase tracking-wider">
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-3 pr-12 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200 placeholder-zinc-700 font-mono text-sm"
              placeholder="sk-..."
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              aria-label={showKey ? "Hide API Key" : "Show API Key"}
            >
              {showKey ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-rose-500 text-sm bg-rose-500/10 border border-rose-500/20 p-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-zinc-100 hover:bg-white text-zinc-900 font-bold py-3 px-4 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-zinc-100"
          >
            {isEditMode ? 'Save Changes' : 'Add Key'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-3 text-zinc-400 hover:text-zinc-200 font-medium transition-colors duration-200 focus:outline-none focus:text-zinc-100"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default KeyForm;
