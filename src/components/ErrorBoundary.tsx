import React, { ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred in the neural swarm.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.authInfo && parsed.operationType) {
            isFirestoreError = true;
            errorMessage = `Neural Sync Failure: ${parsed.error} during ${parsed.operationType} on ${parsed.path}`;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#d6d6d6] flex items-center justify-center p-8">
          <div className="max-w-md w-full glass p-10 rounded-[40px] border border-red-500/40 text-center space-y-6 bg-white shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto">
              <AlertCircle className="text-red-600 w-10 h-10 font-bold" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tighter text-red-600 uppercase tracking-widest italic font-extrabold">Protocol Error</h2>
              <p className="text-slate-900 text-sm leading-relaxed font-mono font-bold italic">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-4 rounded-2xl bg-black/5 border border-black/10 hover:bg-black/20 transition-all font-bold flex items-center justify-center gap-3 shadow-lg text-slate-800"
            >
              <RotateCcw className="w-5 h-5" />
              REBOOT SWARM_OS
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
