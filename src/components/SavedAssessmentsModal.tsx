import React, { useRef, useState } from 'react';
import {
  EllipsisVertical,
  FileUp,
  GitCompareArrows,
  HardDriveDownload,
  History,
  Play,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { FullAssessment } from '../types';
import {
  importAssessmentBackupCollection,
  listRecoverySnapshots,
  type AssessmentRecoverySnapshot,
  type ExternalAutoBackupStatus,
  type StoragePersistenceStatus,
} from '../services/storage';

interface SavedAssessmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessments: FullAssessment[];
  currentAssessmentId: string;
  currentInstrumentVersion: string;
  validQuestionIds: number[];
  onOpenAssessment: (assessment: FullAssessment) => void;
  onCompareAssessment: (assessment: FullAssessment) => void;
  onExportAssessment: (assessment: FullAssessment) => void;
  onImportAssessmentsToHistory: (assessments: FullAssessment[]) => Promise<void>;
  onRestoreRecoveryVersion: (assessment: FullAssessment) => Promise<void>;
  externalBackupStatus: ExternalAutoBackupStatus;
  persistenceStatus: StoragePersistenceStatus;
  onEnableExternalBackup: () => Promise<void>;
  onAuthorizeExternalBackup: () => Promise<void>;
  onDisableExternalBackup: () => Promise<void>;
}

export const SavedAssessmentsModal: React.FC<SavedAssessmentsModalProps> = ({
  isOpen,
  onClose,
  assessments,
  currentAssessmentId,
  currentInstrumentVersion,
  validQuestionIds,
  onOpenAssessment,
  onCompareAssessment,
  onExportAssessment,
  onImportAssessmentsToHistory,
  onRestoreRecoveryVersion,
  externalBackupStatus,
  persistenceStatus,
  onEnableExternalBackup,
  onAuthorizeExternalBackup,
  onDisableExternalBackup,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recoveryTarget, setRecoveryTarget] = useState<FullAssessment | null>(null);
  const [recoverySnapshots, setRecoverySnapshots] = useState<AssessmentRecoverySnapshot[]>([]);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [backupActionLoading, setBackupActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const content = await file.text();
      const imported = importAssessmentBackupCollection(
        content,
        currentInstrumentVersion,
        validQuestionIds
      );
      await onImportAssessmentsToHistory(imported);
      setMessage({
        type: 'success',
        text: imported.length === 1
          ? `Avaliação ${imported[0].metadata.id} importada para o histórico.`
          : `${imported.length} avaliações foram restauradas do backup para o histórico.`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível importar a avaliação.',
      });
    }
  };

  const handleOpenRecovery = async (item: FullAssessment) => {
    setOpenMenuId(null);
    setRecoveryTarget(item);
    setRecoveryLoading(true);
    setMessage(null);
    try {
      setRecoverySnapshots(await listRecoverySnapshots(item.metadata.id));
    } catch (error) {
      setRecoverySnapshots([]);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível consultar as versões de recuperação.',
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleRestoreSnapshot = async (snapshot: AssessmentRecoverySnapshot) => {
    const confirmed = window.confirm(
      `Restaurar a avaliação ${snapshot.assessmentId} para o estado salvo em ${formatDate(snapshot.createdAt)}? O estado atual também será protegido antes da restauração.`
    );
    if (!confirmed) return;

    try {
      await onRestoreRecoveryVersion(snapshot.assessment);
      setMessage({ type: 'success', text: 'Versão de recuperação restaurada com sucesso.' });
      setRecoveryTarget(null);
      setRecoverySnapshots([]);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível restaurar a versão selecionada.',
      });
    }
  };

  const runBackupAction = async (action: () => Promise<void>, successMessage: string) => {
    setBackupActionLoading(true);
    setMessage(null);
    try {
      await action();
      setMessage({ type: 'success', text: successMessage });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível alterar o backup automático.',
      });
    } finally {
      setBackupActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pr-8">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
              <History className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Avaliações</h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                Abra uma avaliação anterior ou compare-a com a atual. As cópias automáticas de recuperação ficam separadas e não aparecem nesta lista.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shrink-0"
          >
            <FileUp className="w-4 h-4" />
            Importar backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>

        {message && (
          <div className={`px-3 py-2 rounded-lg border text-xs ${message.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            {message.text}
          </div>
        )}

        {recoveryTarget && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-700" />
                  Recuperação — {recoveryTarget.metadata.id}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  São mantidas no máximo 5 versões internas. Elas servem apenas para recuperação e nunca entram no comparativo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRecoveryTarget(null);
                  setRecoverySnapshots([]);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Fechar
              </button>
            </div>

            {recoveryLoading ? (
              <div className="text-xs text-slate-600">Consultando versões…</div>
            ) : recoverySnapshots.length === 0 ? (
              <div className="text-xs text-slate-600">Ainda não há versões de recuperação para esta avaliação.</div>
            ) : (
              <div className="space-y-2">
                {recoverySnapshots.map((snapshot) => {
                  const answered = countAnswered(snapshot.assessment);
                  return (
                    <div key={snapshot.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
                      <div className="text-xs text-slate-700">
                        <strong>{formatDate(snapshot.createdAt)}</strong> · {answered}/{validQuestionIds.length} respondidas
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRestoreSnapshot(snapshot)}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900"
                      >
                        Restaurar esta versão
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {assessments.length === 0 ? (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600">
            Nenhuma avaliação local encontrada.
          </div>
        ) : (
          <div className="space-y-2">
            {assessments.map((item) => {
              const isCurrent = item.metadata.id === currentAssessmentId;
              const compatible = item.metadata.instrumentVersion === currentInstrumentVersion;
              const answered = countAnswered(item);

              return (
                <div
                  key={item.metadata.id}
                  className={`p-4 rounded-xl border ${isCurrent ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.metadata.id}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">Atual</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.metadata.completedAt ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                          {item.metadata.completedAt ? 'Concluída' : 'Em andamento'}
                        </span>
                        {!compatible && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                            Instrumento {item.metadata.instrumentVersion}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {answered} de {validQuestionIds.length} respondida(s) · {formatDate(item.metadata.updatedAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 relative">
                      <button
                        type="button"
                        disabled={isCurrent || !compatible}
                        onClick={() => onOpenAssessment(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Abrir
                      </button>
                      <button
                        type="button"
                        disabled={isCurrent || !compatible}
                        onClick={() => onCompareAssessment(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <GitCompareArrows className="w-3.5 h-3.5" />
                        Comparar
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpenMenuId((current) => current === item.metadata.id ? null : item.metadata.id)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                        aria-label={`Mais opções para ${item.metadata.id}`}
                        aria-expanded={openMenuId === item.metadata.id}
                      >
                        <EllipsisVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === item.metadata.id && (
                        <div className="absolute right-0 top-11 z-10 min-w-56 p-1.5 rounded-lg border border-slate-200 bg-white shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              onExportAssessment(item);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 text-xs font-medium text-slate-700"
                          >
                            Exportar backup JSON
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleOpenRecovery(item)}
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 text-xs font-medium text-slate-700"
                          >
                            Recuperar versão anterior
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900">Proteção das avaliações</h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                O salvamento principal continua no IndexedDB. O CiberInsight mantém até 5 versões internas por avaliação e um espelho de emergência. Essas cópias não aparecem no histórico e não podem ser escolhidas no comparativo.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2">
              <strong>Armazenamento persistente:</strong>{' '}
              {persistenceStatus === 'granted' ? 'ativo' : persistenceStatus === 'unsupported' ? 'não suportado' : 'não garantido pelo navegador'}
            </div>
            <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2">
              <strong>Backup externo:</strong>{' '}
              {externalBackupLabel(externalBackupStatus)}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-white px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <HardDriveDownload className="w-4 h-4" />
                Backup automático externo
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Opcional. Você escolhe <strong>um único arquivo JSON</strong> no computador. Ele é sobrescrito automaticamente com todas as avaliações, portanto não cria dezenas de backups nem interfere no comparativo. Se o navegador for removido, esse arquivo continua no computador e pode ser importado depois.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {externalBackupStatus === 'inactive' && (
                <button
                  type="button"
                  disabled={backupActionLoading}
                  onClick={() => void runBackupAction(onEnableExternalBackup, 'Backup automático externo ativado. O mesmo arquivo será atualizado nas próximas alterações.')}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  Ativar
                </button>
              )}
              {externalBackupStatus === 'permission-needed' && (
                <button
                  type="button"
                  disabled={backupActionLoading}
                  onClick={() => void runBackupAction(onAuthorizeExternalBackup, 'Permissão renovada e backup automático atualizado.')}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  Reautorizar
                </button>
              )}
              {(externalBackupStatus === 'active' || externalBackupStatus === 'permission-needed') && (
                <button
                  type="button"
                  disabled={backupActionLoading}
                  onClick={() => void runBackupAction(onDisableExternalBackup, 'Backup automático externo desativado. O arquivo já criado permanece no computador.')}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-50"
                >
                  Desativar
                </button>
              )}
              {externalBackupStatus === 'unsupported' && (
                <span className="text-[11px] text-slate-500">Disponível no Chrome/Edge desktop.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function countAnswered(assessment: FullAssessment): number {
  return Object.values(assessment.answers).filter(
    (answer) => answer.score !== null && answer.score !== undefined
  ).length;
}

function formatDate(value?: string): string {
  if (!value) return 'data não informada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR');
}

function externalBackupLabel(status: ExternalAutoBackupStatus): string {
  switch (status) {
    case 'active': return 'ativo — 1 arquivo é atualizado automaticamente';
    case 'permission-needed': return 'precisa de autorização do navegador';
    case 'unsupported': return 'não suportado neste navegador';
    default: return 'desativado';
  }
}

export default SavedAssessmentsModal;
