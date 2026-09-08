export interface VerificationGuidanceItem {
  questionId: number;
  whatToVerify: string;
  whereToVerify: string[];
  helpfulQuestions: string[];
  evidenceExamples: string[];
  commonPitfalls: string[];
  finalTip?: string;
}

export type VerificationGuidanceData = Record<number, VerificationGuidanceItem>;
