import React from 'react';
import type { Question, ControlGuidanceItem, TransitionDetail, PracticalResource, ScoreValue } from '../types';
import { isNumericScoreValue } from '../services/scoreValue';
import { getRelatedQuestions } from '../services/relatedControls';

interface ControlGuidanceModalProps {
  question: Question;
  currentScore: ScoreValue | null;
  guidance?: ControlGuidanceItem;
  onClose: () => void;
}

export const ControlGuidanceModal: React.FC<ControlGuidanceModalProps> = ({
  question,
  currentScore,
  guidance,
  onClose,
}) => {
  type TransitionKeyType = 'from0To1' | 'from1To2' | 'from2To3' | 'maintainLevel3';

  const getActiveTransition = (): { key: TransitionKeyType | ''; label: string; detail?: TransitionDetail } => {
    if (currentScore === 0) {
      return { key: 'from0To1', label: 'Evolução: Nível 0 → Nível 1', detail: guidance?.transitions?.from0To1 };
    }
    if (currentScore === 1) {
      return { key: 'from1To2', label: 'Evolução: Nível 1 → Nível 2', detail: guidance?.transitions?.from1To2 };
    }
    if (currentScore === 2) {
      return { key: 'from2To3', label: 'Evolução: Nível 2 → Nível 3', detail: guidance?.transitions?.from2To3 };
    }
    if (currentScore === 3) {
      return { key: 'maintainLevel3', label: 'Manutenção do Nível 3', detail: guidance?.transitions?.maintainLevel3 };
    }
    return { key: '', label: 'Guia de Evolução', detail: undefined };
  };

  const { key: transitionKey, label: transitionLabel, detail } = getActiveTransition();
  const refs = question.references;
  const relatedQuestions = getRelatedQuestions(question);
  const currentCriterion = isNumericScoreValue(currentScore)
    ? question.criteria[currentScore] || question.criteria[String(currentScore)] || ''
    : '';
  const targetLevel = isNumericScoreValue(currentScore) && currentScore < 3 ? currentScore + 1 : 3;
  const targetCriterion = question.criteria[targetLevel] || question.criteria[String(targetLevel)] || '';

  // Filtra materiais aplicáveis à transição ativa ou marcados como 'all'
  const filteredResources = guidance?.practicalResources?.filter((res) => {
    if (!res.applicableTransitions || res.applicableTransitions.length === 0) return true;
    if (res.applicableTransitions.includes('all')) return true;
    return transitionKey !== '' && res.applicableTransitions.includes(transitionKey);
  });

  const getResourceTypeBadge = (type: PracticalResource['type']) => {
    switch (type) {
      case 'template':
        return { icon: '📄', label: 'Modelo de documento' };
      case 'checklist':
        return { icon: '☑️', label: 'Checklist' };
      case 'example':
        return { icon: '👁️', label: 'Exemplo preenchido' };
      case 'official_reference':
        return { icon: '📚', label: 'Referência oficial' };
      case 'implementation_guide':
        return { icon: '🛠️', label: 'Guia de implementação' };
      default:
        return { icon: '📌', label: 'Recurso' };
    }
  };

  const getResourceButtonLabel = (type: PracticalResource['type']) => {
    switch (type) {
      case 'template':
        return 'Abrir modelo →';
      case 'checklist':
        return 'Abrir checklist →';
      case 'example':
        return 'Ver exemplo →';
      case 'official_reference':
        return 'Consultar fonte oficial →';
      case 'implementation_guide':
        return 'Abrir guia →';
      default:
        return 'Abrir recurso →';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Cabeçalho */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-start shrink-0">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              {transitionLabel} — Questão #{question.id} ({question.dimensionId})
            </span>
            <h3 className="text-lg font-bold mt-2 text-slate-100">{question.question}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-xl leading-none p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Por que isso importa */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">📌 Por que este controle importa?</h4>
            <p className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed text-slate-600">
              {guidance?.whyItMatters || `Este controle integra a dimensão ${question.dimension}. Use os critérios da questão para avaliar a implementação e orientar a evolução sem inferir risco ou criticidade automaticamente.`}
            </p>
          </div>

          {!detail ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-950 rounded-xl leading-relaxed">
                <strong>Orientação básica:</strong> o guia detalhado específico desta questão ainda não foi cadastrado. A orientação abaixo usa somente os critérios da própria questão e a evidência esperada registrada na matriz do instrumento.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-1">Situação atual — Nível {currentScore}</h5>
                  <p className="text-slate-700">{currentCriterion || 'Critério atual não cadastrado.'}</p>
                </div>
                <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200">
                  <h5 className="font-bold text-indigo-900 mb-1">
                    {currentScore === 3 ? 'Objetivo de manutenção' : `Meta — Nível ${targetLevel}`}
                  </h5>
                  <p className="text-indigo-950">{targetCriterion || 'Critério de destino não cadastrado.'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">📋 Como conduzir a melhoria</h4>
                <ol className="list-decimal list-inside space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  {currentScore === 3 ? (
                    <>
                      <li>Confirme periodicamente se todos os elementos exigidos no critério do nível 3 continuam presentes.</li>
                      <li>Mantenha a evidência atualizada e acessível para nova verificação.</li>
                      <li>Revise o controle após mudanças relevantes, incidentes ou alterações de processo quando pertinente.</li>
                      <li>Reavalie a questão e registre qualquer perda de cobertura ou formalização.</li>
                    </>
                  ) : (
                    <>
                      <li>Compare a situação atual com o critério do próximo nível.</li>
                      <li>Identifique quais elementos do critério de destino ainda não estão presentes.</li>
                      <li>Defina quem deve implementar ou formalizar os elementos faltantes.</li>
                      <li>Implemente a melhoria e mantenha evidência verificável da mudança.</li>
                      <li>Reavalie a questão usando os mesmos critérios 0–3.</li>
                    </>
                  )}
                </ol>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">📂 Evidência esperada</h4>
                <p className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200/80 text-emerald-950">
                  {question.expectedEvidence || 'Evidência esperada ainda não cadastrada para esta questão.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Objetivo & Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200">
                  <h5 className="font-bold text-indigo-900 mb-1">🎯 Objetivo da Transição</h5>
                  <p className="text-indigo-950">{detail.objective || 'Não cadastrado.'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-1">📝 Resumo da Ação</h5>
                  <p className="text-slate-700">{detail.summary || 'Não cadastrado.'}</p>
                </div>
              </div>

              {/* O que está faltando */}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">🔍 O que está faltando para esta transição</h4>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-slate-700">
                  {detail.whatIsMissing || 'Não cadastrado.'}
                </p>
              </div>

              {/* Passo a Passo */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">📋 Passos Práticos</h4>
                {detail.practicalSteps && detail.practicalSteps.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                    {detail.practicalSteps.map((step, idx) => (
                      <li key={idx} className="text-slate-700">{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-slate-400 italic">Passos práticos não cadastrados.</p>
                )}
              </div>

              {/* Quem envolver & Evidências */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">👥 Quem envolver</h4>
                  {detail.whoToInvolve && detail.whoToInvolve.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                      {detail.whoToInvolve.map((person, idx) => (
                        <li key={idx}>{person}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic">Não cadastrado.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">📂 Evidências Esperadas</h4>
                  {detail.expectedEvidence && detail.expectedEvidence.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 bg-emerald-50/50 p-3 rounded-lg border border-emerald-200/80 text-emerald-950">
                      {detail.expectedEvidence.map((ev, idx) => (
                        <li key={idx}>{ev}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic">Não cadastrado.</p>
                  )}
                </div>
              </div>

              {/* Como saber que esta etapa foi concluída? & Erros Comuns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">✅ Como saber que esta etapa foi concluída?</h4>
                  {detail.completionCriteria && detail.completionCriteria.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 bg-blue-50/50 p-3 rounded-lg border border-blue-200/80 text-blue-950">
                      {detail.completionCriteria.map((crit, idx) => (
                        <li key={idx}>{crit}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic">Não cadastrado.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">⚠️ Erros Comuns</h4>
                  {detail.commonMistakes && detail.commonMistakes.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 bg-amber-50/50 p-3 rounded-lg border border-amber-200/80 text-amber-950">
                      {detail.commonMistakes.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic">Não cadastrado.</p>
                  )}
                </div>
              </div>

              {/* MATERIAIS PARA AJUDAR NA IMPLEMENTAÇÃO */}
              {filteredResources && filteredResources.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">🧰 Materiais para ajudar na implementação</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredResources.map((res) => {
                      const typeBadge = getResourceTypeBadge(res.type);
                      const buttonText = getResourceButtonLabel(res.type);
                      const isOfficial = res.sourceType === 'official';

                      return (
                        <div
                          key={res.id}
                          className="p-3.5 rounded-xl border bg-white space-y-2 flex flex-col justify-between shadow-sm hover:border-indigo-300 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                <span>{typeBadge.icon}</span> {typeBadge.label}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isOfficial
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                }`}
                              >
                                {isOfficial ? `Fonte Oficial (${res.sourceName || 'Externa'})` : 'Material do Instrumento'}
                              </span>
                            </div>
                            <h5 className="font-bold text-slate-900 text-xs">{res.title}</h5>
                            <p className="text-slate-600 text-[11px] leading-relaxed">{res.description}</p>
                          </div>

                          {(res.url || res.file) && (
                            <div className="pt-2">
                              <a
                                href={res.url || res.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition-colors"
                              >
                                {buttonText}
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {relatedQuestions.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">🔗 Controles relacionados no instrumento</h4>
                  <div className="bg-violet-50/40 p-3 rounded-lg border border-violet-200 space-y-2">
                    <p className="text-slate-600 leading-relaxed">
                      Estes controles complementam esta questão e ajudam a enxergar dependências entre governança, processos e controles técnicos.
                    </p>
                    {relatedQuestions.map((related) => (
                      <div key={related.id} className="text-slate-700 leading-relaxed">
                        <strong className="text-violet-800">Q{related.id}</strong> — {related.question}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Referências e Base do Controle */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">📚 Referências e base do controle</h4>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {refs?.nist?.map((ref) => (
                    <span key={ref} className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded font-medium">
                      NIST: {ref}
                    </span>
                  ))}
                  {refs?.lgpd?.map((ref) => (
                    <span key={ref} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded font-medium">
                      LGPD: {ref}
                    </span>
                  ))}
                  {refs?.anpd?.map((ref) => (
                    <span key={ref} className="bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded font-medium">
                      ANPD: {ref}
                    </span>
                  ))}
                  {refs?.dicomComplementary?.map((ref) => (
                    <span key={ref} className="bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-1 rounded font-medium">
                      DICOM (complementar): {ref}
                    </span>
                  ))}
                  {refs?.other?.map((ref) => (
                    <span key={ref} className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded font-medium">
                      Outras: {ref}
                    </span>
                  ))}
                  {(!refs || (!refs.nist?.length && !refs.lgpd?.length && !refs.anpd?.length && !refs.dicomComplementary?.length && !refs.other?.length)) && (
                    <span className="text-slate-400 italic">Nenhuma referência normativa cadastrada.</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};