import {
  calculateDimensionMetrics,
  calculateImplementationIndex,
  calculateProgress,
} from '../services/scoring';
import { isValidScoreValue } from '../services/scoreValue';
import { validateAssessment } from '../services/validation';
import type { Dimension, InstrumentData, Question, QuestionAnswer } from '../types';

export function runScoringTests() {
  const dummyQuestions: Question[] = [
    { id: 1, dimensionId: 'D01', dimension: 'Gov', question: 'Q1', criteria: { 0: '', 1: '', 2: '', 3: '' } },
    { id: 2, dimensionId: 'D01', dimension: 'Gov', question: 'Q2', criteria: { 0: '', 1: '', 2: '', 3: '' } },
    { id: 3, dimensionId: 'D01', dimension: 'Gov', question: 'Q3', criteria: { 0: '', 1: '', 2: '', 3: '' } },
    { id: 4, dimensionId: 'D01', dimension: 'Gov', question: 'Q4', criteria: { 0: '', 1: '', 2: '', 3: '' } },
    { id: 5, dimensionId: 'D01', dimension: 'Gov', question: 'Q5', criteria: { 0: '', 1: '', 2: '', 3: '' } },
    { id: 6, dimensionId: 'D01', dimension: 'Gov', question: 'Q6', criteria: { 0: '', 1: '', 2: '', 3: '' } },
  ];

  const dummyAnswers: Record<number, QuestionAnswer> = {
    1: { questionId: 1, score: 3 },
    2: { questionId: 2, score: 2 },
    3: { questionId: 3, score: 1 },
    4: { questionId: 4, score: 0 },
    5: { questionId: 5, score: 'NS', nsNaJustification: 'Sem evidência' },
    6: { questionId: 6, score: 'NA', nsNaJustification: 'Não se aplica' },
  };

  const scoreResult = calculateImplementationIndex(dummyAnswers);
  console.assert(scoreResult.totalScoredCount === 4, 'Deveria contar 4 itens pontuados');
  console.assert(scoreResult.attainedPoints === 6, 'Deveria somar 3+2+1+0 = 6 pontos');
  console.assert(scoreResult.maxPoints === 12, 'Deveria ter máximo de 4 * 3 = 12 pontos');
  console.assert(scoreResult.implementationIndex === 50, 'Índice de implementação deveria ser 50%');

  const dummyInstrument: InstrumentData = {
    version: 'v0.5',
    totalQuestions: 6,
    dimensions: [],
    questions: dummyQuestions,
  };

  const progressResult = calculateProgress(dummyInstrument, dummyAnswers);
  console.assert(progressResult.answered === 6, 'Deveria registrar 6 respondidas');
  console.assert(progressResult.percentage === 100, 'Progresso deveria ser 100%');

  const errors = validateAssessment(dummyQuestions.slice(0, 2), {
    1: { questionId: 1, score: 'NS', nsNaJustification: '' },
    2: { questionId: 2, score: null },
  });
  console.assert(errors.length === 2, 'Deveria identificar 2 pendências');

  console.assert(isValidScoreValue(3), '3 deve ser válido');
  console.assert(!isValidScoreValue(999), '999 não pode ser válido');
  console.assert(!isValidScoreValue('2'), 'string numérica não pode ser válida');

  const corrupted = {
    ...dummyAnswers,
    7: { questionId: 7, score: 999 as never },
  };
  const corruptedScore = calculateImplementationIndex(corrupted);
  console.assert(corruptedScore.totalScoredCount === 4, 'Valor inválido não deve entrar no índice');

  const dimensions: Dimension[] = [{ id: 'D01', name: 'Gov', questionCount: 6 }];
  const partialMetrics = calculateDimensionMetrics(
    dimensions,
    dummyQuestions,
    { ...dummyAnswers, 6: { questionId: 6, score: null } }
  );
  console.assert(partialMetrics[0].applicableCount === null, 'Aplicáveis não deve ser definitivo em dimensão parcial');
}
