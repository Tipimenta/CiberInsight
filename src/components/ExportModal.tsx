import React, { useEffect, useState } from 'react';
import type { InstrumentData, FullAssessment } from '../types';
import {
  exportAssessmentJSON,
  exportPrintableReportHTML,
  exportToMarkdown,
  openPrintableReport,
  downloadFile,
} from '../services/export';
import { FileJson, FileText, Printer, X } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: FullAssessment;
  instrument: InstrumentData;
  comparisonAssessment?: FullAssessment | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  assessment,
  instrument,
  comparisonAssessment = null,
}) => {
  const [includeEvidenceInReport, setIncludeEvidenceInReport] = useState(false);
  const [includeComparisonInReport, setIncludeComparisonInReport] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMessage(null);
    setIncludeComparisonInReport(Boolean(comparisonAssessment));
  }, [isOpen, comparisonAssessment]);

  if (!isOpen) return null;

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeId = assessment.metadata.id.replace(/[^a-zA-Z0-9_-]/g, '_');

  const selectedComparison = includeComparisonInReport ? comparisonAssessment : null;

  const handlePrintableReport = () => {
    const html = exportPrintableReportHTML(
      assessment,
      instrument,
      includeEvidenceInReport,
      selectedComparison
    );
    const opened = openPrintableReport(html);
    if (!opened) {
      setMessage({
        type: 'error',
        text: 'O navegador bloqueou a nova janela. Permita pop-ups para visualizar o relatório.',
      });
      return;
    }
    setMessage({
      type: 'info',
      text: 'Relatório aberto. Na visualização, use Imprimir para imprimir ou salvar como PDF.',
    });
  };

  const handleDownloadHTML = () => {
    const html = exportPrintableReportHTML(
      assessment,
      instrument,
      includeEvidenceInReport,
      selectedComparison
    );
    downloadFile(html, `relatorio_${safeId}_${dateStr}.html`, 'text/html');
    setMessage({ type: 'success', text: 'Relatório HTML salvo.' });
  };

  const handleExportJSON = () => {
    const jsonStr = exportAssessmentJSON(assessment, instrument);
    downloadFile(jsonStr, `dados_avaliacao_${safeId}_${dateStr}.json`, 'application/json');
    setMessage({ type: 'success', text: 'Dados estruturados exportados.' });
  };

  const handleExportMarkdown = () => {
    const mdStr = exportToMarkdown(assessment, instrument);
    downloadFile(mdStr, `resumo_${safeId}_${dateStr}.md`, 'text/markdown');
    setMessage({ type: 'success', text: 'Resumo em Markdown salvo.' });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pr-8">
          <h3 className="text-base font-bold text-slate-900">Gerar relatório</h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Avaliação <strong>{assessment.metadata.id}</strong> · {assessment.metadata.completedAt ? 'concluída' : 'em andamento — o relatório será parcial'}. Escolha somente o que deseja incluir e visualize antes de imprimir ou salvar como PDF.
          </p>
        </div>

        {message && (
          <div
            className={`text-xs rounded-lg border px-3 py-2 ${
              message.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-sky-50 text-sky-800 border-sky-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="space-y-3">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700">
            <strong>Resultados da avaliação atual</strong>
            <span className="block text-[11px] text-slate-500 mt-1">
              Resumo, dimensões, distribuição, mapa de implementação, matriz e controles em Nível 0 e 1.
            </span>
          </div>

          <label className="flex items-start gap-2.5 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeEvidenceInReport}
              onChange={(e) => setIncludeEvidenceInReport(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <strong>Incluir evidências e observações como anexo</strong>
              <span className="block text-[11px] text-slate-500 mt-0.5">
                Deixe desmarcado por padrão. Ative somente se esses campos não contiverem informações confidenciais ou identificáveis.
              </span>
            </span>
          </label>

          {comparisonAssessment && (
            <label className="flex items-start gap-2.5 p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs text-indigo-950 cursor-pointer">
              <input
                type="checkbox"
                checked={includeComparisonInReport}
                onChange={(e) => setIncludeComparisonInReport(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <strong>Incluir comparação com a avaliação anterior</strong>
                <span className="block text-[11px] text-indigo-800/80 mt-0.5">
                  Referência: {comparisonAssessment.metadata.id}. A comparação numérica considera somente questões 0–3 presentes nas duas avaliações.
                </span>
              </span>
            </label>
          )}
        </section>

        <button
          type="button"
          onClick={handlePrintableReport}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
        >
          <Printer className="w-4 h-4" />
          Visualizar relatório
        </button>

        <p className="text-[11px] text-slate-500 text-center">
          Na visualização do relatório você poderá imprimir ou escolher “Salvar como PDF”.
        </p>

        <details className="border-t border-slate-100 pt-3">
          <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900">
            Outras exportações
          </summary>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Opções técnicas para arquivamento ou análise externa. O backup restaurável fica em <strong>Avaliações</strong> e não nesta tela.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <SecondaryAction
              icon={<FileText className="w-4 h-4" />}
              label="Relatório HTML"
              onClick={handleDownloadHTML}
            />
            <SecondaryAction
              icon={<FileJson className="w-4 h-4" />}
              label="Dados JSON"
              onClick={handleExportJSON}
            />
            <SecondaryAction
              icon={<FileText className="w-4 h-4" />}
              label="Resumo Markdown"
              onClick={handleExportMarkdown}
            />
          </div>
        </details>
      </div>
    </div>
  );
};

const SecondaryAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
  >
    {icon}
    {label}
  </button>
);

export default ExportModal;
