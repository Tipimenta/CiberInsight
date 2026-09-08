export type ScoreValue = 0 | 1 | 2 | 3 | 'NS' | 'NA';

export interface QuestionAnswer {
  questionId: number;
  score: ScoreValue | null;
  evidence?: string;
  observation?: string;
  nsNaJustification?: string;
  reviewLater?: boolean;
  updatedAt?: string;
}

export interface DimensionMetric {
  id: string;
  name: string;
  questionCount: number;
  index: number | null;
  isPartial: boolean;
  count0: number;
  count1: number;
  count2: number;
  count3: number;
  countNS: number;
  countNA: number;
  unansweredCount: number;
  answeredCount: number;
  scoredCount: number;
  totalCount: number;
  applicableCount: number | null;
}
