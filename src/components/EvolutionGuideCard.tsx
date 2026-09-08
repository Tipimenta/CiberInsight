import React, { useState } from 'react';
import type { Question, ControlGuidanceItem, TransitionDetail, ScoreValue } from '../types';
import { ControlGuidanceModal } from './ControlGuidanceModal';
import { isNumericScoreValue } from '../services/scoreValue';

interface EvolutionGuideCardProps {
  question: Question;
  currentScore: ScoreValue | null;
  guidance?: ControlGuidanceItem;
}

export const EvolutionGuideCard: React.FC<EvolutionGuideCardProps> = ({
  question,
  currentScore,
  guidance,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isNumericScoreValue(currentScore)) {
    return null;
  }

  const currentCriteriaText = question.criteria[currentScore] || question.criteria[String(currentScore)] || '';
  const nextScore = currentScore < 3 ? currentScore + 1 : 3;
  const nextCriteriaText = question.criteria[nextScore] || question.criteria[String(nextScore)] || '';

  // Seleciona o objeto da transição ativa conforme a resposta atual
  const getActiveTransitionDetail = (): TransitionDetail | undefined => {
    if (!guidance?.transitions) return undefined;
    if (currentScore === 0) return guidance.transitions.from0To1;
    if (currentScore === 1) return guidance.transitions.from1To2;
    if (currentScore === 2) return guidance.transitions.from2To3;
    if (currentScore === 3) return guidance.transitions.maintainLevel3;
    return undefined;
  };

  const activeDetail = getActiveTransitionDetail();
  const summaryText = activeDetail?.summary || (currentScore === 3
    ? 'Manter os elementos exigidos no critério do nível 3 e verificar periodicamente se a evidência continua válida.'
    : `Usar o critério do nível ${nextScore} como meta e implementar os elementos que ainda não estão presentes.`);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm hover:border-indigo-300 transition-colors">
      {/* Topo do Card */}
      <div className="flex justify-between items-start gap-2">
        <span className="text-xs font-bold text-slate-800">
          Questão #{question.id} — {question.dimension}
        </span>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          Nível de Implementação Atual: {currentScore}
        </span>
      </div>

      <p className="text-xs font-medium text-slate-900 leading-snug">{question.question}</p>

      {/* Situação Atual x Próximo Nível / Manutenção */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
          <span className="font-bold text-slate-500 block text-[10px] uppercase">
            Situação Atual (Nível {currentScore})
          </span>
          <p className="text-slate-700 mt-0.5">{currentCriteriaText}</p>
        </div>

        {currentScore < 3 ? (
          <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-200/80">
            <span className="font-bold text-indigo-700 block text-[10px] uppercase">
              Próximo Nível Esperado (Nível {nextScore})
            </span>
            <p className="text-indigo-950 mt-0.5">{nextCriteriaText}</p>
          </div>
        ) : (
          <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-200/80">
            <span className="font-bold text-emerald-700 block text-[10px] uppercase">
              Objetivo de manutenção
            </span>
            <p className="text-emerald-950 mt-0.5">
              {activeDetail?.objective || (
                <span className="text-slate-400 italic">
                  Manter o controle atendendo ao critério do nível 3 e preservar evidências atualizadas.
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Resumo da Ação Sugerida ou Prática Recomendada */}
      <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-slate-100">
        <div className="text-xs flex-1">
          <span className="font-bold text-slate-800">
            {currentScore === 3 ? 'Prática recomendada: ' : 'Ação sugerida: '}
          </span>
          {summaryText ? (
            <span className="text-slate-600">{summaryText}</span>
          ) : (
            <span className="text-slate-400 italic">
              {currentScore === 3
                ? 'Prática recomendada ainda não cadastrada para este controle.'
                : 'Guia de evolução ainda não cadastrado para este controle.'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shrink-0 shadow-xs transition-colors cursor-pointer"
        >
          {currentScore === 3 ? 'Como manter este controle?' : 'Como implementar isso?'}
        </button>
      </div>

      {isModalOpen && (
        <ControlGuidanceModal
          question={question}
          currentScore={currentScore}
          guidance={guidance}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};