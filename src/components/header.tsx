"use client";

import { Calculator } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              BC Quote Estimator
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Technically Business Central
            </p>
          </div>
        </div>
        <a
          href="https://technicallybusinesscentral.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          technicallybusinesscentral.co.uk
        </a>
      </div>
    </header>
  );
}
