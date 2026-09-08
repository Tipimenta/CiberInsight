import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  GitCompareArrows,
  CheckCircle2,
  Info,
  FileText,
  History,
  Star,
  TrendingUp,
} from 'lucide-react';
import type {
  ControlGuidanceData,
  Dimension,
  FullAssessment,
  Question,
  QuestionAnswer,
} from '../types';
import controlGuidanceData from '../data/controlGuidance.json';
import { EvolutionGuideCard } from './EvolutionGuideCard';
import { CompletionConfirmationModal } from './CompletionConfirmationModal';
import { AssessmentComparison } from './AssessmentComparison';
import { validateAssessment } from '../services/validation';
import {
  calculateDimensionMetrics,
  calculateImplementationIndex,
  calculateResponseCounts,
} from '../services/scoring';
import { isNumericScoreValue } from '../services/scoreValue';

interface ResultsDashboardProps {
  questions: Question[];
  dimensions: Dimension[];
  answers: Record<number, QuestionAnswer>;
  onOpenQuestion: (questionId: number) => void;
  onBackToAssessment: () => void;
  onFinalizeAssessment?: () => void;
  isCompleted?: boolean;
  currentAssessmentId: string;
  currentAssessmentUpdatedAt?: string;
  comparisonAssessment: FullAssessment | null;
  onOpenExportModal: () => void;
  onOpenSavedAssessments: () => void;
}

type TabType = 'general' | 'evolution_path' | 'comparison' | 'pending';

type DistributionKey = 'count0' | 'count1' | 'count2' | 'count3' | 'countNS' | 'countNA';

const distributionConfig: Array<{
  key: DistributionKey;
  label: string;
  shortLabel: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  fillClass: string;
}> = [
  {
    key: 'count0',
    label: 'Nível 0',
    shortLabel: 'N0',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    textClass: 'text-red-800',
    fillClass: 'bg-red-500',
  },
  {
    key: 'count1',
    label: 'Nível 1',
    shortLabel: 'N1',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-800',
    fillClass: 'bg-amber-500',
  },
  {
    key: 'count2',
    label: 'Nível 2',
    shortLabel: 'N2',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-800',
    fillClass: 'bg-blue-500',
  },
  {
    key: 'count3',
    label: 'Nível 3',
    shortLabel: 'N3',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-800',
    fillClass: 'bg-emerald-500',
  },
  {
    key: 'countNS',
    label: 'NS — Evidência insuficiente',
    shortLabel: 'NS',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    textClass: 'text-purple-800',
    fillClass: 'bg-purple-500',
  },
  {
    key: 'countNA',
    label: 'NA — Não aplicável',
    shortLabel: 'NA',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-700',
    fillClass: 'bg-slate-500',
  },
];

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  questions,
  dimensions,
  answers,
  onOpenQuestion,
  onFinalizeAssessment,
  isCompleted = false,
  currentAssessmentId,
  currentAssessmentUpdatedAt,
  comparisonAssessment,
  onOpenExportModal,
  onOpenSavedAssessments,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [showLevel3, setShowLevel3] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [finalizedLocally, setFinalizedLocally] = useState(false);
  const [showCompletionConfirmation, setShowCompletionConfirmation] = useState(false);

  useEffect(() => {
    if (comparisonAssessment) setActiveTab('comparison');
  }, [comparisonAssessment]);

  const guidanceMap = controlGuidanceData as unknown as ControlGuidanceData;

  const validationErrors = useMemo(
    () => validateAssessment(questions, answers),
    [questions, answers]
  );

  const responseCounts = useMemo(
    () => calculateResponseCounts(questions, answers),
    [questions, answers]
  );

  const globalScore = useMemo(
    () => calculateImplementationIndex(answers, questions.map((q) => q.id)),
    [answers, questions]
  );

  const dimensionMetrics = useMemo(
    () => calculateDimensionMetrics(dimensions, questions, answers),
    [dimensions, questions, answers]
  );

  const effectiveCompleted = isCompleted || finalizedLocally;

  const coveragePercentage =
    questions.length > 0
      ? (responseCounts.answeredCount / questions.length) * 100
      : 0;

  const numericAverage =
    globalScore.totalScoredCount > 0
      ? globalScore.attainedPoints / globalScore.totalScoredCount
      : null;

  const lowerLevelCount = responseCounts.count0 + responseCounts.count1;
  const higherLevelCount = responseCounts.count2 + responseCounts.count3;
  const lowerLevelPercentage =
    responseCounts.scoredCount > 0
      ? (lowerLevelCount / responseCounts.scoredCount) * 100
      : 0;
  const higherLevelPercentage =
    responseCounts.scoredCount > 0
      ? (higherLevelCount / responseCounts.scoredCount) * 100
      : 0;

  const validationByQuestion = useMemo(
    () => new Map(validationErrors.map((error) => [error.questionId, error])),
    [validationErrors]
  );

  const unansweredQuestions = useMemo(
    () =>
      questions.filter(
        (q) => validationByQuestion.get(q.id)?.type === 'unanswered'
      ),
    [questions, validationByQuestion]
  );

  const invalidQuestions = useMemo(
    () =>
      questions.filter(
        (q) => validationByQuestion.get(q.id)?.type === 'invalid_score'
      ),
    [questions, validationByQuestion]
  );

  const nsUnjustifiedQuestions = useMemo(
    () =>
      questions.filter(
        (q) =>
          validationByQuestion.get(q.id)?.type === 'missing_ns_justification'
      ),
    [questions, validationByQuestion]
  );

  const naUnjustifiedQuestions = useMemo(
    () =>
      questions.filter(
        (q) =>
          validationByQuestion.get(q.id)?.type === 'missing_na_justification'
      ),
    [questions, validationByQuestion]
  );

  const nsJustifiedQuestions = useMemo(
    () =>
      questions.filter((q) => {
        const answer = answers[q.id];
        return answer?.score === 'NS' && !!answer.nsNaJustification?.trim();
      }),
    [questions, answers]
  );

  const naJustifiedQuestions = useMemo(
    () =>
      questions.filter((q) => {
        const answer = answers[q.id];
        return answer?.score === 'NA' && !!answer.nsNaJustification?.trim();
      }),
    [questions, answers]
  );

  const reviewLaterQuestions = useMemo(
    () => questions.filter((q) => answers[q.id]?.reviewLater === true),
    [questions, answers]
  );

  const totalPendingCount = validationErrors.length;

  const evolutionQuestions = useMemo(
    () =>
      questions.filter((q) => {
        const score = answers[q.id]?.score;
        if (!isNumericScoreValue(score)) return false;
        if (score === 3 && !showLevel3) return false;
        if (selectedDimension !== 'all' && q.dimensionId !== selectedDimension) {
          return false;
        }

        const query = searchText.trim().toLowerCase();
        if (query) {
          const matchesId = String(q.id).includes(query);
          const matchesText = q.question.toLowerCase().includes(query);
          if (!matchesId && !matchesText) return false;
        }

        return true;
      }),
    [questions, answers, showLevel3, selectedDimension, searchText]
  );

  const dimensionQuestions = useMemo(
    () =>
      dimensions.map((dimension) => ({
        dimension,
        questions: questions.filter((q) => q.dimensionId === dimension.id),
      })),
    [dimensions, questions]
  );

  const level0Questions = useMemo(
    () => questions.filter((q) => answers[q.id]?.score === 0),
    [questions, answers]
  );

  const level1Questions = useMemo(
    () => questions.filter((q) => answers[q.id]?.score === 1),
    [questions, answers]
  );

  const automaticSummary = useMemo(() => {
    const withIndex = dimensionMetrics.filter((dimension) => dimension.index !== null);
    const lowerCount = responseCounts.count0 + responseCounts.count1;

    const parts: string[] = [];
    if (globalScore.implementationIndex !== null) {
      parts.push(`O índice de implementação foi de ${globalScore.implementationIndex.toFixed(1)}%, equivalente à média global ${numericAverage?.toFixed(2) ?? 'N/A'} na escala de 0 a 3.`);
    }
    if (withIndex.length > 0) {
      const indexes = withIndex.map((dimension) => dimension.index as number);
      const maxIndex = Math.max(...indexes);
      const minIndex = Math.min(...indexes);
      const highest = withIndex.filter((dimension) => Math.abs((dimension.index as number) - maxIndex) < 0.05);
      const lowest = withIndex.filter((dimension) => Math.abs((dimension.index as number) - minIndex) < 0.05);
      const highestNames = highest.map((dimension) => `${dimension.id} — ${dimension.name}`).join('; ');
      const lowestNames = lowest.map((dimension) => `${dimension.id} — ${dimension.name}`).join('; ');
      parts.push(`${highest.length > 1 ? 'As maiores pontuações por dimensão ocorreram' : 'A maior pontuação por dimensão ocorreu'} em ${highestNames} (${maxIndex.toFixed(1)}%), enquanto ${lowest.length > 1 ? 'as menores ocorreram' : 'a menor ocorreu'} em ${lowestNames} (${minIndex.toFixed(1)}%).`);
    }
    parts.push(`${lowerCount} controle(s) estão nos níveis 0–1 e ${responseCounts.count2 + responseCounts.count3} nos níveis 2–3, entre os itens pontuados.`);
    if (responseCounts.countNS > 0 || responseCounts.countNA > 0) {
      parts.push(`${responseCounts.countNS} resposta(s) NS e ${responseCounts.countNA} NA permanecem apresentadas separadamente e não entram no índice numérico.`);
    }
    return parts.join(' ');
  }, [dimensionMetrics, globalScore.implementationIndex, numericAverage, responseCounts]);

  const handleShowGeneralResults = () => {
    setActiveTab('general');
    requestAnimationFrame(() => {
      document.getElementById('results-general-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleFinalizeClick = () => {
    const errors = validateAssessment(questions, answers);

    if (errors.length > 0) {
      setActiveTab('pending');
      return;
    }

    setShowCompletionConfirmation(true);
  };

  const confirmFinalize = () => {
    if (onFinalizeAssessment) {
      onFinalizeAssessment();
      setFinalizedLocally(true);
    }
    setShowCompletionConfirmation(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap border-b border-slate-200 bg-white px-4 pt-2 rounded-t-xl">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Visão Geral
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evolution_path')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'evolution_path'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Caminho de Evolução
        </button>

        {comparisonAssessment && (
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'comparison'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitCompareArrows className="w-4 h-4" />
            Comparação
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Pendências e Itens não Pontuados
          {totalPendingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
              {totalPendingCount}
            </span>
          )}
        </button>
      </div>

      {effectiveCompleted && (
        <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-xl shadow-sm space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-emerald-950">Avaliação concluída</h3>
              </div>
              <p className="text-xs text-emerald-950/80 leading-relaxed">
                {automaticSummary}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShowGeneralResults}
                className="px-3 py-2 rounded-lg border border-emerald-300 bg-white text-emerald-900 text-xs font-semibold hover:bg-emerald-50"
              >
                Ver resultados
              </button>
              <button
                type="button"
                onClick={onOpenExportModal}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                <FileText className="w-4 h-4" />
                Gerar relatório
              </button>
              <button
                type="button"
                onClick={onOpenSavedAssessments}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50"
              >
                <History className="w-4 h-4" />
                Voltar às avaliações
              </button>
            </div>
          </div>
          {comparisonAssessment && (
            <p className="text-[11px] text-emerald-900/75">
              Há uma avaliação anterior carregada para comparação. Ao abrir o relatório, você poderá escolher se deseja incluir a seção comparativa no PDF.
            </p>
          )}
        </div>
      )}

      {activeTab === 'general' && (
        <div className="space-y-6">
          <div id="results-general-summary" className="scroll-mt-24">
          <SectionCard
            title="Resumo da avaliação"
            description="Indicadores sintéticos para uso no relatório e na leitura rápida da autoavaliação."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              <SummaryCard
                label="Média global dos níveis"
                value={numericAverage !== null ? numericAverage.toFixed(2) : 'N/A'}
                helper="Média dos controles pontuados na escala 0–3"
                emphasis="/ 3"
              />
              <SummaryCard
                label={effectiveCompleted ? 'Índice de implementação' : 'Índice parcial de implementação'}
                value={globalScore.implementationIndex !== null ? `${globalScore.implementationIndex.toFixed(1)}%` : 'N/A'}
                helper="Mesma medida da média global, expressa em percentual"
              />
              <SummaryCard
                label="Cobertura da avaliação"
                value={`${coveragePercentage.toFixed(1)}%`}
                helper={`${responseCounts.answeredCount} de ${questions.length} questões respondidas`}
              />
              <SummaryCard
                label="Controles em Nível 0"
                value={String(responseCounts.count0)}
                helper="Maior lacuna de implementação na escala do instrumento"
              />
              <SummaryCard
                label="Marcados para revisão"
                value={String(reviewLaterQuestions.length)}
                helper="Questões marcadas para revisar depois"
              />
            </div>
            <div className="text-xs text-slate-500 leading-relaxed space-y-1">
              <p>
                <strong>Média global dos níveis</strong> e <strong>índice de implementação</strong> representam a mesma medida agregada em escalas diferentes: 0–3 e 0–100%, respectivamente.
              </p>
              <p>
                NS, NA e questões não respondidas <strong>não entram como zero</strong> no cálculo. A cobertura é apresentada separadamente para evitar distorções de interpretação.
              </p>
            </div>
          </SectionCard>
          </div>

          <SectionCard
            title="Perfil de implementação por dimensão"
            description="Comparação do nível de implementação entre as dimensões D01–D09."
          >
            <div className="space-y-3">
              {dimensionMetrics.map((dimension) => {
                const width = dimension.index ?? 0;
                const dimensionAverage = dimension.index !== null ? (dimension.index * 3) / 100 : null;
                return (
                  <div key={dimension.id} className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{dimension.id} — {dimension.name}</div>
                        <div className="text-xs text-slate-500">
                          {dimension.scoredCount} controle(s) pontuado(s)
                          {dimension.scoredCount !== dimension.totalCount && (
                            <> · cobertura {dimension.answeredCount}/{dimension.totalCount}</>
                          )}
                        </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-sm font-bold text-indigo-700">
                          {dimension.index !== null ? `${dimension.index.toFixed(1)}%` : 'N/A'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {dimensionAverage !== null ? `${dimensionAverage.toFixed(2)} / 3` : 'Sem base numérica'}
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Distribuição 0–3 / NS / NA"
            description="Quantidade e participação percentual de cada tipo de resposta na avaliação atual."
          >
            <div className="space-y-3">
              {distributionConfig.map((item) => {
                const count = responseCounts[item.key];
                const denominator = questions.length || 1;
                const percentage = questions.length > 0 ? (count / denominator) * 100 : 0;
                return (
                  <div key={item.key} className={`rounded-xl border p-3 ${item.bgClass} ${item.borderClass}`}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className={`font-semibold ${item.textClass}`}>{item.label}</span>
                      <span className={`font-bold ${item.textClass}`}>{count} · {percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 mt-2 rounded-full bg-white/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.fillClass}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-amber-900">Níveis 0–1</span>
                  <span className="text-sm font-bold text-amber-900">
                    {lowerLevelCount} · {lowerLevelPercentage.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mt-1">
                  Participação entre os controles efetivamente pontuados nos dois níveis inferiores de implementação.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-emerald-900">Níveis 2–3</span>
                  <span className="text-sm font-bold text-emerald-900">
                    {higherLevelCount} · {higherLevelPercentage.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-1">
                  Participação entre os controles efetivamente pontuados nos dois níveis superiores de implementação.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              A distribuição individual considera todas as questões; a síntese N0–N1 versus N2–N3 usa apenas os controles pontuados de 0 a 3. NS e NA permanecem separados e não são reinterpretados como níveis de maturidade.
            </p>
          </SectionCard>

          <SectionCard
            title="Mapa de implementação (heatmap) das 93 questões"
            description="Mapa visual dos níveis de implementação por questão, agrupado por dimensão. Clique em uma célula para abrir a questão correspondente."
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-[11px]">
                <LegendBadge label="N0" className="bg-red-50 border-red-200 text-red-800" />
                <LegendBadge label="N1" className="bg-amber-50 border-amber-200 text-amber-800" />
                <LegendBadge label="N2" className="bg-blue-50 border-blue-200 text-blue-800" />
                <LegendBadge label="N3" className="bg-emerald-50 border-emerald-200 text-emerald-800" />
                <LegendBadge label="NS" className="bg-purple-50 border-purple-200 text-purple-800" />
                <LegendBadge label="NA" className="bg-slate-100 border-slate-200 text-slate-700" />
                <LegendBadge label="—" className="bg-white border-slate-200 text-slate-500" />
              </div>

              {dimensionQuestions.map(({ dimension, questions: dimensionQuestionList }) => (
                <div key={dimension.id} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="text-sm font-semibold text-slate-800">
                      {dimension.id} — {dimension.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {dimensionQuestionList.length} questão(ões)
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dimensionQuestionList.map((question) => {
                      const score = answers[question.id]?.score ?? null;
                      const visual = getHeatmapVisual(score);
                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => onOpenQuestion(question.id)}
                          title={`Q${question.id} — ${getScoreLabel(score)} — ${question.question}`}
                          className={`w-11 h-11 rounded-lg border text-[11px] font-bold transition-transform hover:scale-[1.03] ${visual.className}`}
                        >
                          Q{question.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Tabela / matriz dimensão × níveis"
            description="Distribuição interna dos níveis por dimensão, útil para análise comparativa no artigo."
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-slate-50 border border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Dimensão</th>
                    <th className="bg-slate-50 border border-slate-200 px-3 py-2 font-semibold text-slate-700">N0</th>
                    <th className="bg-slate-50 border border-slate-200 px-3 py-2 font-semibold text-slate-700">N1</th>
                    <th className="bg-slate-50 border border-slate-200 px-3 py-2 font-semibold text-slate-700">N2</th>
                    <th className="bg-slate-50 border border-slate-200 px-3 py-2 font-semibold text-slate-700">N3</th>
                    <th className="bg-slate-50 border border-slate-200 px-3 py-2 font-semibold text-slate-700">NS</th>
                    <th className="bg-slate-50 border border-slate-200 px-3 py-2 font-semibold text-slate-700">NA</th>
                    <th className="bg-slate-50 border border-slate-200 px-3 py-2 font-semibold text-slate-700">Não resp.</th>
                    <th className="bg-slate-50 border border-slate-200 px-3 py-2 font-semibold text-slate-700">Média (0–3)</th>
                    <th className="bg-slate-50 border border-slate-200 px-3 py-2 font-semibold text-slate-700">Índice (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {dimensionMetrics.map((dimension) => {
                    const dimensionAverage = dimension.index !== null ? (dimension.index * 3) / 100 : null;
                    return (
                      <tr key={dimension.id}>
                        <td className="sticky left-0 bg-white border border-slate-200 px-3 py-2 text-left text-slate-800 font-medium whitespace-nowrap">
                          {dimension.id} — {dimension.name}
                        </td>
                        <MatrixCell value={dimension.count0} className="text-red-800 bg-red-50" />
                        <MatrixCell value={dimension.count1} className="text-amber-800 bg-amber-50" />
                        <MatrixCell value={dimension.count2} className="text-blue-800 bg-blue-50" />
                        <MatrixCell value={dimension.count3} className="text-emerald-800 bg-emerald-50" />
                        <MatrixCell value={dimension.countNS} className="text-purple-800 bg-purple-50" />
                        <MatrixCell value={dimension.countNA} className="text-slate-700 bg-slate-100" />
                        <MatrixCell value={dimension.unansweredCount} className="text-slate-700 bg-slate-50" />
                        <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-800">
                          {dimensionAverage !== null ? dimensionAverage.toFixed(2) : 'N/A'}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-indigo-700">
                          {dimension.index !== null ? `${dimension.index.toFixed(1)}%` : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard
            title="Controles com maiores lacunas de implementação"
            description="Agrupa controles nos níveis 0 e 1 para facilitar a análise. Esta classificação descreve implementação e não representa, por si só, criticidade ou prioridade de risco."
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <GapGroup
                title="Controles em Nível 0 — maior lacuna de implementação"
                description="Controles sem implementação identificada segundo os critérios do instrumento. Nível 0 não equivale automaticamente a risco crítico."
                questions={level0Questions}
                onOpenQuestion={onOpenQuestion}
                badgeClass="bg-red-100 text-red-800"
              />
              <GapGroup
                title="Controles em Nível 1 — implementação inicial"
                description="Controles em estágio inicial ou informal. A ordem apresentada não constitui uma priorização de risco."
                questions={level1Questions}
                onOpenQuestion={onOpenQuestion}
                badgeClass="bg-amber-100 text-amber-900"
              />
            </div>
          </SectionCard>
        </div>
      )}

      {activeTab === 'evolution_path' && (
        <div className="space-y-5">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-indigo-900">
                  Orientações Práticas para Evolução
                </h3>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Exibe orientações para evolução do nível de implementação dos controles avaliados.
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-indigo-900 cursor-pointer bg-white px-3 py-2 rounded-lg border border-indigo-200 w-fit">
                <input
                  type="checkbox"
                  checked={showLevel3}
                  onChange={(e) => setShowLevel3(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Incluir Nível 3 (manutenção)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar por número ou texto da questão"
                className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
              />

              <select
                value={selectedDimension}
                onChange={(e) => setSelectedDimension(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="all">Todas as dimensões</option>
                {dimensions.map((dimension) => (
                  <option key={dimension.id} value={dimension.id}>
                    {dimension.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {evolutionQuestions.length === 0 ? (
            <div className="p-5 bg-white rounded-xl border border-slate-200 text-sm text-slate-500">
              Nenhum controle corresponde aos filtros atuais.
            </div>
          ) : (
            <div className="space-y-4">
              {evolutionQuestions.map((question) => (
                <EvolutionGuideCard
                  key={question.id}
                  question={question}
                  currentScore={answers[question.id]?.score ?? null}
                  guidance={guidanceMap[question.id]}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'comparison' && comparisonAssessment && (
        <AssessmentComparison
          questions={questions}
          dimensions={dimensions}
          currentAnswers={answers}
          currentAssessmentId={currentAssessmentId}
          currentUpdatedAt={currentAssessmentUpdatedAt}
          onOpenQuestion={onOpenQuestion}
          previousAssessment={comparisonAssessment}
          onChooseAnother={onOpenSavedAssessments}
        />
      )}

      {activeTab === 'pending' && (
        <div className="space-y-6">
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-800">
                Pendências a Resolver ({totalPendingCount})
              </h3>
            </div>

            {totalPendingCount === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Não existem pendências no momento.
              </div>
            ) : (
              <div className="space-y-5">
                <PendingGroup
                  title="Não respondidas"
                  questions={unansweredQuestions}
                  answers={answers}
                  onOpenQuestion={onOpenQuestion}
                  actionLabel="Responder"
                />

                <PendingGroup
                  title="Respostas inválidas"
                  questions={invalidQuestions}
                  answers={answers}
                  onOpenQuestion={onOpenQuestion}
                  actionLabel="Corrigir"
                />

                <PendingGroup
                  title="Informação/evidência insuficiente (NS) — Sem justificativa"
                  questions={nsUnjustifiedQuestions}
                  answers={answers}
                  onOpenQuestion={onOpenQuestion}
                  actionLabel="Justificar"
                />

                <PendingGroup
                  title="Não Aplicável (NA) — Sem justificativa"
                  questions={naUnjustifiedQuestions}
                  answers={answers}
                  onOpenQuestion={onOpenQuestion}
                  actionLabel="Justificar"
                />
              </div>
            )}
          </div>

          <JustifiedGroup
            title="Informação/evidência insuficiente (NS) — Justificados"
            questions={nsJustifiedQuestions}
            answers={answers}
            onOpenQuestion={onOpenQuestion}
          />

          <JustifiedGroup
            title="Não Aplicável (NA) — Justificados"
            questions={naJustifiedQuestions}
            answers={answers}
            onOpenQuestion={onOpenQuestion}
          />

          <ReviewLaterGroup
            questions={reviewLaterQuestions}
            onOpenQuestion={onOpenQuestion}
          />
        </div>
      )}

      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>O estado da avaliação é mantido e salvo automaticamente.</span>
        </div>

        {onFinalizeAssessment && (
          <button
            type="button"
            disabled={effectiveCompleted}
            onClick={handleFinalizeClick}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              effectiveCompleted
                ? 'bg-emerald-100 text-emerald-800 opacity-80 cursor-not-allowed'
                : totalPendingCount > 0
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {effectiveCompleted
              ? 'Avaliação concluída'
              : totalPendingCount > 0
                ? 'Ver pendências para concluir'
                : 'Concluir avaliação'}
          </button>
        )}
      </div>

      {showCompletionConfirmation && (
        <CompletionConfirmationModal
          totalQuestions={questions.length}
          scoredCount={responseCounts.scoredCount}
          countNS={responseCounts.countNS}
          countNA={responseCounts.countNA}
          implementationIndex={globalScore.implementationIndex}
          reviewLaterCount={reviewLaterQuestions.length}
          onConfirm={confirmFinalize}
          onClose={() => setShowCompletionConfirmation(false)}
        />
      )}
    </div>
  );
};

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, description, children }) => (
  <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
    <div className="space-y-1 border-b border-slate-100 pb-3">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
    </div>
    {children}
  </div>
);

interface SummaryCardProps {
  label: string;
  value: string;
  helper: string;
  emphasis?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, helper, emphasis }) => (
  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
    <div className="flex items-end gap-1">
      <span className="text-2xl font-bold text-slate-900 leading-none">{value}</span>
      {emphasis && <span className="text-sm font-medium text-slate-500">{emphasis}</span>}
    </div>
    <div className="text-[11px] text-slate-500 leading-snug">{helper}</div>
  </div>
);

const LegendBadge: React.FC<{ label: string; className: string }> = ({ label, className }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-lg border font-semibold ${className}`}>
    {label}
  </span>
);

const MatrixCell: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => (
  <td className={`border border-slate-200 px-3 py-2 text-center font-semibold ${className}`}>{value}</td>
);

const getScoreLabel = (score: QuestionAnswer['score'] | null | undefined): string => {
  if (score === 0 || score === 1 || score === 2 || score === 3) return `Nível ${score}`;
  if (score === 'NS') return 'NS — Informação/evidência insuficiente';
  if (score === 'NA') return 'NA — Não aplicável';
  return 'Não respondida';
};

const getHeatmapVisual = (score: QuestionAnswer['score'] | null | undefined): { className: string } => {
  if (score === 0) return { className: 'bg-red-50 border-red-200 text-red-800' };
  if (score === 1) return { className: 'bg-amber-50 border-amber-200 text-amber-800' };
  if (score === 2) return { className: 'bg-blue-50 border-blue-200 text-blue-800' };
  if (score === 3) return { className: 'bg-emerald-50 border-emerald-200 text-emerald-800' };
  if (score === 'NS') return { className: 'bg-purple-50 border-purple-200 text-purple-800' };
  if (score === 'NA') return { className: 'bg-slate-100 border-slate-200 text-slate-700' };
  return { className: 'bg-white border-slate-200 text-slate-500' };
};

interface GapGroupProps {
  title: string;
  description: string;
  questions: Question[];
  onOpenQuestion: (questionId: number) => void;
  badgeClass: string;
}

const GapGroup: React.FC<GapGroupProps> = ({
  title,
  description,
  questions,
  onOpenQuestion,
  badgeClass,
}) => (
  <div className="border border-slate-200 rounded-xl overflow-hidden">
    <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-1">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>{questions.length}</span>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>

    {questions.length === 0 ? (
      <div className="p-4 text-xs text-slate-500 italic">Nenhuma questão neste grupo.</div>
    ) : (
      <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100">
        {questions.map((question) => (
          <button
            type="button"
            key={question.id}
            onClick={() => onOpenQuestion(question.id)}
            className="w-full text-left p-3 hover:bg-slate-50 transition-colors"
          >
            <div className="text-xs text-slate-500">{question.dimension}</div>
            <div className="text-sm font-medium text-slate-800">
              Questão #{question.id} — {question.question}
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
);

interface QuestionGroupProps {
  title: string;
  questions: Question[];
  answers: Record<number, QuestionAnswer>;
  onOpenQuestion: (questionId: number) => void;
}

interface PendingGroupProps extends QuestionGroupProps {
  actionLabel: string;
}

const PendingGroup: React.FC<PendingGroupProps> = ({
  title,
  questions,
  onOpenQuestion,
  actionLabel,
}) => {
  if (questions.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2">
        {title} ({questions.length})
      </h4>
      <div className="space-y-2">
        {questions.map((question) => (
          <div
            key={question.id}
            className="p-3 bg-amber-50/40 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <span className="text-xs text-slate-500 block">{question.dimension}</span>
              <span className="text-sm font-medium text-slate-800">
                Questão #{question.id} — {question.question}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenQuestion(question.id)}
              className="px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded transition-colors shrink-0"
            >
              {actionLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const JustifiedGroup: React.FC<QuestionGroupProps> = ({
  title,
  questions,
  answers,
  onOpenQuestion,
}) => (
  <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
      {title} ({questions.length})
    </h3>

    {questions.length === 0 ? (
      <p className="text-xs text-slate-500 italic">Nenhum item neste grupo.</p>
    ) : (
      <div className="space-y-2">
        {questions.map((question) => (
          <button
            type="button"
            key={question.id}
            onClick={() => onOpenQuestion(question.id)}
            className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <span className="text-xs text-slate-500 block">{question.dimension}</span>
            <span className="text-sm font-medium text-slate-800">
              Questão #{question.id} — {question.question}
            </span>
            <p className="mt-2 text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
              <strong>Justificativa:</strong>{' '}
              {answers[question.id]?.nsNaJustification}
            </p>
          </button>
        ))}
      </div>
    )}
  </div>
);

const ReviewLaterGroup: React.FC<{
  questions: Question[];
  onOpenQuestion: (questionId: number) => void;
}> = ({ questions, onOpenQuestion }) => (
  <div className="p-5 bg-white rounded-xl border border-amber-200 shadow-sm space-y-3">
    <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
      <Star className="w-4 h-4 text-amber-600 fill-current" />
      <h3 className="text-sm font-bold text-slate-800">
        Marcadas para revisar depois ({questions.length})
      </h3>
    </div>
    <p className="text-xs text-slate-500">
      Esta é uma marcação de trabalho e não uma pendência metodológica. Ela não altera a pontuação nem impede a conclusão.
    </p>
    {questions.length === 0 ? (
      <p className="text-xs text-slate-500 italic">Nenhuma questão marcada.</p>
    ) : (
      <div className="space-y-2">
        {questions.map((question) => (
          <button
            type="button"
            key={question.id}
            onClick={() => onOpenQuestion(question.id)}
            className="w-full text-left p-3 bg-amber-50/50 hover:bg-amber-50 rounded-lg border border-amber-200 transition-colors"
          >
            <span className="text-xs text-slate-500 block">{question.dimension}</span>
            <span className="text-sm font-medium text-slate-800">
              Questão #{question.id} — {question.question}
            </span>
          </button>
        ))}
      </div>
    )}
  </div>
);
