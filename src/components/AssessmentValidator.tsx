import React from 'react';
import type { ValidationError } from '../services/validation';

interface CompletionModalProps {
  errors: ValidationError[];
  onOpenQuestion: (questionId: number) => void;
  onClose: () => void;
}

// Modal renderizado ao tentar clicar em "Concluir Avaliação"
export const CompletionValidationModal: React.FC<CompletionModalProps> = ({
  errors,
  onOpenQuestion,
  onClose,
}) => {
  if (errors.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
              ⚠️ Avaliação Incompleta ({errors.length} pendências)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Corrija os itens abaixo antes de concluir a avaliação.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">
            ✕
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {errors.map((err) => (
            <div
              key={err.questionId}
              onClick={() => {
                onOpenQuestion(err.questionId);
                onClose();
              }}
              className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs flex justify-between items-center cursor-pointer hover:border-rose-400 transition-colors"
            >
              <span className="text-rose-950 font-medium">{err.message}</span>
              <span className="text-rose-700 font-bold shrink-0 ml-2">Corrigir →</span>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};