import type {
  Dimension,
  DimensionMetric,
  InstrumentData,
  Question,
  QuestionAnswer,
} from '../types';
import { isNumericScoreValue, isValidScoreValue } from './scoreValue';

export interface ResponseCounts {
  count0: number;
  count1: number;
  count2: number;
  count3: number;
  countNS: number;
  countNA: number;
  unansweredCount: number;
  answeredCount: number;
  scoredCount: number;
}

export function calculateImplementationIndex(
  answers: Record<number, QuestionAnswer>,
  questionIds?: number[]
): {
  implementationIndex: number | null;
  totalScoredCount: number;
  attainedPoints: number;
  maxPoints: number;
} {
  const allowedIds = questionIds ? new Set(questionIds) : null;
  let totalScoredCount = 0;
  let attainedPoints = 0;

  Object.values(answers).forEach((answer) => {
    if (allowedIds && !allowedIds.has(answer.questionId)) return;
    if (!isNumericScoreValue(answer.score)) return;

    attainedPoints += answer.score;
    totalScoredCount += 1;
  });

  if (totalScoredCount === 0) {
    return {
      implementationIndex: null,
      totalScoredCount: 0,
      attainedPoints: 0,
      maxPoints: 0,
    };
  }

  const maxPoints = totalScoredCount * 3;
  const implementationIndex = (attainedPoints / maxPoints) * 100;

  return {
    implementationIndex,
    totalScoredCount,
    attainedPoints,
    maxPoints,
  };
}

export function calculateProgress(
  instrument: InstrumentData,
  answers: Record<number, QuestionAnswer>
): {
  total: number;
  answered: number;
  unanswered: number;
  percentage: number;
} {
  const total = instrument.questions?.length || instrument.totalQuestions || 0;
  const validQuestionIds = new Set((instrument.questions || []).map((q) => q.id));

  const answered = Object.values(answers).filter((answer) => {
    if (validQuestionIds.size > 0 && !validQuestionIds.has(answer.questionId)) return false;
    return isValidScoreValue(answer.score);
  }).length;

  const safeAnswered = Math.min(answered, total);
  const unanswered = Math.max(total - safeAnswered, 0);
  const percentage = total > 0 ? (safeAnswered / total) * 100 : 0;

  return { total, answered: safeAnswered, unanswered, percentage };
}

export function calculateResponseCounts(
  questions: Question[],
  answers: Record<number, QuestionAnswer>
): ResponseCounts {
  let count0 = 0;
  let count1 = 0;
  let count2 = 0;
  let count3 = 0;
  let countNS = 0;
  let countNA = 0;
  let unansweredCount = 0;

  questions.forEach((question) => {
    const score = answers[question.id]?.score;

    if (score === 0) count0 += 1;
    else if (score === 1) count1 += 1;
    else if (score === 2) count2 += 1;
    else if (score === 3) count3 += 1;
    else if (score === 'NS') countNS += 1;
    else if (score === 'NA') countNA += 1;
    else unansweredCount += 1;
  });

  const scoredCount = count0 + count1 + count2 + count3;
  const answeredCount = scoredCount + countNS + countNA;

  return {
    count0,
    count1,
    count2,
    count3,
    countNS,
    countNA,
    unansweredCount,
    answeredCount,
    scoredCount,
  };
}

export function isQuestionResolved(answer?: QuestionAnswer): boolean {
  if (!answer || !isValidScoreValue(answer.score)) return false;
  if ((answer.score === 'NS' || answer.score === 'NA') && !answer.nsNaJustification?.trim()) {
    return false;
  }
  return true;
}

export function calculateDimensionMetrics(
  dimensions: Dimension[],
  questions: Question[],
  answers: Record<number, QuestionAnswer>
): DimensionMetric[] {
  return dimensions.map((dimension) => {
    const dimensionQuestions = questions.filter(
      (question) => question.dimensionId === dimension.id || question.dimension === dimension.name
    );
    const questionIds = dimensionQuestions.map((question) => question.id);
    const score = calculateImplementationIndex(answers, questionIds);
    const counts = calculateResponseCounts(dimensionQuestions, answers);
    const isPartial = dimensionQuestions.some((question) => !isQuestionResolved(answers[question.id]));

    return {
      id: dimension.id,
      name: dimension.name,
      questionCount: dimension.questionCount,
      totalCount: dimensionQuestions.length,
      answeredCount: counts.answeredCount,
      applicableCount: isPartial ? null : dimensionQuestions.length - counts.countNA,
      scoredCount: score.totalScoredCount,
      index: score.implementationIndex,
      isPartial,
      count0: counts.count0,
      count1: counts.count1,
      count2: counts.count2,
      count3: counts.count3,
      countNS: counts.countNS,
      countNA: counts.countNA,
      unansweredCount: counts.unansweredCount,
    };
  });
}
