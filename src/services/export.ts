import type { FullAssessment, InstrumentData, QuestionAnswer } from '../types';
import {
  calculateDimensionMetrics,
  calculateImplementationIndex,
  calculateProgress,
  calculateResponseCounts,
} from './scoring';
import { validateAssessment } from './validation';
import { compareAssessments } from './comparison';

function getDirectControlReferences(references: import('../types').QuestionReferences | undefined) {
  if (!references) return {};

  return {
    ...(references.nist?.length ? { nist: references.nist } : {}),
    ...(references.lgpd?.length ? { lgpd: references.lgpd } : {}),
    ...(references.anpd?.length ? { anpd: references.anpd } : {}),
    ...(references.dicomComplementary?.length ? { dicomComplementary: references.dicomComplementary } : {}),
    ...(references.other?.length ? { other: references.other } : {}),
  };
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR');
}

export function exportAssessmentJSON(assessment: FullAssessment, instrument: InstrumentData): string {
  const answersList = instrument.questions.map((question) => {
    const answer: QuestionAnswer = assessment.answers[question.id] || {
      questionId: question.id,
      score: null,
      evidence: '',
      observation: '',
      nsNaJustification: '',
      reviewLater: false,
    };

    return {
      questionId: question.id,
      dimensionId: question.dimensionId,
      dimension: question.dimension,
      question: question.question,
      criteria: question.criteria,
      score: answer.score,
      evidence: answer.evidence || '',
      observation: answer.observation || '',
      nsNaJustification: answer.nsNaJustification || '',
      reviewLater: answer.reviewLater === true,
      expectedEvidence: question.expectedEvidence || '',
      references: getDirectControlReferences(question.references),
      updatedAt: answer.updatedAt || null,
    };
  });

  const responseCounts = calculateResponseCounts(instrument.questions, assessment.answers);
  const progress = calculateProgress(instrument, assessment.answers);
  const score = calculateImplementationIndex(
    assessment.answers,
    instrument.questions.map((question) => question.id)
  );
  const validationErrors = validateAssessment(instrument.questions, assessment.answers);
  const dimensionMetrics = calculateDimensionMetrics(
    instrument.dimensions,
    instrument.questions,
    assessment.answers
  );
  const reviewLaterCount = instrument.questions.filter((q) => assessment.answers[q.id]?.reviewLater).length;

  const exportPayload = {
    schemaVersion: '1.3',
    instrument: {
      name: 'CiberInsight — Instrumento de Autoavaliação de Controles de Segurança Cibernética',
      version: instrument.version,
      status: instrument.status || null,
      traceabilityNote: 'A exportação inclui as referências diretas cadastradas no instrumento. Referências bibliográficas metodológicas permanecem na matriz de desenvolvimento quando não são base direta do controle.',
      totalQuestions: instrument.totalQuestions,
      totalDimensions: instrument.totalDimensions ?? instrument.dimensions.length,
    },
    assessment: {
      id: assessment.metadata.id,
      label: assessment.metadata.label,
      instrumentVersion: assessment.metadata.instrumentVersion,
      startedAt: assessment.metadata.startedAt,
      updatedAt: assessment.metadata.updatedAt,
      completedAt: assessment.metadata.completedAt || null,
    },
    summary: {
      totalQuestions: instrument.questions.length,
      answeredCount: responseCounts.answeredCount,
      unansweredCount: responseCounts.unansweredCount,
      progressPercentage: progress.percentage,
      scoredCount: responseCounts.scoredCount,
      count0: responseCounts.count0,
      count1: responseCounts.count1,
      count2: responseCounts.count2,
      count3: responseCounts.count3,
      countNS: responseCounts.countNS,
      countNA: responseCounts.countNA,
      reviewLaterCount,
      implementationIndex: score.implementationIndex,
      attainedPoints: score.attainedPoints,
      maxPointsForScoredItems: score.maxPoints,
      isPartial: validationErrors.length > 0,
      pendingValidationCount: validationErrors.length,
      indexNote:
        'O índice considera somente respostas numéricas 0–3. NS, NA e questões não respondidas não recebem nota zero e não entram no denominador.',
    },
    dimensionSummaries: dimensionMetrics.map((dimension) => ({
      dimensionId: dimension.id,
      dimensionName: dimension.name,
      totalCount: dimension.totalCount,
      answeredCount: dimension.answeredCount,
      applicableCount: dimension.applicableCount,
      scoredCount: dimension.scoredCount,
      count0: dimension.count0,
      count1: dimension.count1,
      count2: dimension.count2,
      count3: dimension.count3,
      countNS: dimension.countNS,
      countNA: dimension.countNA,
      unansweredCount: dimension.unansweredCount,
      implementationIndex: dimension.index,
      isPartial: dimension.isPartial,
    })),
    validation: {
      canConclude: validationErrors.length === 0,
      errors: validationErrors,
    },
    answers: answersList,
  };

  return JSON.stringify(exportPayload, null, 2);
}

export function exportToMarkdown(assessment: FullAssessment, instrument: InstrumentData): string {
  const responseCounts = calculateResponseCounts(instrument.questions, assessment.answers);
  const progress = calculateProgress(instrument, assessment.answers);
  const score = calculateImplementationIndex(
    assessment.answers,
    instrument.questions.map((question) => question.id)
  );
  const validationErrors = validateAssessment(instrument.questions, assessment.answers);
  const reviewLaterCount = instrument.questions.filter((q) => assessment.answers[q.id]?.reviewLater).length;

  let md = `# CiberInsight — Relatório da Avaliação (${instrument.version})\n\n`;
  md += `**Identificador anônimo:** ${assessment.metadata.id}\n`;
  md += `**Versão do instrumento usada na avaliação:** ${assessment.metadata.instrumentVersion}\n`;
  md += `**Início:** ${assessment.metadata.startedAt}\n`;
  md += `**Data de atualização:** ${assessment.metadata.updatedAt}\n`;
  if (assessment.metadata.completedAt) md += `**Conclusão:** ${assessment.metadata.completedAt}\n`;
  md += `**Progresso da avaliação:** ${responseCounts.answeredCount}/${instrument.questions.length} (${progress.percentage.toFixed(1)}%)\n`;
  md += `**Itens pontuados (0–3):** ${responseCounts.scoredCount}\n`;
  md += `**NS:** ${responseCounts.countNS} | **NA:** ${responseCounts.countNA} | **Não respondidas:** ${responseCounts.unansweredCount} | **Revisar depois:** ${reviewLaterCount}\n`;
  md += `**Índice ${validationErrors.length > 0 ? 'parcial ' : ''}de implementação segundo o instrumento:** ${
    score.implementationIndex === null ? 'não calculável' : `${score.implementationIndex.toFixed(1)}%`
  }\n\n`;
  md += `> O índice considera somente respostas numéricas 0–3. NS, NA e questões não respondidas não são tratados como nível 0. Itens marcados para revisão não alteram o cálculo.\n\n`;

  md += `## Registro das Questões\n\n`;
  instrument.questions.forEach((question) => {
    const answer = assessment.answers[question.id];
    const scoreText = answer?.score !== null && answer?.score !== undefined ? String(answer.score) : 'Não respondida';

    md += `### Q${question.id}. ${question.question}\n`;
    md += `- **Dimensão:** ${question.dimension} (${question.dimensionId})\n`;
    md += `- **Nível / Resposta:** ${scoreText}\n`;
    if (answer?.reviewLater) md += `- **Marcada para revisão:** Sim\n`;
    if (answer?.evidence) md += `- **Evidência / Fonte utilizada:** ${answer.evidence}\n`;
    if (answer?.observation) md += `- **Observações:** ${answer.observation}\n`;
    if (answer?.nsNaJustification) md += `- **Justificativa NS/NA:** ${answer.nsNaJustification}\n`;
    md += `\n`;
  });

  return md;
}

export function exportPrintableReportHTML(
  assessment: FullAssessment,
  instrument: InstrumentData,
  includeEvidence: boolean,
  previousAssessment?: FullAssessment | null
): string {
  const counts = calculateResponseCounts(instrument.questions, assessment.answers);
  const progress = calculateProgress(instrument, assessment.answers);
  const score = calculateImplementationIndex(
    assessment.answers,
    instrument.questions.map((question) => question.id)
  );
  const errors = validateAssessment(instrument.questions, assessment.answers);
  const dimensions = calculateDimensionMetrics(instrument.dimensions, instrument.questions, assessment.answers);
  const reviewQuestions = instrument.questions.filter((q) => assessment.answers[q.id]?.reviewLater);
  const numericAverage = score.totalScoredCount > 0 ? score.attainedPoints / score.totalScoredCount : null;
  const lowerLevelCount = counts.count0 + counts.count1;
  const higherLevelCount = counts.count2 + counts.count3;
  const lowerLevelPercentage = counts.scoredCount > 0 ? (lowerLevelCount / counts.scoredCount) * 100 : 0;
  const higherLevelPercentage = counts.scoredCount > 0 ? (higherLevelCount / counts.scoredCount) * 100 : 0;

  const indexedDimensions = dimensions.filter((dimension) => dimension.index !== null);

  const synthesisParts: string[] = [];
  if (score.implementationIndex !== null) {
    synthesisParts.push(
      `O índice de implementação foi de ${score.implementationIndex.toFixed(1)}%, equivalente à média global ${numericAverage?.toFixed(2) ?? 'N/A'} na escala de 0 a 3.`
    );
  }
  if (indexedDimensions.length > 0) {
    const indexes = indexedDimensions.map((dimension) => dimension.index as number);
    const maxIndex = Math.max(...indexes);
    const minIndex = Math.min(...indexes);
    const highestDimensions = indexedDimensions.filter((dimension) => Math.abs((dimension.index as number) - maxIndex) < 0.05);
    const lowestDimensions = indexedDimensions.filter((dimension) => Math.abs((dimension.index as number) - minIndex) < 0.05);
    const highestNames = highestDimensions.map((dimension) => `${dimension.id} — ${dimension.name}`).join('; ');
    const lowestNames = lowestDimensions.map((dimension) => `${dimension.id} — ${dimension.name}`).join('; ');
    synthesisParts.push(
      `${highestDimensions.length > 1 ? 'As maiores pontuações por dimensão ocorreram' : 'A maior pontuação por dimensão ocorreu'} em ${highestNames} (${maxIndex.toFixed(1)}%), enquanto ${lowestDimensions.length > 1 ? 'as menores ocorreram' : 'a menor ocorreu'} em ${lowestNames} (${minIndex.toFixed(1)}%).`
    );
  }
  synthesisParts.push(
    `${lowerLevelCount} controle(s) estão nos níveis 0–1 e ${higherLevelCount} nos níveis 2–3, entre os itens pontuados.`
  );
  if (counts.countNS > 0 || counts.countNA > 0) {
    synthesisParts.push(
      `${counts.countNS} resposta(s) NS e ${counts.countNA} NA permanecem apresentadas separadamente e não entram no índice numérico.`
    );
  }
  const synthesis = synthesisParts.join(' ');

  const dimensionBars = dimensions.map((dimension) => {
    const average = dimension.index !== null ? (dimension.index * 3) / 100 : null;
    return `
      <div class="dimension-bar">
        <div class="dimension-head">
          <div><strong>${escapeHtml(dimension.id)} — ${escapeHtml(dimension.name)}</strong><span>${dimension.scoredCount} controle(s) pontuado(s)${dimension.scoredCount !== dimension.totalCount ? ` · cobertura ${dimension.answeredCount}/${dimension.totalCount}` : ''}</span></div>
          <div class="dimension-value">${dimension.index === null ? 'N/A' : `${dimension.index.toFixed(1)}%`}<span>${average === null ? 'Sem base numérica' : `${average.toFixed(2)} / 3`}</span></div>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(0, Math.min(100, dimension.index ?? 0)).toFixed(1)}%"></div></div>
      </div>`;
  }).join('');

  const distributionItems = [
    { label: 'Nível 0', count: counts.count0, cls: 'n0' },
    { label: 'Nível 1', count: counts.count1, cls: 'n1' },
    { label: 'Nível 2', count: counts.count2, cls: 'n2' },
    { label: 'Nível 3', count: counts.count3, cls: 'n3' },
    { label: 'NS — Evidência insuficiente', count: counts.countNS, cls: 'ns' },
    { label: 'NA — Não aplicável', count: counts.countNA, cls: 'na' },
  ];

  const distributionRows = distributionItems.map((item) => {
    const percentage = instrument.questions.length > 0 ? (item.count / instrument.questions.length) * 100 : 0;
    return `
      <div class="dist-row ${item.cls}">
        <div class="dist-label"><strong>${escapeHtml(item.label)}</strong><span>${item.count} · ${percentage.toFixed(1)}%</span></div>
        <div class="dist-track"><div class="dist-fill" style="width:${percentage.toFixed(1)}%"></div></div>
      </div>`;
  }).join('');

  const scoreClass = (value: QuestionAnswer['score'] | null | undefined): string => {
    if (value === 0) return 'n0';
    if (value === 1) return 'n1';
    if (value === 2) return 'n2';
    if (value === 3) return 'n3';
    if (value === 'NS') return 'ns';
    if (value === 'NA') return 'na';
    return 'unanswered';
  };

  const scoreLabel = (value: QuestionAnswer['score'] | null | undefined): string => {
    if (value === 0 || value === 1 || value === 2 || value === 3) return `N${value}`;
    if (value === 'NS' || value === 'NA') return value;
    return '—';
  };

  const heatmapRows = instrument.dimensions.map((dimension) => {
    const questionList = instrument.questions.filter((question) => question.dimensionId === dimension.id);
    return `
      <div class="heat-dimension">
        <div class="heat-title"><strong>${escapeHtml(dimension.id)} — ${escapeHtml(dimension.name)}</strong><span>${questionList.length} questão(ões)</span></div>
        <div class="heat-cells">
          ${questionList.map((question) => {
            const value = assessment.answers[question.id]?.score ?? null;
            return `<span class="heat-cell ${scoreClass(value)}" title="Q${question.id} — ${escapeHtml(question.question)} — ${escapeHtml(scoreLabel(value))}">Q${question.id}<small>${escapeHtml(scoreLabel(value))}</small></span>`;
          }).join('')}
        </div>
      </div>`;
  }).join('');

  const matrixRows = dimensions.map((dimension) => {
    const average = dimension.index !== null ? (dimension.index * 3) / 100 : null;
    return `
      <tr>
        <td class="left"><strong>${escapeHtml(dimension.id)}</strong> — ${escapeHtml(dimension.name)}</td>
        <td class="n0">${dimension.count0}</td>
        <td class="n1">${dimension.count1}</td>
        <td class="n2">${dimension.count2}</td>
        <td class="n3">${dimension.count3}</td>
        <td class="ns">${dimension.countNS}</td>
        <td class="na">${dimension.countNA}</td>
        <td>${dimension.unansweredCount}</td>
        <td>${average === null ? 'N/A' : average.toFixed(2)}</td>
        <td><strong>${dimension.index === null ? 'N/A' : `${dimension.index.toFixed(1)}%`}</strong></td>
      </tr>`;
  }).join('');

  const level0Questions = instrument.questions.filter((question) => assessment.answers[question.id]?.score === 0);
  const level1Questions = instrument.questions.filter((question) => assessment.answers[question.id]?.score === 1);

  const gapList = (questionList: typeof instrument.questions): string => {
    if (!questionList.length) return '<p class="muted">Nenhum controle neste grupo.</p>';
    return `<table class="compact"><thead><tr><th>Questão</th><th>Dimensão</th><th>Controle</th></tr></thead><tbody>${questionList.map((question) => `
      <tr><td>Q${question.id}</td><td>${escapeHtml(question.dimensionId)}</td><td>${escapeHtml(question.question)}</td></tr>`).join('')}</tbody></table>`;
  };

  let comparisonSection = '';
  if (previousAssessment) {
    const comparison = compareAssessments(
      instrument.questions,
      instrument.dimensions,
      assessment.answers,
      previousAssessment.answers
    );

    const formatPercent = (value: number | null) => value === null ? 'N/A' : `${value.toFixed(1)}%`;
    const formatAverage = (value: number | null) => value === null ? 'N/A' : value.toFixed(2);
    const formatDelta = (value: number | null, suffix: string) => {
      if (value === null) return 'N/A';
      return `${value > 0 ? '+' : ''}${value.toFixed(1)}${suffix}`;
    };

    const dimensionComparisonRows = comparison.dimensionComparisons.map((dimension) => `
      <tr>
        <td class="left"><strong>${escapeHtml(dimension.id)}</strong> — ${escapeHtml(dimension.name)}</td>
        <td>${dimension.comparableCount}</td>
        <td>${formatPercent(dimension.previousIndex)}</td>
        <td>${formatPercent(dimension.currentIndex)}</td>
        <td><strong>${formatDelta(dimension.deltaPercentagePoints, ' p.p.')}</strong></td>
        <td>${dimension.improvedCount}</td>
        <td>${dimension.worsenedCount}</td>
        <td>${dimension.unchangedCount}</td>
      </tr>`).join('');

    const changedQuestions = comparison.questionComparisons.filter(
      (item) => item.status === 'improved' || item.status === 'worsened'
    );
    const changedRows = changedQuestions.length
      ? changedQuestions.map((item) => `
          <tr>
            <td>Q${item.question.id}</td>
            <td>${escapeHtml(item.question.dimensionId)}</td>
            <td>${escapeHtml(item.question.question)}</td>
            <td>${escapeHtml(scoreLabel(item.previousScore))}</td>
            <td>${escapeHtml(scoreLabel(item.currentScore))}</td>
            <td>${item.status === 'improved' ? 'Melhorou' : 'Reduziu'}</td>
          </tr>`).join('')
      : '<tr><td colspan="6">Nenhuma mudança de nível entre as questões numéricas comparáveis.</td></tr>';

    comparisonSection = `
      <section class="page-section comparison-section">
        <h2>Comparação com avaliação anterior</h2>
        <p class="muted">Seção opcional. Os cálculos comparativos usam somente questões com nível 0–3 nas duas avaliações; NS, NA e não respondidas ficam fora da comparação numérica.</p>

        <div class="identity-grid">
          <div class="identity"><span>Avaliação anterior</span><strong>${escapeHtml(previousAssessment.metadata.id)}</strong><small>${escapeHtml(formatDate(previousAssessment.metadata.updatedAt || previousAssessment.metadata.completedAt))} · cobertura ${comparison.previousCoveragePercentage.toFixed(1)}%</small></div>
          <div class="identity"><span>Avaliação atual</span><strong>${escapeHtml(assessment.metadata.id)}</strong><small>${escapeHtml(formatDate(assessment.metadata.updatedAt || assessment.metadata.completedAt))} · cobertura ${comparison.currentCoveragePercentage.toFixed(1)}%</small></div>
        </div>

        <div class="cards comparison-cards">
          <div class="card"><span>Índice anterior</span><strong>${formatPercent(comparison.previousIndex)}</strong><small>${formatAverage(comparison.previousAverage)} / 3</small></div>
          <div class="card"><span>Índice atual</span><strong>${formatPercent(comparison.currentIndex)}</strong><small>${formatAverage(comparison.currentAverage)} / 3</small></div>
          <div class="card"><span>Variação</span><strong>${formatDelta(comparison.deltaPercentagePoints, ' p.p.')}</strong><small>${formatDelta(comparison.deltaAverage, ' na escala 0–3')}</small></div>
          <div class="card"><span>Melhoraram</span><strong>${comparison.improvedCount}</strong><small>questões</small></div>
          <div class="card"><span>Pioraram</span><strong>${comparison.worsenedCount}</strong><small>questões</small></div>
          <div class="card"><span>Comparáveis</span><strong>${comparison.comparableCount}/${instrument.questions.length}</strong><small>${comparison.nonComparableCount} fora da comparação</small></div>
        </div>

        <h3>Evolução por dimensão</h3>
        <table><thead><tr><th>Dimensão</th><th>Comparáveis</th><th>Anterior</th><th>Atual</th><th>Variação</th><th>↑</th><th>↓</th><th>=</th></tr></thead><tbody>${dimensionComparisonRows}</tbody></table>

        <h3>Questões que mudaram de nível</h3>
        <table class="compact"><thead><tr><th>Questão</th><th>Dim.</th><th>Controle</th><th>Anterior</th><th>Atual</th><th>Mudança</th></tr></thead><tbody>${changedRows}</tbody></table>

        <div class="notice subtle"><strong>Nota metodológica do comparativo.</strong> A seção descreve mudança no nível de implementação entre duas aplicações/estados do mesmo instrumento. Ela não atribui causalidade às mudanças e não converte NS/NA em valores numéricos.</div>
      </section>`;
  }

  const detailRows = includeEvidence
    ? instrument.questions.map((question) => {
        const answer = assessment.answers[question.id];
        const currentScore = answer?.score ?? null;
        return `
          <section class="question-detail">
            <h4>Q${question.id} — ${escapeHtml(question.question)}</h4>
            <p><strong>Dimensão:</strong> ${escapeHtml(question.dimension)} (${escapeHtml(question.dimensionId)})</p>
            <p><strong>Resposta:</strong> ${escapeHtml(scoreLabel(currentScore))}${answer?.reviewLater ? ' · marcada para revisão' : ''}</p>
            ${answer?.evidence ? `<p><strong>Evidência registrada:</strong> ${escapeHtml(answer.evidence)}</p>` : ''}
            ${answer?.observation ? `<p><strong>Observação:</strong> ${escapeHtml(answer.observation)}</p>` : ''}
            ${answer?.nsNaJustification ? `<p><strong>Justificativa NS/NA:</strong> ${escapeHtml(answer.nsNaJustification)}</p>` : ''}
          </section>`;
      }).join('')
    : '';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Relatório ${escapeHtml(assessment.metadata.id)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; font-size: 10.2px; line-height: 1.42; margin: 0; background: #fff; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #0f172a; }
  h2 { font-size: 14px; margin: 22px 0 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; color: #0f172a; }
  h3 { font-size: 11.5px; margin: 14px 0 7px; color: #0f172a; }
  h4 { font-size: 10.5px; margin: 0 0 5px; }
  p { margin: 5px 0; }
  .report-subtitle { margin: 0 0 6px; color: #475569; font-size: 11.5px; }
  .muted { color: #64748b; }
  .report-meta { margin: 4px 0 12px; }
  .notice { background: #f8fafc; border: 1px solid #cbd5e1; padding: 9px; border-radius: 6px; margin: 10px 0; }
  .notice.subtle { margin-top: 12px; font-size: 9.5px; }
  .synthesis { background: #eef2ff; border-color: #c7d2fe; }
  .cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin: 10px 0; }
  .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; min-width: 0; background: #fff; }
  .card span { color: #64748b; display: block; font-size: 8.7px; text-transform: uppercase; font-weight: 700; letter-spacing: .02em; }
  .card strong { font-size: 16px; display: block; margin-top: 3px; color: #0f172a; }
  .card small { color: #64748b; display: block; margin-top: 2px; }
  .dimension-bar { margin: 9px 0; page-break-inside: avoid; }
  .dimension-head { display: flex; justify-content: space-between; gap: 12px; align-items: end; }
  .dimension-head > div:first-child { min-width: 0; }
  .dimension-head span, .dimension-value span { display: block; color: #64748b; font-size: 8.8px; font-weight: normal; }
  .dimension-value { text-align: right; font-weight: 700; color: #4338ca; white-space: nowrap; }
  .bar-track { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-top: 4px; }
  .bar-fill { height: 100%; background: #4f46e5; border-radius: 999px; }
  .dist-row { border: 1px solid #cbd5e1; padding: 6px 7px; border-radius: 5px; margin: 5px 0; page-break-inside: avoid; }
  .dist-label { display: flex; justify-content: space-between; gap: 8px; }
  .dist-track { height: 5px; background: rgba(255,255,255,.8); border-radius: 99px; margin-top: 4px; overflow: hidden; }
  .dist-fill { height: 100%; border-radius: 99px; background: #64748b; }
  .n0 { background: #fef2f2; color: #991b1b; }
  .n1 { background: #fffbeb; color: #92400e; }
  .n2 { background: #eff6ff; color: #1e40af; }
  .n3 { background: #ecfdf5; color: #065f46; }
  .ns { background: #faf5ff; color: #6b21a8; }
  .na { background: #f1f5f9; color: #475569; }
  .unanswered { background: #fff; color: #64748b; }
  .dist-row.n0 .dist-fill { background: #ef4444; }
  .dist-row.n1 .dist-fill { background: #f59e0b; }
  .dist-row.n2 .dist-fill { background: #3b82f6; }
  .dist-row.n3 .dist-fill { background: #10b981; }
  .dist-row.ns .dist-fill { background: #a855f7; }
  .dist-row.na .dist-fill { background: #64748b; }
  .level-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
  .level-summary > div { border: 1px solid #cbd5e1; border-radius: 5px; padding: 7px; }
  .heat-legend { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
  .legend { border: 1px solid #cbd5e1; padding: 3px 6px; border-radius: 4px; font-weight: 700; }
  .heat-dimension { margin: 8px 0 10px; page-break-inside: avoid; }
  .heat-title { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
  .heat-title span { color: #64748b; font-size: 8.7px; }
  .heat-cells { display: flex; flex-wrap: wrap; gap: 4px; }
  .heat-cell { width: 31px; height: 31px; border: 1px solid #cbd5e1; border-radius: 4px; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 700; font-size: 8.7px; }
  .heat-cell small { font-size: 7px; font-weight: 600; opacity: .8; }
  table { width: 100%; border-collapse: collapse; margin: 7px 0 14px; font-size: 8.8px; }
  th, td { border: 1px solid #cbd5e1; padding: 4px 5px; vertical-align: top; text-align: center; }
  th { background: #f1f5f9; text-align: center; color: #334155; }
  td.left, th.left { text-align: left; }
  table.compact td, table.compact th { padding: 4px; }
  .gap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: start; }
  .gap-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; page-break-inside: avoid; }
  .identity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0; }
  .identity { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #f8fafc; }
  .identity span, .identity small { display: block; color: #64748b; }
  .identity strong { display: block; margin: 2px 0; color: #0f172a; }
  .comparison-cards { grid-template-columns: repeat(3, 1fr); }
  .question-detail { page-break-inside: avoid; border-top: 1px solid #e2e8f0; padding: 8px 0; }
  .question-detail p { margin: 3px 0; white-space: pre-wrap; }
  .page-section { page-break-before: auto; }
  .comparison-section { page-break-before: always; }
  .appendix { page-break-before: always; }
  .no-print { margin-bottom: 12px; }
  @media print { .no-print { display: none !important; } a { color: inherit; text-decoration: none; } }
  @media screen and (max-width: 760px) {
    .cards, .comparison-cards { grid-template-columns: repeat(2, 1fr); }
    .gap-grid, .identity-grid, .level-summary { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
  <div class="no-print notice">Relatório preparado para impressão/PDF. <button onclick="window.print()">Imprimir / Salvar como PDF</button> ou use <strong>Ctrl+P</strong>.</div>

  <header>
    <h1>CiberInsight</h1>
    <p class="report-subtitle">Autoavaliação do nível de implementação de controles de segurança cibernética</p>
    <p class="report-meta muted">Instrumento ${escapeHtml(instrument.version)} · Identificador anônimo ${escapeHtml(assessment.metadata.id)}</p>
    <p><strong>Início:</strong> ${escapeHtml(formatDate(assessment.metadata.startedAt))} · <strong>Atualização:</strong> ${escapeHtml(formatDate(assessment.metadata.updatedAt))} · <strong>Conclusão:</strong> ${escapeHtml(formatDate(assessment.metadata.completedAt))}</p>
  </header>

  <div class="notice">
    <strong>Nota metodológica.</strong> O resultado expressa nível de implementação segundo este instrumento. Não representa percentual absoluto de segurança, certificação, conformidade integral, classificação de risco ou maturidade oficial do NIST. Somente respostas 0–3 entram no índice; NS, NA e não respondidas permanecem fora do cálculo numérico.
  </div>

  <div class="notice synthesis"><strong>Síntese automática dos resultados.</strong> ${escapeHtml(synthesis)}</div>

  <section>
    <h2>1. Resumo da avaliação</h2>
    <div class="cards">
      <div class="card"><span>Média global dos níveis</span><strong>${numericAverage === null ? 'N/A' : numericAverage.toFixed(2)} / 3</strong><small>itens pontuados</small></div>
      <div class="card"><span>${errors.length ? 'Índice parcial de implementação' : 'Índice de implementação'}</span><strong>${score.implementationIndex === null ? 'N/A' : `${score.implementationIndex.toFixed(1)}%`}</strong><small>mesma medida em escala 0–100%</small></div>
      <div class="card"><span>Cobertura da avaliação</span><strong>${progress.percentage.toFixed(1)}%</strong><small>${counts.answeredCount}/${instrument.questions.length} respondidas</small></div>
      <div class="card"><span>Controles em Nível 0</span><strong>${counts.count0}</strong><small>maior lacuna na escala</small></div>
      <div class="card"><span>Marcados para revisão</span><strong>${reviewQuestions.length}</strong><small>marcação de apoio</small></div>
    </div>
  </section>

  <section>
    <h2>2. Perfil de implementação por dimensão</h2>
    ${dimensionBars}
  </section>

  <section>
    <h2>3. Distribuição 0–3 / NS / NA</h2>
    ${distributionRows}
    <div class="level-summary">
      <div><strong>Níveis 0–1:</strong> ${lowerLevelCount} controle(s) · ${lowerLevelPercentage.toFixed(1)}% dos itens pontuados</div>
      <div><strong>Níveis 2–3:</strong> ${higherLevelCount} controle(s) · ${higherLevelPercentage.toFixed(1)}% dos itens pontuados</div>
    </div>
  </section>

  <section>
    <h2>4. Mapa de implementação (heatmap) das 93 questões</h2>
    <div class="heat-legend">
      <span class="legend n0">N0</span><span class="legend n1">N1</span><span class="legend n2">N2</span><span class="legend n3">N3</span><span class="legend ns">NS</span><span class="legend na">NA</span><span class="legend unanswered">—</span>
    </div>
    ${heatmapRows}
  </section>

  <section>
    <h2>5. Matriz dimensão × níveis</h2>
    <table><thead><tr><th class="left">Dimensão</th><th>N0</th><th>N1</th><th>N2</th><th>N3</th><th>NS</th><th>NA</th><th>Não resp.</th><th>Média (0–3)</th><th>Índice (%)</th></tr></thead><tbody>${matrixRows}</tbody></table>
  </section>

  <section>
    <h2>6. Principais lacunas de implementação</h2>
    <p class="muted">A classificação abaixo deriva exclusivamente do nível informado no instrumento e não constitui priorização automática de risco.</p>
    <div class="gap-grid">
      <div class="gap-box"><h3>Controles em Nível 0 — maior lacuna de implementação (${level0Questions.length})</h3>${gapList(level0Questions)}</div>
      <div class="gap-box"><h3>Controles em Nível 1 — implementação inicial (${level1Questions.length})</h3>${gapList(level1Questions)}</div>
    </div>
  </section>

  ${comparisonSection}

  ${reviewQuestions.length ? `<section><h2>Itens marcados para revisão</h2><ul>${reviewQuestions.map((q) => `<li>Q${q.id} — ${escapeHtml(q.question)}</li>`).join('')}</ul></section>` : ''}
  ${errors.length ? `<section><h2>Pendências de conclusão</h2><ul>${errors.map((e) => `<li>${escapeHtml(e.message)}</li>`).join('')}</ul></section>` : ''}
  ${includeEvidence ? `<section class="appendix"><h2>Anexo — Registro detalhado das questões</h2><p class="muted">Inclui evidências, observações e justificativas NS/NA registradas na avaliação atual.</p>${detailRows}</section>` : ''}
</body>
</html>`;
}

export function openPrintableReport(html: string): boolean {
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) return false;
  try { reportWindow.opener = null; } catch { /* sem ação */ }
  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
  reportWindow.focus();
  return true;
}

export function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
