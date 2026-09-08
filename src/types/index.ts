export * from './assessment';
export * from './guidance';
export * from './verification';

export interface QuestionReferences {
  nist?: string[];
  lgpd?: string[];
  anpd?: string[];
  dicomComplementary?: string[];
  bibliography?: string[];
  stateOfArt?: string[];
  other?: string[];
}

export type QuestionCriteria = Record<string | number, string>;

export interface Question {
  id: number;
  dimensionId: string;
  dimension: string;
  question: string;
  criteria: QuestionCriteria;
  references?: QuestionReferences;
  expectedEvidence?: string;
  relatedQuestionIds?: number[];
}

export interface Dimension {
  id: string;
  name: string;
  questionCount: number;
  order?: number;
  questionIds?: number[];
}

export interface InstrumentData {
  version: string;
  totalQuestions: number;
  totalDimensions?: number;
  status?: string;
  language?: string;
  primaryFramework?: string;
  legalPrivacyContext?: string[];
  dimensions: Dimension[];
  questions: Question[];
}

export interface AssessmentMetadata {
  id: string;
  label: string;
  instrumentVersion: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}

import type { QuestionAnswer } from './assessment';

export type AnswerState = QuestionAnswer;

export interface FullAssessment {
  metadata: AssessmentMetadata;
  answers: Record<number, QuestionAnswer>;
}