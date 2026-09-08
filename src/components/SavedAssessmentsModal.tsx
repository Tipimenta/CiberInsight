import React, { useRef, useState } from 'react';
import { EllipsisVertical, FileUp, GitCompareArrows, History, Play, X } from 'lucide-react';
import type { FullAssessment } from '../types';
import { importAssessmentBackup } from '../services/storage';

interface SavedAssessmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessments: FullAssessment[];
  currentAssessmentId: string;
  currentInstrumentVersion: string;
  validQuestionIds: number[];
  onOpenAssessment: (assessment: FullAssessment) => void;
  onCompareAssessment: (assessment: FullAssessment) => void;
  onExportAssessment: (assessment: FullAssessment) => void;
  onImportAssessmentToHistory: (assessment: FullAssessment) => void;
}

export const SavedAssessmentsModal: React.FC<SavedAssessmentsModalProps> = ({
  isOpen,
  onClose,
  assessments,
  currentAssessmentId,
  currentInstrumentVersion,
  validQuestionIds,
  onOpenAssessment,
  onCompareAssessment,
  onExportAssessment,
  onImportAssessmentToHistory,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const content = await file.text();
      const imported = importAssessmentBackup(
        content,
        currentInstrumentVersion,
        validQuestionIds
      );
      onImportAssessmentToHistory(imported);
      setMessage({
        type: 'success',
        text: `Avaliação ${imported.metadata.id} importada para o histórico. Agora você pode abri-la ou compará-la.`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível importar a avaliação.',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pr-8">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
              <History className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Avaliações</h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                Abra uma avaliação anterior ou compare-a com a atual. Tudo permanece armazenado localmente neste navegador.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shrink-0"
          >
            <FileUp className="w-4 h-4" />
            Importar avaliação de outro dispositivo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>

        {message && (
          <div className={`px-3 py-2 rounded-lg border text-xs ${message.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            {message.text}
          </div>
        )}

        {assessments.length === 0 ? (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600">
            Nenhuma avaliação local encontrada.
          </div>
        ) : (
          <div className="space-y-2">
            {assessments.map((item) => {
              const isCurrent = item.metadata.id === currentAssessmentId;
              const compatible = item.metadata.instrumentVersion === currentInstrumentVersion;
              const answered = Object.values(item.answers).filter((answer) => answer.score !== null && answer.score !== undefined).length;

              return (
                <div
                  key={item.metadata.id}
                  className={`p-4 rounded-xl border ${isCurrent ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.metadata.id}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">Atual</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.metadata.completedAt ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                          {item.metadata.completedAt ? 'Concluída' : 'Em andamento'}
                        </span>
                        {!compatible && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                            Instrumento {item.metadata.instrumentVersion}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {answered} de {validQuestionIds.length} respondida(s) · {formatDate(item.metadata.updatedAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 relative">
                      <button
                        type="button"
                        disabled={isCurrent || !compatible}
                        onClick={() => onOpenAssessment(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Abrir
                      </button>
                      <button
                        type="button"
                        disabled={isCurrent || !compatible}
                        onClick={() => onCompareAssessment(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <GitCompareArrows className="w-3.5 h-3.5" />
                        Comparar
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpenMenuId((current) => current === item.metadata.id ? null : item.metadata.id)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                        aria-label={`Mais opções para ${item.metadata.id}`}
                        aria-expanded={openMenuId === item.metadata.id}
                      >
                        <EllipsisVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === item.metadata.id && (
                        <div className="absolute right-0 top-11 z-10 min-w-48 p-1.5 rounded-lg border border-slate-200 bg-white shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              onExportAssessment(item);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 text-xs font-medium text-slate-700"
                          >
                            Exportar backup JSON
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-600 leading-relaxed">
          <strong>Backup:</strong> as avaliações permanecem somente neste navegador. Para guardar uma cópia externa, use <strong>⋯ → Exportar backup JSON</strong> na avaliação desejada.
        </div>
      </div>
    </div>
  );
};

function formatDate(value?: string): string {
  if (!value) return 'data não informada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR');
}

export default SavedAssessmentsModal;
