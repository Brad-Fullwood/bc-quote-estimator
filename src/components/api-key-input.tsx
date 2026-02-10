"use client";

import { useState, useEffect } from "react";
import { Key, Eye, EyeOff } from "lucide-react";
import type { AIProvider } from "@/lib/types";

interface ApiKeyInputProps {
  provider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export function ApiKeyInput({
  provider,
  onProviderChange,
  apiKey,
  onApiKeyChange,
}: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  // Load saved key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`bc-quote-api-key-${provider}`);
    if (saved) {
      onApiKeyChange(saved);
    }
  }, [provider, onApiKeyChange]);

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

      <div className="relative">
        <input
          type={showKey ? "text" : "password"}
          value={apiKey}
          onChange={(e) => handleKeyChange(e.target.value)}
          placeholder={
            provider === "anthropic"
              ? "sk-ant-api03-..."
              : "AIzaSy..."
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
      <p className="text-xs text-muted mt-2">
        Your API key is stored locally in your browser and sent directly to{" "}
        {provider === "anthropic" ? "Anthropic" : "Google"}. It never touches
        our servers.
      </p>
    </div>
  );
}
