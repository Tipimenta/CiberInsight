import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<unknown>, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erro não tratado na aplicação:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-rose-200 rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            <h1 className="text-lg font-bold text-slate-900">Não foi possível exibir a aplicação</h1>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Ocorreu um erro inesperado na interface. As respostas são salvas localmente no navegador e não são apagadas por esta tela.
          </p>
          <p className="text-xs text-slate-500">
            Tente recarregar a página. Se o problema persistir, use a opção de restauração/importação assim que a aplicação voltar a abrir.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Recarregar aplicação
          </button>
        </div>
      </div>
    );
  }
}
