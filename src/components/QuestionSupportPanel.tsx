import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  FileText,
  FolderOpen,
  Link2,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import type {
  ControlGuidanceItem,
  PracticalResource,
  Question,
  VerificationGuidanceItem,
} from '../types';
import { getRelatedQuestions } from '../services/relatedControls';
import { findGlossaryEntries } from '../data/glossary';
import { TraceabilityBox } from './TraceabilityBox';

interface QuestionSupportPanelProps {
  question: Question;
  verificationGuidance?: VerificationGuidanceItem;
  controlGuidance?: ControlGuidanceItem;
  onSelectQuestion: (questionId: number) => void;
  embedded?: boolean;
}

const splitExpectedEvidence = (value?: string): string[] =>
  (value || '')
    .split(/[,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const uniqueItems = (items: string[], limit: number): string[] =>
  Array.from(new Set(items.map((item) => item.trim()).filter(Boolean))).slice(0, limit);

const getResourceLabel = (resource: PracticalResource): string => {
  switch (resource.type) {
    case 'template':
      return 'Modelo';
    case 'checklist':
      return 'Checklist';
    case 'example':
      return 'Exemplo';
    case 'implementation_guide':
      return 'Guia';
    case 'official_reference':
      return 'Referência';
    default:
      return 'Material';
  }
};

export const QuestionSupportPanel: React.FC<QuestionSupportPanelProps> = ({
  question,
  verificationGuidance,
  controlGuidance,
  onSelectQuestion,
  embedded = false,
}) => {
  const [showAllMaterials, setShowAllMaterials] = useState(false);

  const relatedQuestions = useMemo(
    () => getRelatedQuestions(question).slice(0, 4),
    [question]
  );

  const evidenceItems = useMemo(() => {
    // A evidência esperada da própria questão vem primeiro; o guia apenas complementa.
    const fromQuestion = splitExpectedEvidence(question.expectedEvidence);
    const fromGuide = verificationGuidance?.evidenceExamples ?? [];
    return uniqueItems([...fromQuestion, ...fromGuide], 5);
  }, [question.expectedEvidence, verificationGuidance]);

  const whereItems = useMemo(
    () => uniqueItems(verificationGuidance?.whereToVerify ?? [], 5),
    [verificationGuidance]
  );

  const glossaryContext = useMemo(
    () =>
      [
        question.question,
        question.expectedEvidence || '',
        verificationGuidance?.whatToVerify || '',
        ...(verificationGuidance?.whereToVerify ?? []),
      ].join(' | '),
    [question, verificationGuidance]
  );

  const glossaryItems = useMemo(
    () => findGlossaryEntries(glossaryContext, 4),
    [glossaryContext]
  );

  const materials = useMemo(
    () =>
      (controlGuidance?.practicalResources ?? []).filter(
        (resource) => resource.sourceType === 'instrument' && Boolean(resource.file)
      ),
    [controlGuidance]
  );

  const visibleMaterials = showAllMaterials ? materials : materials.slice(0, 2);

  return (
    <div
      className={`bg-white border border-slate-200 shadow-xs overflow-hidden ${
        embedded ? 'rounded-xl' : 'rounded-2xl'
      }`}
    >
      {!embedded && (
        <div className="px-4 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-300 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold">Apoio desta questão</h3>
                <span className="px-2 py-0.5 rounded-md bg-indigo-400/15 border border-indigo-300/20 text-[9px] font-bold text-indigo-200 shrink-0">
                  Q{question.id} · {question.dimensionId}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5">Consulta rápida durante a avaliação.</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4 text-xs">
        {evidenceItems.length > 0 && (
          <section className="space-y-1.5">
            <h4 className="flex items-center gap-1.5 font-bold text-slate-900">
              <FileText className="w-4 h-4 text-emerald-600" />
              Evidências úteis
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-600">
              {evidenceItems.map((item) => (
                <li key={item} className="flex gap-2 leading-relaxed">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Exemplos de evidência; não é necessário possuir todos os itens listados.
            </p>
          </section>
        )}

        {whereItems.length > 0 && (
          <section className="space-y-1.5 pt-3 border-t border-slate-100">
            <h4 className="flex items-center gap-1.5 font-bold text-slate-900">
              <MapPin className="w-4 h-4 text-sky-600" />
              Onde verificar
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {whereItems.map((item) => (
                <span
                  key={item}
                  className="px-2 py-1 rounded-md bg-sky-50 border border-sky-100 text-[10px] text-sky-900 leading-tight"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        )}

        {relatedQuestions.length > 0 && (
          <section className="space-y-2 pt-3 border-t border-slate-100">
            <h4 className="flex items-center gap-1.5 font-bold text-slate-900">
              <Link2 className="w-4 h-4 text-violet-600" />
              Controles relacionados
            </h4>
            <div className="space-y-1">
              {relatedQuestions.map((related) => (
                <button
                  key={related.id}
                  type="button"
                  onClick={() => onSelectQuestion(related.id)}
                  className="w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-lg border border-violet-100 bg-violet-50/40 hover:bg-violet-100 transition-colors cursor-pointer group"
                  title={related.question}
                >
                  <span className="font-bold text-violet-700 shrink-0">Q{related.id}</span>
                  <span className="text-[10px] leading-snug text-slate-700 truncate group-hover:text-slate-900">
                    {related.question}
                  </span>
                  <span className="ml-auto text-violet-400 group-hover:text-violet-700">→</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {materials.length > 0 && (
          <section className="space-y-2 pt-3 border-t border-slate-100">
            <h4 className="flex items-center gap-1.5 font-bold text-slate-900">
              <FolderOpen className="w-4 h-4 text-amber-600" />
              Materiais de apoio
            </h4>
            <div className="space-y-1.5">
              {visibleMaterials.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-amber-700 mr-1.5">
                      {getResourceLabel(resource)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-700 leading-relaxed">
                      {resource.title}
                    </span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </a>
              ))}
            </div>
            {materials.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAllMaterials((value) => !value)}
                className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
              >
                {showAllMaterials ? 'Mostrar menos' : `Ver todos os ${materials.length} materiais →`}
              </button>
            )}
          </section>
        )}

        {glossaryItems.length > 0 && (
          <details className="pt-3 border-t border-slate-100 group">
            <summary className="cursor-pointer select-none flex items-center gap-1.5 font-bold text-slate-800 hover:text-violet-800">
              <BookOpen className="w-4 h-4 text-violet-600" />
              Termos desta questão
              <span className="ml-auto text-[10px] font-medium text-slate-400">{glossaryItems.length}</span>
            </summary>
            <div className="space-y-2 mt-2 pl-0.5">
              {glossaryItems.map((entry) => (
                <div key={entry.id} className="text-[10px] leading-relaxed">
                  <div className="font-bold text-violet-900">{entry.term}</div>
                  <div className="text-slate-600 mt-0.5">{entry.definition}</div>
                </div>
              ))}
            </div>
          </details>
        )}

        <section className="pt-3 border-t border-slate-100">
          <TraceabilityBox references={question.references} />
        </section>
      </div>
    </div>
  );
};

export default QuestionSupportPanel;
