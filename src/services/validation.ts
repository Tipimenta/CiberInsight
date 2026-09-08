import type { Question, QuestionAnswer } from '../types';
import { isValidScoreValue } from './scoreValue';

export interface ValidationError {
  questionId: number;
  dimensionId: string;
  type:
    | 'unanswered'
    | 'invalid_score'
    | 'missing_ns_justification'
    | 'missing_na_justification';
  message: string;
}

export const validateAssessment = (
  questions: Question[],
  answers: Record<number, QuestionAnswer>
): ValidationError[] => {
  const errors: ValidationError[] = [];

  questions.forEach((question) => {
    const answer = answers[question.id];
    const score = answer?.score;
    const justification = answer?.nsNaJustification?.trim() || '';

    if (score === null || score === undefined) {
      errors.push({
        questionId: question.id,
        dimensionId: question.dimensionId,
        type: 'unanswered',
        message: `Questão #${question.id} não foi respondida.`,
      });
      return;
    }

    if (!isValidScoreValue(score)) {
      errors.push({
        questionId: question.id,
        dimensionId: question.dimensionId,
        type: 'invalid_score',
        message: `Questão #${question.id} contém uma resposta inválida e precisa ser respondida novamente.`,
      });
      return;
    }

    if (score === 'NS' && justification.length === 0) {
      errors.push({
        questionId: question.id,
        dimensionId: question.dimensionId,
        type: 'missing_ns_justification',
        message: `Questão #${question.id} (NS) exige justificativa de informação/evidência insuficiente.`,
      });
    } else if (score === 'NA' && justification.length === 0) {
      errors.push({
        questionId: question.id,
        dimensionId: question.dimensionId,
        type: 'missing_na_justification',
        message: `Questão #${question.id} (NA) exige justificativa de não aplicabilidade.`,
      });
    }
  });

  return errors;
};
