import React, { useEffect, useRef, useState } from 'react';
import type { Question, ScoreValue, QuestionAnswer, VerificationGuidanceItem } from '../types';
import { VerificationGuidanceModal } from './VerificationGuidanceModal';
import { Star } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  currentAnswer?: QuestionAnswer;
  onAnswerChange: (answer: QuestionAnswer) => void;
  onNext?: () => void;
  onPrev?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  verificationGuidance?: VerificationGuidanceItem;
  autoAdvance?: boolean;
  onAutoAdvanceChange?: (enabled: boolean) => void;
  onAutoAdvancePendingChange?: (active: boolean) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentAnswer,
  onAnswerChange,
  onNext,
  onPrev,
  isFirst,
  isLast,
  verificationGuidance,
  autoAdvance = true,
  onAutoAdvanceChange,
  onAutoAdvancePendingChange,
}) => {
  const score = currentAnswer?.score ?? null;
  const isNsOrNa = score === 'NS' || score === 'NA';
  const justification = currentAnswer?.nsNaJustification || '';
  const isJustificationValid = !isNsOrNa || justification.trim().length > 0;
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const [isObservationOpen, setIsObservationOpen] = useState(Boolean(currentAnswer?.observation?.trim()));

  useEffect(() => {
    setIsObservationOpen(Boolean(currentAnswer?.observation?.trim()));
  }, [question.id, currentAnswer?.observation]);

  const cancelPendingAutoAdvance = () => {
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    onAutoAdvancePendingChange?.(false);
  };

  useEffect(() => () => {
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
    }
    onAutoAdvancePendingChange?.(false);
  }, []);

  useEffect(() => {
    if (!autoAdvance) cancelPendingAutoAdvance();
  }, [autoAdvance]);

  const scheduleAutoAdvance = () => {
    cancelPendingAutoAdvance();
    onAutoAdvancePendingChange?.(true);

    autoAdvanceTimerRef.current = window.setTimeout(() => {
      autoAdvanceTimerRef.current = null;
      onAutoAdvancePendingChange?.(false);
      onNext?.();
    }, 2000);
  };

  const handleScoreSelect = (newScore: ScoreValue) => {
    cancelPendingAutoAdvance();
    const shouldClearJustification =
      (score === 'NS' && newScore === 'NA') ||
      (score === 'NA' && newScore === 'NS') ||
      typeof newScore === 'number';

    onAnswerChange({
      ...currentAnswer,
      questionId: question.id,
      score: newScore,
      nsNaJustification: shouldClearJustification ? '' : currentAnswer?.nsNaJustification,
      updatedAt: new Date().toISOString(),
    });

    // Para agilizar a aplicação sequencial, respostas numéricas podem avançar
    // após uma breve janela de 3 segundos. A contagem é cancelada se o usuário
    // interagir com os campos de evidência/observação. NS/NA permanecem na tela
    // porque exigem justificativa antes da conclusão da avaliação.
    if (
      typeof newScore === 'number' &&
      autoAdvance &&
      newScore !== score &&
      !isLast &&
      onNext
    ) {
      scheduleAutoAdvance();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 md:p-5 space-y-4">
      {/* Topo */}
      <div className="flex justify-between items-center gap-3 text-xs font-semibold text-slate-500 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span>Questão #{question.id} — {question.dimension}</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono shrink-0">ID: {question.dimensionId}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            cancelPendingAutoAdvance();
            onAnswerChange({
              ...currentAnswer,
              questionId: question.id,
              score,
              reviewLater: !currentAnswer?.reviewLater,
              updatedAt: new Date().toISOString(),
            });
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
            currentAnswer?.reviewLater
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
          title="Marcar esta questão para revisar depois"
        >
          <Star className={`w-3.5 h-3.5 ${currentAnswer?.reviewLater ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">{currentAnswer?.reviewLater ? 'Marcada para revisar' : 'Revisar depois'}</span>
        </button>
      </div>

      <h2 className="text-sm font-bold text-slate-900 leading-snug">{question.question}</h2>

      {/* O painel lateral oferece consulta rápida; este botão abre apenas o roteiro detalhado. */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 bg-sky-50/60 rounded-xl border border-sky-200 text-xs">
        <div className="min-w-0">
          <p className="font-bold text-sky-950">Guia de verificação</p>
          <p className="text-[10px] text-sky-800 mt-0.5 leading-snug">Roteiro detalhado para confirmar evidências e comparar a situação encontrada com os níveis 0–3.</p>
        </div>
        <button
          type="button"
          onClick={() => { cancelPendingAutoAdvance(); setIsVerificationOpen(true); }}
          className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg font-bold shrink-0 transition-colors cursor-pointer"
        >
          Abrir guia
        </button>
      </div>


      {/* Seleção de Níveis 0 a 3 */}
      <div className="space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <label className="block text-xs font-bold text-slate-700">Selecione o Nível de Implementação:</label>
          {onAutoAdvanceChange && (
            <label
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer select-none"
              title="Ao selecionar Nível 0–3, aguarda 3 segundos e abre a questão seguinte em ordem. Interagir com evidência ou observação cancela a contagem. NS/NA permanecem na questão para permitir a justificativa."
            >
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(event) => onAutoAdvanceChange(event.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Avançar após 2s ao selecionar Nível 0–3
            </label>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {[0, 1, 2, 3].map((level) => {
            const isSelected = score === level;
            const criterionText = question.criteria[level] || question.criteria[String(level)] || '';

            return (
              <button
                key={level}
                type="button"
                onClick={() => handleScoreSelect(level as ScoreValue)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-950 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-indigo-600 mb-0.5">Nível {level}</div>
                <div className="text-[11px] leading-snug">{criterionText}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* O indicador visual do autoavanço é exibido no topo global do site. */}

      {/* Opções NS e NA */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => handleScoreSelect('NS')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
            score === 'NS'
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
          }`}
        >
          NS — Informação/evidência insuficiente
        </button>

        <button
          type="button"
          onClick={() => handleScoreSelect('NA')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
            score === 'NA'
              ? 'bg-slate-700 text-white border-slate-700'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
        >
          NA — Não aplicável
        </button>
      </div>

      {/* Campo Obrigatório para NS e NA */}
      {isNsOrNa && (
        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 space-y-1.5 text-xs">
          <label className="block font-bold text-purple-950">
            Justificativa para {score === 'NS' ? 'Informação/evidência insuficiente (NS)' : 'Não aplicável (NA)'} *
          </label>
          <textarea
            rows={2}
            value={justification}
            onChange={(e) =>
              onAnswerChange({
                ...currentAnswer,
                questionId: question.id,
                score,
                nsNaJustification: e.target.value,
                updatedAt: new Date().toISOString(),
              })
            }
            placeholder="Descreva a justificativa para esta opção..."
            className={`w-full p-2 text-xs border rounded-lg bg-white focus:outline-none focus:ring-2 ${
              !isJustificationValid
                ? 'border-amber-400 focus:ring-amber-500'
                : 'border-purple-300 focus:ring-purple-500'
            }`}
          />
          {!isJustificationValid && (
            <span className="text-[11px] font-semibold text-amber-700 block">
              ⚠️ A justificativa pode ser preenchida depois, mas será exigida para concluir a avaliação.
            </span>
          )}
        </div>
      )}

      {/* Registro opcional que dá rastreabilidade à resposta, sem exigir análise técnica do usuário */}
      <div className="pt-2 border-t border-slate-100 text-xs space-y-2.5">
        <div className="space-y-1">
          <label className="block font-bold text-slate-800">
            Registrar evidência utilizada (opcional)
          </label>
          <p className="text-[11px] text-slate-500 leading-snug">
            Se quiser, anote em que você se baseou para escolher o nível: documento, procedimento, tela/configuração observada, relatório, contrato ou confirmação técnica.
          </p>
          <textarea
            rows={2}
            value={currentAnswer?.evidence || ''}
            onFocus={cancelPendingAutoAdvance}
            onChange={(e) => {
              cancelPendingAutoAdvance();
              onAnswerChange({
                ...currentAnswer,
                questionId: question.id,
                score,
                evidence: e.target.value,
                updatedAt: new Date().toISOString(),
              });
            }}
            placeholder="Ex.: Política de Segurança v1.2; configuração observada no sistema; confirmação do responsável pela TI..."
            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[10px] text-amber-700 font-medium">
            ⚠️ Não inserir dados de pacientes, credenciais, IPs, nomes de servidores ou outras informações sensíveis.
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => {
              cancelPendingAutoAdvance();
              setIsObservationOpen((open) => !open);
            }}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
            aria-expanded={isObservationOpen}
          >
            <span>
              <span className="font-bold text-slate-800">Adicionar observação (opcional)</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">
                Use apenas se houver algum detalhe que ajude a lembrar o contexto da resposta. Pode deixar em branco.
              </span>
            </span>
            <span className="text-slate-500 text-sm" aria-hidden="true">{isObservationOpen ? '−' : '+'}</span>
          </button>

          {isObservationOpen && (
            <div className="p-3.5 bg-white border-t border-slate-200 space-y-1">
              <textarea
                rows={3}
                value={currentAnswer?.observation || ''}
                onFocus={cancelPendingAutoAdvance}
                onChange={(e) => {
                  cancelPendingAutoAdvance();
                  onAnswerChange({
                    ...currentAnswer,
                    questionId: question.id,
                    score,
                    observation: e.target.value,
                    updatedAt: new Date().toISOString(),
                  });
                }}
                placeholder="Ex.: o procedimento existe, mas ainda não contempla prestadores externos."
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      </div>

      {isVerificationOpen && (
        <VerificationGuidanceModal
          question={question}
          guidance={verificationGuidance}
          onClose={() => setIsVerificationOpen(false)}
        />
      )}

      {/* Navegação Entre Questões */}
      <div className="sticky bottom-3 z-10 flex justify-between items-center pt-3 mt-2 border-t border-slate-100 text-xs bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <button
          type="button"
          onClick={() => { cancelPendingAutoAdvance(); onPrev?.(); }}
          disabled={isFirst}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold disabled:opacity-40 cursor-pointer hover:bg-slate-200 transition-colors"
        >
          ← Anterior
        </button>

        <button
          type="button"
          onClick={() => { cancelPendingAutoAdvance(); onNext?.(); }}
          disabled={isLast}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold disabled:opacity-40 cursor-pointer hover:bg-indigo-700 transition-colors"
        >
          Próxima →
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;