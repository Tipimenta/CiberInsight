import instrumentData from '../data/instrumento.json';
import type { Question } from '../types';

const allQuestions = instrumentData.questions as Question[];
const questionById = new Map(allQuestions.map((item) => [item.id, item]));

export const getRelatedQuestions = (question: Question): Question[] =>
  (question.relatedQuestionIds || [])
    .map((id) => questionById.get(id))
    .filter((item): item is Question => Boolean(item));
