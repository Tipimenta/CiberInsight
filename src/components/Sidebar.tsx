import React, { useState, useMemo } from 'react';
import type { Question, QuestionAnswer, Dimension } from '../types';
import { isValidScoreValue } from '../services/scoreValue';
import { Star } from 'lucide-react';

export type DimensionGroup = Dimension;

interface SidebarProps {
  questions?: Question[];
  dimensions?: Dimension[];
  answers?: Record<number, QuestionAnswer>;
  currentQuestionId: number;
  onSelectQuestion: (questionId: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  questions = [],
  dimensions = [],
  answers = {},
  currentQuestionId,
  onSelectQuestion,
}) => {
  const [search, setSearch] = useState('');
  const [filterPending, setFilterPending] = useState(false);
  const [filterReview, setFilterReview] = useState(false);

  // Agrupa as dimensões automaticamente caso a prop 'dimensions' venha vazia ou desalinhada
  const activeDimensions = useMemo(() => {
    if (dimensions && dimensions.length > 0) return dimensions;

    const grouped: Record<string, Dimension> = {};
    questions.forEach((q) => {
      const dimName = q.dimension || 'Geral';
      const dimId = q.dimensionId || dimName;
      if (!grouped[dimId]) {
        grouped[dimId] = { id: dimId, name: dimName, questionCount: 0 };
      }
      grouped[dimId].questionCount += 1;
    });
    return Object.values(grouped);
  }, [dimensions, questions]);

  const isQuestionVisible = (q: Question) => {
    const ans = answers[q.id];
    const isAnswered = isValidScoreValue(ans?.score);
    const questionText = q.question || '';

    if (search && !questionText.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterPending && isAnswered) return false;
    if (filterReview && !ans?.reviewLater) return false;

    return true;
  };

  return (
    <aside className="w-80 bg-slate-50/50 border-r border-slate-200 p-4 flex flex-col h-[calc(100vh-53px)] sticky top-[53px] overflow-y-auto shrink-0 select-none">
      {/* Campo de Busca com Lupa */}
      <div className="relative mb-3">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Buscar pergunta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
        />
      </div>

      {/* Filtros rápidos */}
      <div className="mb-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setFilterPending(!filterPending)}
          className={`flex items-center justify-center gap-1.5 text-[11px] py-1.5 px-2 rounded-lg border font-medium transition-all cursor-pointer ${
            filterPending
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/80'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Pendentes
        </button>
        <button
          type="button"
          onClick={() => setFilterReview(!filterReview)}
          className={`flex items-center justify-center gap-1.5 text-[11px] py-1.5 px-2 rounded-lg border font-medium transition-all cursor-pointer ${
            filterReview
              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/80'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${filterReview ? 'fill-current' : ''}`} />
          Revisar
        </button>
      </div>

      {/* Lista de Dimensões e Grids de Botões */}
      <div className="space-y-5">
        {activeDimensions.map((dim) => {
          const dimQuestions = questions.filter(
            (q) => q.dimensionId === dim.id || q.dimension === dim.name
          );
          const answeredInDim = dimQuestions.filter(
            (q) => isValidScoreValue(answers[q.id]?.score)
          ).length;

          return (
            <div key={dim.id} className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 tracking-tight truncate pr-2" title={dim.name}>
                  {dim.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {answeredInDim} / {dimQuestions.length}
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {dimQuestions.map((q) => {
                  if (!isQuestionVisible(q)) return null;

                  const ans = answers[q.id];
                  const isAnswered = isValidScoreValue(ans?.score);
                  const isCurrent = q.id === currentQuestionId;

                  let btnStyle = 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100';

                  if (isCurrent) {
                    btnStyle = 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs';
                  } else if (isAnswered) {
                    btnStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => onSelectQuestion(q.id)}
                      className={`h-8 rounded-md border text-xs flex items-center justify-center gap-0.5 transition-all cursor-pointer relative ${btnStyle}`}
                      title={ans?.reviewLater ? `Q${q.id} — marcada para revisar depois` : `Q${q.id}`}
                    >
                      {q.id}
                      {ans?.reviewLater && (
                        <Star className={`w-2.5 h-2.5 fill-current ${isCurrent ? 'text-amber-200' : 'text-amber-500'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;