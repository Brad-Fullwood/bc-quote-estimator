"use client";

import { Calculator, Github, Settings } from "lucide-react";

interface HeaderProps {
  onSettingsClick: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
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
        <div className="flex items-center gap-3">
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
            title="Estimation Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <a
            href="https://github.com/Brad-Fullwood/bc-quote-estimator"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="View on GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="https://technicallybusinesscentral.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            technicallybusinesscentral.co.uk
          </a>
        </div>
      </div>
    </header>
  );
}
