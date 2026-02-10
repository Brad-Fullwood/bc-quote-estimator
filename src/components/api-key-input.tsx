"use client";

import { useState, useEffect, useCallback } from "react";
import { Key, Eye, EyeOff, Loader2, RefreshCw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { AIProvider, AIModel } from "@/lib/types";

interface ApiKeyInputProps {
  provider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  model: string;
  onModelChange: (model: string) => void;
}

export function ApiKeyInput({
  provider,
  onProviderChange,
  apiKey,
  onApiKeyChange,
  model,
  onModelChange,
}: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const fetchModels = useCallback(
    async (key: string) => {
      if (!key.trim()) {
        setModels([]);
        return;
      }

      setLoadingModels(true);
      try {
        const response = await fetch("/api/models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, apiKey: key }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch models");
        }

        const data = await response.json();
        setModels(data.models);

        // Auto-select first model if none selected or current selection invalid
        const ids = (data.models as AIModel[]).map((m) => m.id);
        if (ids.length > 0 && !ids.includes(model)) {
          onModelChange(ids[0]);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch models"
        );
        setModels([]);
      } finally {
        setLoadingModels(false);
      }
    },
    [provider, model, onModelChange]
  );

  // Load saved key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`bc-quote-api-key-${provider}`);
    if (saved) {
      onApiKeyChange(saved);
    } else {
      onApiKeyChange("");
      setModels([]);
    }
  }, [provider, onApiKeyChange]);

  // Fetch models when api key changes (debounced)
  useEffect(() => {
    if (!apiKey.trim()) {
      setModels([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchModels(apiKey);
    }, 800);

    return () => clearTimeout(timer);
  }, [apiKey, fetchModels]);

  function handleKeyChange(value: string) {
    onApiKeyChange(value);
    localStorage.setItem(`bc-quote-api-key-${provider}`, value);
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Key className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">AI Provider</h3>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onProviderChange("anthropic")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            provider === "anthropic"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-surface-hover text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          Claude (Anthropic)
        </button>
        <button
          onClick={() => onProviderChange("google")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            provider === "google"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-surface-hover text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          Gemini (Google)
        </button>
      </div>

      <div className="relative mb-4">
        <input
          type={showKey ? "text" : "password"}
          value={apiKey}
          onChange={(e) => handleKeyChange(e.target.value)}
          placeholder={
            provider === "anthropic" ? "sk-ant-api03-..." : "AIzaSy..."
          }
          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 pr-10 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        <button
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showKey ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Model selector */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-muted-foreground">Model</label>
          {apiKey.trim() && (
            <button
              onClick={() => fetchModels(apiKey)}
              disabled={loadingModels}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <RefreshCw
                className={`w-3 h-3 ${loadingModels ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          )}
        </div>
        <div className="relative">
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={loadingModels || models.length === 0}
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingModels ? (
              <option>Loading models...</option>
            ) : models.length === 0 ? (
              <option>Enter API key to load models</option>
            ) : (
              models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))
            )}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            {loadingModels ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted">
        Your API key is stored locally in your browser and sent directly to{" "}
        {provider === "anthropic" ? "Anthropic" : "Google"}. It never touches
        our servers.
      </p>
    </div>
  );
}
