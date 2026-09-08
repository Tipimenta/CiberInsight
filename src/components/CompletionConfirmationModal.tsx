import React from 'react';
import { CheckCircle2, Star, X } from 'lucide-react';

interface CompletionConfirmationModalProps {
  totalQuestions: number;
  scoredCount: number;
  countNS: number;
  countNA: number;
  implementationIndex: number | null;
  reviewLaterCount: number;
  onConfirm: () => void;
  onClose: () => void;
}

export const CompletionConfirmationModal: React.FC<CompletionConfirmationModalProps> = ({
  totalQuestions,
  scoredCount,
  countNS,
  countNA,
  implementationIndex,
  reviewLaterCount,
  onConfirm,
  onClose,
}) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5">
      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Confirmar conclusão da avaliação
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Todas as questões possuem resposta válida. Confira o resumo antes de registrar a conclusão.
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Fechar">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <SummaryBox label="Questões respondidas" value={`${totalQuestions}/${totalQuestions}`} />
        <SummaryBox label="Itens pontuados (0–3)" value={String(scoredCount)} />
        <SummaryBox label="NS" value={String(countNS)} />
        <SummaryBox label="NA" value={String(countNA)} />
      </div>

      <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60">
        <span className="text-xs text-indigo-700 font-medium block">Índice de implementação segundo o instrumento</span>
        <span className="text-2xl font-bold text-indigo-700">
          {implementationIndex === null ? 'N/A' : `${implementationIndex.toFixed(1)}%`}
        </span>
        <p className="text-[11px] text-indigo-800 mt-1">
          Calculado somente sobre as respostas numéricas 0–3. NS e NA permanecem fora do denominador.
        </p>
      </div>

      {reviewLaterCount > 0 && (
        <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
          <Star className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Existem <strong>{reviewLaterCount}</strong> questão(ões) marcadas para revisar depois. Essa marcação não bloqueia a conclusão nem altera o índice.
          </span>
        </div>
      )}

      <p className="text-[11px] text-slate-500">
        Se qualquer resposta for alterada depois, a avaliação volta automaticamente ao estado em andamento e deverá ser concluída novamente.
      </p>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
          Voltar e revisar
        </button>
        <button type="button" onClick={onConfirm} className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
          Concluir avaliação
        </button>
      </div>
    </div>
  </div>
);

const SummaryBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
    <span className="block text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</span>
    <span className="block text-lg font-bold text-slate-800 mt-0.5">{value}</span>
  </div>
);
