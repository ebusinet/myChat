'use client';

import { useEffect, useState } from 'react';

type ProviderType = 'anthropic' | 'openai' | 'gemini';

interface FormState {
  providerType: ProviderType;
  apiKey: string;
  model: string;
  maxTokens: number;
  baseUrl: string;
  systemPrompt: string;
}

const MODEL_DEFAULTS: Record<ProviderType, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  gemini: 'gemini-2.0-flash',
};

export default function ConfigPage() {
  const [form, setForm] = useState<FormState>({
    providerType: 'anthropic',
    apiKey: '',
    model: '',
    maxTokens: 4096,
    baseUrl: '',
    systemPrompt: '',
  });
  const [savedConfig, setSavedConfig] = useState<any>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => {
        setSavedConfig(cfg);
        setForm({
          providerType: cfg.provider?.type ?? 'anthropic',
          apiKey: '',
          model: cfg.provider?.model ?? '',
          maxTokens: cfg.provider?.maxTokens ?? 4096,
          baseUrl: cfg.provider?.baseUrl ?? '',
          systemPrompt: cfg.systemPrompt ?? '',
        });
      })
      .catch(() => setStatus({ type: 'error', message: 'Failed to load config' }));
  }, []);

  const handleSave = async () => {
    setStatus(null);
    try {
      const provider: any = {
        type: form.providerType,
        model: form.model || MODEL_DEFAULTS[form.providerType],
        maxTokens: form.maxTokens,
      };
      // Only send apiKey if the user typed one (not the masked version)
      if (form.apiKey && !form.apiKey.includes('...')) {
        provider.apiKey = form.apiKey;
      }
      if (form.providerType === 'openai' && form.baseUrl) {
        provider.baseUrl = form.baseUrl;
      }

      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, systemPrompt: form.systemPrompt }),
      });

      if (!res.ok) throw new Error('Save failed');
      const cfg = await res.json();
      setSavedConfig(cfg);
      setStatus({ type: 'success', message: 'Configuration saved' });
    } catch {
      setStatus({ type: 'error', message: 'Failed to save configuration' });
    }
  };

  const handleReset = async () => {
    setStatus(null);
    try {
      const res = await fetch('/api/config', { method: 'DELETE' });
      const cfg = await res.json();
      setSavedConfig(cfg);
      setForm({
        providerType: cfg.provider?.type ?? 'anthropic',
        apiKey: '',
        model: cfg.provider?.model ?? '',
        maxTokens: cfg.provider?.maxTokens ?? 4096,
        baseUrl: cfg.provider?.baseUrl ?? '',
        systemPrompt: cfg.systemPrompt ?? '',
      });
      setStatus({ type: 'success', message: 'Reset to defaults' });
    } catch {
      setStatus({ type: 'error', message: 'Failed to reset' });
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Create a temp session, send a test message, check for response
      const sessRes = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!sessRes.ok) throw new Error('Failed to create test session');
      const session = await sessRes.json();

      const msgRes = await fetch(`/api/chat/sessions/${session.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          parentId: null,
          content: 'Say "Connection OK" and nothing else.',
          context: { collectedAt: new Date().toISOString(), layers: [] },
        }),
      });

      if (!msgRes.ok || !msgRes.body) throw new Error(`HTTP ${msgRes.status}`);

      const reader = msgRes.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split('\n')) {
          if (!line.trim().startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.trim().slice(6));
            if (evt.type === 'text_delta') result += evt.content;
            if (evt.type === 'error') throw new Error(evt.error);
          } catch (e) {
            if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e;
          }
        }
      }

      // Clean up
      await fetch(`/api/chat/sessions/${session.id}`, { method: 'DELETE' });
      setTestResult(result || 'No response received');
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="dashboard">
      <h1>Server Configuration</h1>
      <p>Configure the AI provider and system prompt for the test application</p>

      <div className="config-grid">
        {/* Provider Settings */}
        <div className="widget">
          <h2>AI Provider</h2>

          <div className="form-group">
            <label>Provider</label>
            <div className="radio-group">
              {(['anthropic', 'openai', 'gemini'] as ProviderType[]).map(type => (
                <label key={type} className="radio-label">
                  <input
                    type="radio"
                    name="provider"
                    value={type}
                    checked={form.providerType === type}
                    onChange={() => setForm(f => ({
                      ...f,
                      providerType: type,
                      model: MODEL_DEFAULTS[type],
                    }))}
                  />
                  <span className="radio-text">
                    {type === 'anthropic' ? 'Anthropic (Claude)' :
                     type === 'openai' ? 'OpenAI (GPT)' : 'Google (Gemini)'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="apiKey">API Key</label>
            <input
              id="apiKey"
              type="password"
              value={form.apiKey}
              onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
              placeholder={savedConfig?.provider?.apiKey ?? 'Enter API key...'}
              className="form-input"
            />
            <span className="form-hint">Leave empty to keep current key</span>
          </div>

          <div className="form-group">
            <label htmlFor="model">Model</label>
            <input
              id="model"
              type="text"
              value={form.model}
              onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
              placeholder={MODEL_DEFAULTS[form.providerType]}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxTokens">Max Tokens</label>
            <input
              id="maxTokens"
              type="number"
              value={form.maxTokens}
              onChange={e => setForm(f => ({ ...f, maxTokens: parseInt(e.target.value) || 4096 }))}
              min={256}
              max={128000}
              className="form-input"
              style={{ width: '160px' }}
            />
          </div>

          {form.providerType === 'openai' && (
            <div className="form-group">
              <label htmlFor="baseUrl">Base URL (proxy)</label>
              <input
                id="baseUrl"
                type="text"
                value={form.baseUrl}
                onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))}
                placeholder="https://api.openai.com/v1"
                className="form-input"
              />
              <span className="form-hint">Optional — for OpenAI-compatible endpoints</span>
            </div>
          )}
        </div>

        {/* System Prompt */}
        <div className="widget">
          <h2>System Prompt</h2>
          <div className="form-group">
            <textarea
              value={form.systemPrompt}
              onChange={e => setForm(f => ({ ...f, systemPrompt: e.target.value }))}
              className="form-textarea"
              rows={8}
              placeholder="Instructions for the AI assistant..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="widget">
          <h2>Actions</h2>
          <div className="action-buttons">
            <button onClick={handleSave} className="btn btn-primary">
              Save Configuration
            </button>
            <button onClick={handleReset} className="btn btn-secondary">
              Reset to Defaults
            </button>
            <button onClick={handleTest} className="btn btn-test" disabled={testing}>
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {status && (
            <div className={`status-badge ${status.type}`}>
              {status.message}
            </div>
          )}

          {testResult && (
            <div className={`test-result ${testResult.startsWith('Error') ? 'error' : 'success'}`}>
              <strong>Test result:</strong> {testResult}
            </div>
          )}
        </div>

        {/* Current Config */}
        {savedConfig && (
          <div className="widget">
            <h2>Active Configuration</h2>
            <div className="config-summary">
              <div className="config-row">
                <span className="config-label">Provider</span>
                <span className="config-value">{savedConfig.provider?.type}</span>
              </div>
              <div className="config-row">
                <span className="config-label">Model</span>
                <span className="config-value">{savedConfig.provider?.model}</span>
              </div>
              <div className="config-row">
                <span className="config-label">API Key</span>
                <span className="config-value mono">{savedConfig.provider?.apiKey}</span>
              </div>
              <div className="config-row">
                <span className="config-label">Max Tokens</span>
                <span className="config-value">{savedConfig.provider?.maxTokens}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
