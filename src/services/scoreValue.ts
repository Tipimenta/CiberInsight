import type { ScoreValue } from '../types';

export const isValidScoreValue = (value: unknown): value is ScoreValue =>
  value === 0 ||
  value === 1 ||
  value === 2 ||
  value === 3 ||
  value === 'NS' ||
  value === 'NA';

export const isNumericScoreValue = (value: unknown): value is 0 | 1 | 2 | 3 =>
  value === 0 || value === 1 || value === 2 || value === 3;

export const isNsOrNaScore = (value: unknown): value is 'NS' | 'NA' =>
  value === 'NS' || value === 'NA';
