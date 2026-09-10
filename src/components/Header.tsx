import React from 'react';
import { Save, FileText, History, ShieldPlus } from 'lucide-react';

export type AppViewMode = 'assessment' | 'results';

interface HeaderProps {
  progressPercentage: number;
  answeredCount: number;
  totalQuestions: number;
  assessmentId: string;
  lastSavedTime: string;
  onCreateNewAssessment: () => void;
  onOpenSavedAssessments: () => void;
  onOpenExportModal: () => void;
  onSwitchView: (view: AppViewMode) => void;
  currentView: AppViewMode;
  autoAdvancePending?: boolean;
  autoAdvanceProgressCycle?: number;
}

export const Header: React.FC<HeaderProps> = ({
  progressPercentage,
  answeredCount,
  totalQuestions,
  assessmentId,
  lastSavedTime,
  onCreateNewAssessment,
  onOpenSavedAssessments,
  onOpenExportModal,
  onSwitchView,
  currentView,
  autoAdvancePending = false,
  autoAdvanceProgressCycle = 0,
}) => {
  return (
    <header className="relative bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      {autoAdvancePending && (
        <div className="absolute inset-x-0 top-0 h-1 bg-slate-800 overflow-hidden" aria-hidden="true">
          <div
            key={autoAdvanceProgressCycle}
            className="h-full bg-emerald-500 origin-left animate-auto-advance-top-line"
          />
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/favicon.png"
              alt="CiberInsight"
              className="w-7 h-7 rounded-sm shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-100 truncate">
                CiberInsight
              </h1>
              <p className="hidden sm:block text-[11px] text-slate-300 truncate">
                Autoavaliação do nível de implementação de controles de segurança cibernética
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 sm:gap-4 text-xs">
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/80">
            <button
              onClick={() => onSwitchView('assessment')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                currentView === 'assessment'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Avaliação
            </button>
            <button
              onClick={() => onSwitchView('results')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                currentView === 'results'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Resultados
            </button>
          </div>

          {currentView === 'assessment' && (
            <div className="hidden md:flex items-center gap-2 bg-slate-800/60 px-3 py-1 rounded-lg border border-slate-700/60 text-slate-300">
              <div className="w-20 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="font-mono text-[11px] font-bold text-white">
                {answeredCount}/{totalQuestions} ({progressPercentage.toFixed(1)}%)
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenSavedAssessments}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-700 shadow-xs"
            title="Abrir avaliações salvas neste navegador"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Avaliações</span>
          </button>

          <button
            type="button"
            onClick={onCreateNewAssessment}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-700 shadow-xs"
            title="Iniciar uma nova avaliação anônima"
          >
            <ShieldPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova avaliação</span>
          </button>

          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gerar relatório</span>
          </button>

          <span
            className="hidden xl:inline-flex px-2 py-1 rounded-md border border-slate-700 bg-slate-800/70 text-[10px] font-mono text-slate-300"
            title="Identificador anônimo da avaliação atual"
          >
            {assessmentId}
          </span>

          {lastSavedTime && (
            <span className="hidden lg:flex text-[10px] text-emerald-400 items-center gap-1" title={`Último salvamento local às ${lastSavedTime}`}>
              <Save className="w-3 h-3" />
              Salvo
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
