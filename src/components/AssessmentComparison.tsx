import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, RotateCcw } from 'lucide-react';
import type { Dimension, FullAssessment, Question, QuestionAnswer } from '../types';
import { compareAssessments, type ComparisonStatus } from '../services/comparison';

interface AssessmentComparisonProps {
  questions: Question[];
  dimensions: Dimension[];
  currentAnswers: Record<number, QuestionAnswer>;
  currentAssessmentId: string;
  currentUpdatedAt?: string;
  onOpenQuestion: (questionId: number) => void;
  previousAssessment: FullAssessment | null;
  onChooseAnother: () => void;
}

type ChangeFilter = 'all' | 'improved' | 'worsened' | 'unchanged' | 'not_comparable';

export const AssessmentComparison: React.FC<AssessmentComparisonProps> = ({
  questions,
  dimensions,
  currentAnswers,
  currentAssessmentId,
  currentUpdatedAt,
  onOpenQuestion,
  previousAssessment,
  onChooseAnother,
}) => {
  const [filter, setFilter] = useState<ChangeFilter>('all');

  const comparison = useMemo(
    () =>
      previousAssessment
        ? compareAssessments(
            questions,
            dimensions,
            currentAnswers,
            previousAssessment.answers
          )
        : null,
    [questions, dimensions, currentAnswers, previousAssessment]
  );

  const filteredQuestions = useMemo(() => {
    if (!comparison) return [];
    if (filter === 'all') return comparison.questionComparisons;
    return comparison.questionComparisons.filter((item) => item.status === filter);
  }, [comparison, filter]);

  if (!previousAssessment || !comparison) return null;

  const changedCount = comparison.improvedCount + comparison.worsenedCount;

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Comparação entre avaliações</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Comparação longitudinal sem alterar a avaliação atual. Os índices comparativos usam somente o conjunto de questões numéricas comum às duas avaliações.
            </p>
          </div>
          <button
            type="button"
            onClick={onChooseAnother}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            Escolher outra avaliação
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <AssessmentIdentityCard
            label="Avaliação anterior"
            id={previousAssessment.metadata.id}
            date={previousAssessment.metadata.updatedAt || previousAssessment.metadata.completedAt}
            coverage={comparison.previousCoveragePercentage}
          />
          <AssessmentIdentityCard
            label="Avaliação atual"
            id={currentAssessmentId}
            date={currentUpdatedAt}
            coverage={comparison.currentCoveragePercentage}
          />
        </div>

        {previousAssessment.metadata.id === currentAssessmentId && (
          <p className="text-[11px] text-slate-500">
            O identificador é o mesmo nas duas cópias. Isso é válido quando o arquivo anterior representa um estado exportado anteriormente da mesma avaliação.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
        <ComparisonMetric
          label="Índice anterior"
          value={formatPercent(comparison.previousIndex)}
          helper={`${formatAverage(comparison.previousAverage)} / 3`}
        />
        <ComparisonMetric
          label="Índice atual"
          value={formatPercent(comparison.currentIndex)}
          helper={`${formatAverage(comparison.currentAverage)} / 3`}
        />
        <ComparisonMetric
          label="Variação"
          value={formatDelta(comparison.deltaPercentagePoints, ' p.p.')}
          helper={formatDelta(comparison.deltaAverage, ' na escala 0–3')}
          tone={getDeltaTone(comparison.deltaPercentagePoints)}
        />
        <ComparisonMetric
          label="Melhoraram"
          value={String(comparison.improvedCount)}
          helper="Questões com aumento de nível"
          tone="positive"
        />
        <ComparisonMetric
          label="Pioraram"
          value={String(comparison.worsenedCount)}
          helper="Questões com redução de nível"
          tone="negative"
        />
        <ComparisonMetric
          label="Comparáveis"
          value={`${comparison.comparableCount}/${questions.length}`}
          helper={`${comparison.nonComparableCount} fora da comparação numérica`}
        />
      </div>

      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Evolução por dimensão</h3>
          <p className="text-xs text-slate-500 mt-1">
            Variação em pontos percentuais calculada sobre as questões numéricas comparáveis em cada dimensão.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 bg-slate-50 border border-slate-200 px-3 py-2 text-left">Dimensão</th>
                <th className="bg-slate-50 border border-slate-200 px-3 py-2">Comparáveis</th>
                <th className="bg-slate-50 border border-slate-200 px-3 py-2">Anterior</th>
                <th className="bg-slate-50 border border-slate-200 px-3 py-2">Atual</th>
                <th className="bg-slate-50 border border-slate-200 px-3 py-2">Variação</th>
                <th className="bg-slate-50 border border-slate-200 px-3 py-2">↑</th>
                <th className="bg-slate-50 border border-slate-200 px-3 py-2">↓</th>
                <th className="bg-slate-50 border border-slate-200 px-3 py-2">=</th>
              </tr>
            </thead>
            <tbody>
              {comparison.dimensionComparisons.map((dimension) => (
                <tr key={dimension.id}>
                  <td className="sticky left-0 bg-white border border-slate-200 px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                    {dimension.id} — {dimension.name}
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">{dimension.comparableCount}</td>
                  <td className="border border-slate-200 px-3 py-2 text-center">{formatPercent(dimension.previousIndex)}</td>
                  <td className="border border-slate-200 px-3 py-2 text-center">{formatPercent(dimension.currentIndex)}</td>
                  <td className={`border border-slate-200 px-3 py-2 text-center font-semibold ${getDeltaTextClass(dimension.deltaPercentagePoints)}`}>
                    {formatDelta(dimension.deltaPercentagePoints, ' p.p.')}
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center text-emerald-700 font-semibold">{dimension.improvedCount}</td>
                  <td className="border border-slate-200 px-3 py-2 text-center text-rose-700 font-semibold">{dimension.worsenedCount}</td>
                  <td className="border border-slate-200 px-3 py-2 text-center text-slate-600 font-semibold">{dimension.unchangedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Comparação questão a questão</h3>
            <p className="text-xs text-slate-500 mt-1">
              {changedCount} questão(ões) mudaram de nível entre as avaliações numéricas comparáveis.
            </p>
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as ChangeFilter)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
          >
            <option value="all">Todas ({comparison.questionComparisons.length})</option>
            <option value="improved">Melhoraram ({comparison.improvedCount})</option>
            <option value="worsened">Pioraram ({comparison.worsenedCount})</option>
            <option value="unchanged">Sem mudança ({comparison.unchangedCount})</option>
            <option value="not_comparable">Não comparáveis ({comparison.nonComparableCount})</option>
          </select>
        </div>

        <div className="space-y-2">
          {filteredQuestions.map((item) => (
            <button
              key={item.question.id}
              type="button"
              onClick={() => onOpenQuestion(item.question.id)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500">{item.question.dimension}</div>
                  <div className="text-sm font-medium text-slate-800">
                    Q{item.question.id} — {item.question.question}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ScoreChip score={item.previousScore} />
                  <ChangeArrow status={item.status} />
                  <ScoreChip score={item.currentScore} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 leading-relaxed">
        <strong>Nota metodológica:</strong> esta tela descreve mudança no nível de implementação entre duas aplicações do mesmo instrumento. Ela não atribui causalidade às mudanças e não transforma NS/NA em valores numéricos. Para uso científico longitudinal, as duas avaliações devem corresponder a momentos distintos documentados da mesma unidade de análise.
      </div>
    </div>
  );
};

const AssessmentIdentityCard: React.FC<{ label: string; id: string; date?: string; coverage: number }> = ({ label, id, date, coverage }) => (
  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-sm font-bold text-slate-800 mt-1">{id}</div>
    <div className="text-[11px] text-slate-500 mt-1">{formatDate(date)}</div>
    <div className="text-[11px] text-slate-500 mt-1">Cobertura: {coverage.toFixed(1)}%</div>
  </div>
);

const ComparisonMetric: React.FC<{
  label: string;
  value: string;
  helper: string;
  tone?: 'positive' | 'negative' | 'neutral';
}> = ({ label, value, helper, tone = 'neutral' }) => (
  <div className="p-4 rounded-xl border border-slate-200 bg-white">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    <div className={`text-2xl font-bold mt-1 ${tone === 'positive' ? 'text-emerald-700' : tone === 'negative' ? 'text-rose-700' : 'text-slate-900'}`}>
      {value}
    </div>
    <div className="text-[11px] text-slate-500 mt-1 leading-snug">{helper}</div>
  </div>
);

const ScoreChip: React.FC<{ score: QuestionAnswer['score'] | null }> = ({ score }) => (
  <span className={`inline-flex min-w-14 justify-center px-2 py-1 rounded-lg border text-xs font-bold ${getScoreClass(score)}`}>
    {formatScore(score)}
  </span>
);

const ChangeArrow: React.FC<{ status: ComparisonStatus }> = ({ status }) => {
  if (status === 'improved') return <ArrowUpRight className="w-4 h-4 text-emerald-600" aria-label="Melhorou" />;
  if (status === 'worsened') return <ArrowDownRight className="w-4 h-4 text-rose-600" aria-label="Piorou" />;
  return <ArrowRight className="w-4 h-4 text-slate-400" aria-label={status === 'unchanged' ? 'Sem mudança' : 'Não comparável'} />;
};

function formatDate(value?: string): string {
  if (!value) return 'Data não informada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR');
}

function formatPercent(value: number | null): string {
  return value === null ? 'N/A' : `${value.toFixed(1)}%`;
}

function formatAverage(value: number | null): string {
  return value === null ? 'N/A' : value.toFixed(2);
}

function formatDelta(value: number | null, suffix: string): string {
  if (value === null) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}${suffix}`;
}

function getDeltaTone(value: number | null): 'positive' | 'negative' | 'neutral' {
  if (value === null || value === 0) return 'neutral';
  return value > 0 ? 'positive' : 'negative';
}

function getDeltaTextClass(value: number | null): string {
  if (value === null || value === 0) return 'text-slate-600';
  return value > 0 ? 'text-emerald-700' : 'text-rose-700';
}

function formatScore(score: QuestionAnswer['score'] | null): string {
  if (score === 0 || score === 1 || score === 2 || score === 3) return `N${score}`;
  if (score === 'NS' || score === 'NA') return score;
  return '—';
}

function getScoreClass(score: QuestionAnswer['score'] | null): string {
  if (score === 0) return 'bg-red-50 border-red-200 text-red-800';
  if (score === 1) return 'bg-amber-50 border-amber-200 text-amber-800';
  if (score === 2) return 'bg-blue-50 border-blue-200 text-blue-800';
  if (score === 3) return 'bg-emerald-50 border-emerald-200 text-emerald-800';
  if (score === 'NS') return 'bg-purple-50 border-purple-200 text-purple-800';
  if (score === 'NA') return 'bg-slate-100 border-slate-200 text-slate-700';
  return 'bg-white border-slate-200 text-slate-500';
}

export default AssessmentComparison;
