import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorStr: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorStr: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorStr: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Send to our generic logs endpoint
    fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "error",
        source: "ErrorBoundary",
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
      }),
    }).catch((e) => console.error("Could not send error report", e));
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border border-red-500/20 bg-red-500/10 rounded-xl text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
          <h2 className="text-[12px] font-black text-rose-500 uppercase tracking-widest mb-1">
            Greška komponente
          </h2>
          <p className="text-xl font-black text-slate-800 dark:text-white mb-2">
            Podaci nedostupni
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Došlo je do grafičkog problema pri učitavanju ovog blok-a, ali smo
            izolovali grešku.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors"
          >
            Pokušaj ponovo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
