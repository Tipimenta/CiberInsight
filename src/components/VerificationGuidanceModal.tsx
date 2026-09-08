import React from 'react';
import type { Question, VerificationGuidanceItem } from '../types';
import { getRelatedQuestions } from '../services/relatedControls';

interface VerificationGuidanceModalProps {
  question: Question;
  guidance?: VerificationGuidanceItem;
  onClose: () => void;
}

const GuidanceList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="list-disc list-inside space-y-1.5 text-slate-700">
    {items.map((item, index) => (
      <li key={`${index}-${item}`}>{item}</li>
    ))}
  </ul>
);

const getCriterion = (question: Question, level: number): string =>
  question.criteria[level] || question.criteria[String(level)] || '';

const fallbackChecks = [
  'Confirme se a prática ou controle existe de fato no ambiente avaliado.',
  'Verifique se a execução é apenas informal ou se está documentada/formalizada quando isso for exigido pelo critério.',
  'Observe se o controle abrange todo o escopo pertinente ou apenas parte dele.',
  'Procure alguma evidência verificável de aplicação, e não apenas uma declaração verbal.',
  'Quando o critério mencionar revisão, teste, acompanhamento ou atualização, confirme se isso realmente ocorre.',
];

const fallbackPitfalls = [
  'Não marcar um nível apenas porque existe uma ferramenta ou documento; compare a situação real com todo o texto do critério.',
  'Não tratar uma prática informal como formalizada.',
  'Não marcar nível 3 sem evidência compatível com o que o próprio critério exige.',
  'Use NS quando, após a verificação possível, ainda faltar informação ou evidência para escolher um nível com segurança.',
];

export const VerificationGuidanceModal: React.FC<VerificationGuidanceModalProps> = ({
  question,
  guidance,
  onClose,
}) => {
  const hasDetailedGuidance = Boolean(guidance);
  const relatedQuestions = getRelatedQuestions(question);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
        <div className="p-5 bg-slate-900 text-white flex justify-between items-start gap-4 shrink-0">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-400/30">
              Guia de Verificação — Questão #{question.id} ({question.dimensionId})
            </span>
            <h3 className="text-lg font-bold mt-2 text-slate-100">Como verificar este controle?</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{question.question}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-xl leading-none p-1 cursor-pointer"
            aria-label="Fechar guia de verificação"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-950 leading-relaxed">
            <strong>Importante:</strong> este guia ajuda a verificar a situação real, mas não escolhe a resposta por você. Compare o que encontrou com os critérios 0 a 3. Se a informação continuar insuficiente, use NS e justifique.
          </div>

          {!hasDetailedGuidance && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-relaxed">
              <strong>Guia básico:</strong> esta questão ainda não possui um roteiro detalhado específico. As orientações abaixo usam os critérios da própria questão e a evidência esperada registrada na matriz do instrumento, sem gerar conteúdo automaticamente.
            </div>
          )}

          {guidance ? (
            <>
              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">🔎 O que verificar</h4>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed text-slate-700">
                  {guidance.whatToVerify}
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">📍 Onde procurar</h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <GuidanceList items={guidance.whereToVerify} />
                </div>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">💬 Perguntas que ajudam na verificação</h4>
                <div className="bg-indigo-50/40 p-3 rounded-lg border border-indigo-200">
                  <GuidanceList items={guidance.helpfulQuestions} />
                </div>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">📂 Exemplos de evidências</h4>
                <div className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-200">
                  <GuidanceList items={guidance.evidenceExamples} />
                </div>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">⚠️ Cuidados na interpretação</h4>
                <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                  <GuidanceList items={guidance.commonPitfalls} />
                </div>
              </section>

              {relatedQuestions.length > 0 && (
                <section className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">🔗 Controles relacionados no instrumento</h4>
                  <div className="bg-violet-50/40 p-3 rounded-lg border border-violet-200 space-y-2">
                    <p className="text-slate-600 leading-relaxed">
                      Estes controles tratam de aspectos diretamente complementares. Eles não substituem a avaliação desta questão.
                    </p>
                    {relatedQuestions.map((related) => (
                      <div key={related.id} className="text-slate-700 leading-relaxed">
                        <strong className="text-violet-800">Q{related.id}</strong> — {related.question}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {guidance.finalTip && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed">
                  <strong>Próximo passo:</strong> {guidance.finalTip}
                </div>
              )}
            </>
          ) : (
            <>
              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">🔎 Roteiro básico de verificação</h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <GuidanceList items={fallbackChecks} />
                </div>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">📂 Evidência esperada para esta questão</h4>
                <p className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-200 text-emerald-950 leading-relaxed">
                  {question.expectedEvidence || 'A evidência esperada ainda não está cadastrada para esta questão.'}
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">🧭 Compare com os critérios</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map((level) => (
                    <div key={level} className="p-3 rounded-lg border border-slate-200 bg-white">
                      <span className="font-bold text-indigo-700">Nível {level}</span>
                      <p className="text-slate-700 mt-1 leading-relaxed">{getCriterion(question, level)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">⚠️ Cuidados na interpretação</h4>
                <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                  <GuidanceList items={fallbackPitfalls} />
                </div>
              </section>
            </>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
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

export default VerificationGuidanceModal;
