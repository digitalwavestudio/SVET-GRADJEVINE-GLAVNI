import React, { Component, ErrorInfo, ReactNode } from 'react';

interface AdminErrorBoundaryProps {
  children?: ReactNode;
}

interface AdminErrorBoundaryState {
  hasError: boolean;
}

export class AdminErrorBoundary extends Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  public state: AdminErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): AdminErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AdminErrorBoundary] Uncaught tab error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-500/5 border border-red-500/10 p-12 rounded-[10px] text-center max-w-2xl mx-auto my-12 backdrop-blur-sm">
          <div className="w-16 h-16 bg-red-500/10 rounded-[10px] flex items-center justify-center mb-6 mx-auto border border-red-500/20">
            <span className="material-symbols-outlined text-red-500 text-3xl">report</span>
          </div>
          <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">
            Deo interfejsa je privremeno nedostupan
          </h4>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] max-w-md mx-auto mb-8">
            Došlo je do neočekivanog klijentskog pucanja dela koda pri renderovanju. Ostali moduli administracije rade nesmetano.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-black rounded-[10px] text-[10px] uppercase tracking-widest border border-white/10 transition-all"
          >
            OSVEŽI MODUL
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
