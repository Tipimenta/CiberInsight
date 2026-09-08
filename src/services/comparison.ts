import type { Dimension, Question, QuestionAnswer } from '../types';
import { calculateImplementationIndex, calculateResponseCounts } from './scoring';
import { isNumericScoreValue, isValidScoreValue } from './scoreValue';

export type ComparisonStatus = 'improved' | 'worsened' | 'unchanged' | 'not_comparable';

export interface QuestionComparison {
  question: Question;
  previousScore: QuestionAnswer['score'] | null;
  currentScore: QuestionAnswer['score'] | null;
  status: ComparisonStatus;
  delta: number | null;
}

export interface DimensionComparison {
  id: string;
  name: string;
  comparableCount: number;
  previousIndex: number | null;
  currentIndex: number | null;
  deltaPercentagePoints: number | null;
  improvedCount: number;
  worsenedCount: number;
  unchangedCount: number;
}

export interface AssessmentComparisonResult {
  comparableQuestionIds: number[];
  comparableCount: number;
  nonComparableCount: number;
  previousCoveragePercentage: number;
  currentCoveragePercentage: number;
  previousIndex: number | null;
  currentIndex: number | null;
  previousAverage: number | null;
  currentAverage: number | null;
  deltaPercentagePoints: number | null;
  deltaAverage: number | null;
  improvedCount: number;
  worsenedCount: number;
  unchangedCount: number;
  questionComparisons: QuestionComparison[];
  dimensionComparisons: DimensionComparison[];
}

function getCoveragePercentage(
  questions: Question[],
  answers: Record<number, QuestionAnswer>
): number {
  if (questions.length === 0) return 0;
  const answered = questions.filter((question) =>
    isValidScoreValue(answers[question.id]?.score)
  ).length;
  return (answered / questions.length) * 100;
}

function getIndexAndAverage(
  answers: Record<number, QuestionAnswer>,
  questionIds: number[]
): { index: number | null; average: number | null } {
  const score = calculateImplementationIndex(answers, questionIds);
  return {
    index: score.implementationIndex,
    average:
      score.totalScoredCount > 0
        ? score.attainedPoints / score.totalScoredCount
        : null,
  };
}

export function compareAssessments(
  questions: Question[],
  dimensions: Dimension[],
  currentAnswers: Record<number, QuestionAnswer>,
  previousAnswers: Record<number, QuestionAnswer>
): AssessmentComparisonResult {
  const questionComparisons: QuestionComparison[] = questions.map((question) => {
    const previousScore = previousAnswers[question.id]?.score ?? null;
    const currentScore = currentAnswers[question.id]?.score ?? null;

    if (!isNumericScoreValue(previousScore) || !isNumericScoreValue(currentScore)) {
      return {
        question,
        previousScore,
        currentScore,
        status: 'not_comparable' as const,
        delta: null,
      };
    }

    const delta = currentScore - previousScore;
    return {
      question,
      previousScore,
      currentScore,
      status:
        delta > 0
          ? ('improved' as const)
          : delta < 0
            ? ('worsened' as const)
            : ('unchanged' as const),
      delta,
    };
  });

  const comparableQuestionIds = questionComparisons
    .filter((item) => item.status !== 'not_comparable')
    .map((item) => item.question.id);

  const previousGlobal = getIndexAndAverage(previousAnswers, comparableQuestionIds);
  const currentGlobal = getIndexAndAverage(currentAnswers, comparableQuestionIds);

  const dimensionComparisons: DimensionComparison[] = dimensions.map((dimension) => {
    const items = questionComparisons.filter(
      (item) => item.question.dimensionId === dimension.id
    );
    const comparableItems = items.filter((item) => item.status !== 'not_comparable');
    const ids = comparableItems.map((item) => item.question.id);
    const previous = getIndexAndAverage(previousAnswers, ids);
    const current = getIndexAndAverage(currentAnswers, ids);

    return {
      id: dimension.id,
      name: dimension.name,
      comparableCount: ids.length,
      previousIndex: previous.index,
      currentIndex: current.index,
      deltaPercentagePoints:
        previous.index !== null && current.index !== null
          ? current.index - previous.index
          : null,
      improvedCount: comparableItems.filter((item) => item.status === 'improved').length,
      worsenedCount: comparableItems.filter((item) => item.status === 'worsened').length,
      unchangedCount: comparableItems.filter((item) => item.status === 'unchanged').length,
    };
  });

  return {
    comparableQuestionIds,
    comparableCount: comparableQuestionIds.length,
    nonComparableCount: questions.length - comparableQuestionIds.length,
    previousCoveragePercentage: getCoveragePercentage(questions, previousAnswers),
    currentCoveragePercentage: getCoveragePercentage(questions, currentAnswers),
    previousIndex: previousGlobal.index,
    currentIndex: currentGlobal.index,
    previousAverage: previousGlobal.average,
    currentAverage: currentGlobal.average,
    deltaPercentagePoints:
      previousGlobal.index !== null && currentGlobal.index !== null
        ? currentGlobal.index - previousGlobal.index
        : null,
    deltaAverage:
      previousGlobal.average !== null && currentGlobal.average !== null
        ? currentGlobal.average - previousGlobal.average
        : null,
    improvedCount: questionComparisons.filter((item) => item.status === 'improved').length,
    worsenedCount: questionComparisons.filter((item) => item.status === 'worsened').length,
    unchangedCount: questionComparisons.filter((item) => item.status === 'unchanged').length,
    questionComparisons,
    dimensionComparisons,
  };
}

export function getResponseCountsForComparison(
  questions: Question[],
  answers: Record<number, QuestionAnswer>
) {
  return calculateResponseCounts(questions, answers);
}
