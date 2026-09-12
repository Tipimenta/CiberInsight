import React, { useEffect, useState } from 'react';
import type {
  Question,
  QuestionAnswer,
  Dimension,
  InstrumentData,
  FullAssessment,
  ControlGuidanceData,
  VerificationGuidanceData,
} from './types';
import { Header, type AppViewMode } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { QuestionCard } from './components/QuestionCard';
import { QuestionSupportPanel } from './components/QuestionSupportPanel';
import { ResultsDashboard } from './components/ResultsDashboard';
import { ControlGuidanceModal } from './components/ControlGuidanceModal';
import { ExportModal } from './components/ExportModal';
import { SavedAssessmentsModal } from './components/SavedAssessmentsModal';
import {
  authorizeExternalAutoBackup,
  createNewAssessment,
  disableExternalAutoBackup,
  enableExternalAutoBackup,
  exportAssessmentBackup,
  getExternalAutoBackupStatus,
  getStoragePersistenceStatus,
  getUiPreferences,
  initializeAssessmentStorage,
  rememberQuestionForAssessment,
  saveAssessment,
  updateUiPreferences,
  upsertAssessment,
  type ExternalAutoBackupStatus,
  type StoragePersistenceStatus,
} from './services/storage';
import { calculateProgress } from './services/scoring';
import { isNumericScoreValue } from './services/scoreValue';
import { downloadFile } from './services/export';
import controlGuidanceData from './data/controlGuidance.json';
import verificationGuidanceData from './data/verificationGuidance.json';
import rawInstrumentData from './data/instrumento.json';

export const App: React.FC = () => {
  const instrument = rawInstrumentData as unknown as InstrumentData;
  const questions = (instrument.questions || []) as Question[];
  const dimensions = (instrument.dimensions || []) as Dimension[];
  const guidanceMap = controlGuidanceData as unknown as ControlGuidanceData;
  const verificationGuidanceMap = verificationGuidanceData as unknown as VerificationGuidanceData;

  const [assessment, setAssessment] = useState<FullAssessment>(() => createNewAssessment(instrument.version));
  const [savedAssessments, setSavedAssessments] = useState<FullAssessment[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentView, setCurrentView] = useState<AppViewMode>('assessment');
  const [selectedModalQuestionId, setSelectedModalQuestionId] = useState<number | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSavedAssessmentsOpen, setIsSavedAssessmentsOpen] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [autoAdvancePending, setAutoAdvancePending] = useState<boolean>(false);
  const [autoAdvanceProgressCycle, setAutoAdvanceProgressCycle] = useState<number>(0);
  const [comparisonAssessment, setComparisonAssessment] = useState<FullAssessment | null>(null);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [externalBackupStatus, setExternalBackupStatus] = useState<ExternalAutoBackupStatus>('inactive');
  const [persistenceStatus, setPersistenceStatus] = useState<StoragePersistenceStatus>('not-granted');

  const answers = assessment.answers;
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const resolveQuestionIndex = (assessmentId: string): number => {
    const rememberedId = getUiPreferences().currentQuestionByAssessment?.[assessmentId];
    if (!rememberedId) return 0;
    const index = questions.findIndex((question) => question.id === rememberedId);
    return index >= 0 ? index : 0;
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const result = await initializeAssessmentStorage(
        instrument.version,
        questions.map((question) => question.id)
      );
      if (cancelled) return;

      setAssessment(result.assessment);
      setSavedAssessments(result.assessments);
      setStorageNotice(result.notice || null);
      setCurrentQuestionIndex(resolveQuestionIndex(result.assessment.metadata.id));
      setCurrentView(result.preferences.currentView === 'results' ? 'results' : 'assessment');
      setAutoAdvance(result.preferences.autoAdvance ?? true);
      setShowPrivacyNotice(result.preferences.privacyNoticeDismissed !== true);
      setLastSavedTime(
        new Date(result.assessment.metadata.updatedAt).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      setStorageReady(true);
      void getExternalAutoBackupStatus().then(setExternalBackupStatus);
      void getStoragePersistenceStatus().then(setPersistenceStatus);
    };

    void initialize();
    return () => {
      cancelled = true;
    };
    // O instrumento é estático nesta execução; a inicialização deve ocorrer uma única vez por versão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instrument.version]);

  useEffect(() => {
    if (!storageReady || !currentQuestion) return;
    rememberQuestionForAssessment(assessment.metadata.id, currentQuestion.id);
  }, [storageReady, assessment.metadata.id, currentQuestion]);

  const persistAssessment = (updated: FullAssessment) => {
    setSavedAssessments((current) => upsertAssessment(current, updated));
    void saveAssessment(updated)
      .then(() => {
        setLastSavedTime(
          new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        );
      })
      .catch((error) => {
        console.error('Erro ao salvar avaliação no IndexedDB:', error);
        setStorageNotice('Não foi possível salvar a última alteração no armazenamento local. Gere um backup JSON antes de fechar o navegador.');
      });
  };

  const handleAnswerChange = (updatedAnswer: QuestionAnswer) => {
    setAssessment((previous) => {
      const updated: FullAssessment = {
        ...previous,
        metadata: {
          ...previous.metadata,
          completedAt: undefined,
          updatedAt: new Date().toISOString(),
        },
        answers: {
          ...previous.answers,
          [updatedAnswer.questionId]: updatedAnswer,
        },
      };
      persistAssessment(updated);
      return updated;
    });
  };

  const scrollToQuestionTop = () => {
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((previous) => previous + 1);
      scrollToQuestionTop();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((previous) => previous - 1);
      scrollToQuestionTop();
    }
  };

  const handleSelectQuestionById = (questionId: number) => {
    const index = questions.findIndex((question) => question.id === questionId);
    if (index !== -1) {
      setCurrentQuestionIndex(index);
      handleSwitchView('assessment');
      scrollToQuestionTop();
    }
  };

  const handleSwitchView = (view: AppViewMode) => {
    setCurrentView(view);
    updateUiPreferences({ currentView: view });
  };

  const handleAutoAdvanceChange = (enabled: boolean) => {
    setAutoAdvance(enabled);
    updateUiPreferences({ autoAdvance: enabled });
  };

  const handleDismissPrivacyNotice = () => {
    setShowPrivacyNotice(false);
    updateUiPreferences({ privacyNoticeDismissed: true });
  };

  const handleFinalizeAssessment = () => {
    setAssessment((previous) => {
      const updated: FullAssessment = {
        ...previous,
        metadata: {
          ...previous.metadata,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      persistAssessment(updated);
      return updated;
    });
    handleSwitchView('results');
  };

  const activateAssessment = (selected: FullAssessment, notice: string) => {
    setAssessment(selected);
    setComparisonAssessment(null);
    setCurrentQuestionIndex(resolveQuestionIndex(selected.metadata.id));
    handleSwitchView('assessment');
    updateUiPreferences({ currentAssessmentId: selected.metadata.id });
    setStorageNotice(notice);
    setIsSavedAssessmentsOpen(false);
    setLastSavedTime(
      new Date(selected.metadata.updatedAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
    scrollToQuestionTop();
  };

  const handleImportAssessmentsToHistory = async (importedAssessments: FullAssessment[]) => {
    const compatible = importedAssessments.filter(
      (item) => item.metadata.instrumentVersion === instrument.version
    );
    if (compatible.length === 0) {
      throw new Error('O arquivo não contém avaliações compatíveis com esta versão do instrumento.');
    }

    const safeToImport = compatible.filter((item) => item.metadata.id !== assessment.metadata.id);
    if (safeToImport.length === 0) {
      throw new Error('O backup contém somente a avaliação que já está aberta. Use uma versão de recuperação caso queira voltar a um estado anterior.');
    }

    for (const item of safeToImport) {
      await saveAssessment(item);
    }
    setSavedAssessments((current) =>
      safeToImport.reduce((acc, item) => upsertAssessment(acc, item), current)
    );
    setStorageNotice(
      safeToImport.length === 1
        ? `Avaliação ${safeToImport[0].metadata.id} importada para o histórico local.`
        : `${safeToImport.length} avaliações foram restauradas para o histórico local.`
    );
  };

  const handleRestoreRecoveryVersion = async (recovered: FullAssessment) => {
    const restored: FullAssessment = {
      ...recovered,
      metadata: {
        ...recovered.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
    await saveAssessment(restored);
    setSavedAssessments((current) => upsertAssessment(current, restored));
    if (restored.metadata.id === assessment.metadata.id) {
      setAssessment(restored);
      setCurrentQuestionIndex(resolveQuestionIndex(restored.metadata.id));
    }
    setLastSavedTime(
      new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
    setStorageNotice(`Avaliação ${restored.metadata.id} restaurada a partir de uma versão de recuperação.`);
  };

  const handleEnableExternalBackup = async () => {
    const status = await enableExternalAutoBackup();
    setExternalBackupStatus(status);
  };

  const handleAuthorizeExternalBackup = async () => {
    const status = await authorizeExternalAutoBackup();
    setExternalBackupStatus(status);
  };

  const handleDisableExternalBackup = async () => {
    await disableExternalAutoBackup();
    setExternalBackupStatus('inactive');
  };

  const handleOpenSavedAssessments = () => {
    setIsSavedAssessmentsOpen(true);
    void getExternalAutoBackupStatus().then(setExternalBackupStatus);
    void getStoragePersistenceStatus().then(setPersistenceStatus);
  };

  const handleCreateNewAssessment = () => {
    const confirmed = window.confirm(
      'Iniciar uma nova avaliação? A avaliação atual continuará salva no histórico deste navegador.'
    );
    if (!confirmed) return;

    const fresh = createNewAssessment(instrument.version);
    persistAssessment(fresh);
    updateUiPreferences({ currentAssessmentId: fresh.metadata.id, currentView: 'assessment' });
    setAssessment(fresh);
    setComparisonAssessment(null);
    setCurrentQuestionIndex(0);
    setCurrentView('assessment');
    setStorageNotice(`Nova avaliação ${fresh.metadata.id} iniciada. A avaliação anterior permanece salva no histórico local.`);
    setLastSavedTime(
      new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
    scrollToQuestionTop();
  };

  const handleOpenSavedAssessment = (selected: FullAssessment) => {
    if (selected.metadata.instrumentVersion !== instrument.version) {
      setStorageNotice(`A avaliação ${selected.metadata.id} usa o instrumento ${selected.metadata.instrumentVersion} e não pode ser aberta nesta versão.`);
      return;
    }
    activateAssessment(selected, `Avaliação ${selected.metadata.id} aberta a partir do histórico local.`);
  };

  const handleCompareSavedAssessment = (selected: FullAssessment) => {
    if (selected.metadata.instrumentVersion !== instrument.version) {
      setStorageNotice(`A avaliação ${selected.metadata.id} usa outra versão do instrumento e não pode ser comparada numericamente com a atual.`);
      return;
    }
    setComparisonAssessment(selected);
    setIsSavedAssessmentsOpen(false);
    handleSwitchView('results');
    setStorageNotice(`Avaliação ${selected.metadata.id} carregada como referência para comparação. A avaliação atual não foi alterada.`);
  };

  const handleExportAssessmentBackup = (selected: FullAssessment) => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeId = selected.metadata.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadFile(
      exportAssessmentBackup(selected),
      `backup_${safeId}_${dateStr}.json`,
      'application/json'
    );
  };


  const handleAutoAdvancePendingChange = (active: boolean) => {
    setAutoAdvancePending(active);
    if (active) {
      setAutoAdvanceProgressCycle((cycle) => cycle + 1);
    }
  };

  const progress = calculateProgress(instrument, answers);

  if (!storageReady) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-700 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-sm">
          Inicializando armazenamento local das avaliações…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col">
      <Header
        progressPercentage={progress.percentage}
        answeredCount={progress.answered}
        totalQuestions={progress.total}
        assessmentId={assessment.metadata.id}
        lastSavedTime={lastSavedTime}
        onCreateNewAssessment={handleCreateNewAssessment}
        onOpenSavedAssessments={handleOpenSavedAssessments}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onSwitchView={handleSwitchView}
        currentView={currentView}
        autoAdvancePending={autoAdvancePending}
        autoAdvanceProgressCycle={autoAdvanceProgressCycle}
      />

      {showPrivacyNotice && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-950 px-4 py-2.5 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="leading-relaxed">
              <strong>Privacidade local:</strong> as avaliações ficam somente neste navegador e não são enviadas pelo CiberInsight para servidores externos. Limpar os dados do site, trocar de domínio ou usar outro dispositivo pode remover o histórico local. Para avaliações importantes, você também pode ativar um único arquivo de backup automático externo em Avaliações.
            </p>
            <button
              type="button"
              onClick={handleDismissPrivacyNotice}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-800 font-bold transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {storageNotice && (
        <div className="bg-sky-50 border-b border-sky-200 text-sky-900 text-xs px-4 py-2 flex items-center justify-between gap-3">
          <span>{storageNotice}</span>
          <button
            type="button"
            onClick={() => setStorageNotice(null)}
            className="font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
            aria-label="Fechar aviso"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex flex-1 relative">
        {currentView === 'assessment' && (
          <Sidebar
            questions={questions}
            dimensions={dimensions}
            answers={answers}
            currentQuestionId={currentQuestion?.id || 1}
            onSelectQuestion={handleSelectQuestionById}
          />
        )}

        <main
          className={`flex-1 p-3 md:p-4 mx-auto space-y-4 w-full ${
            currentView === 'assessment' ? 'max-w-[1500px]' : 'max-w-6xl'
          }`}
        >
          {currentView === 'assessment' && currentQuestion && (
            <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
              <div className="space-y-3 min-w-0">
                {isNumericScoreValue(currentAnswer?.score) && (
                  <div className="flex justify-between items-center bg-white py-2 px-4 rounded-xl border border-slate-200 shadow-xs text-xs">
                    <span className="text-slate-600 font-medium">
                      Resposta registrada. Veja como evoluir este controle para o próximo nível.
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedModalQuestionId(currentQuestion.id)}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                    >
                      Guia de Evolução
                    </button>
                  </div>
                )}

                <details className="question-support-mobile bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <summary className="cursor-pointer select-none px-4 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100">
                    Apoio desta questão
                  </summary>
                  <div className="p-2.5 border-t border-slate-200">
                    <QuestionSupportPanel
                      key={`mobile-support-${currentQuestion.id}`}
                      question={currentQuestion}
                      verificationGuidance={verificationGuidanceMap[currentQuestion.id]}
                      controlGuidance={guidanceMap[currentQuestion.id]}
                      onSelectQuestion={handleSelectQuestionById}
                      embedded
                    />
                  </div>
                </details>

                <QuestionCard
                  key={`question-${currentQuestion.id}`}
                  question={currentQuestion}
                  currentAnswer={currentAnswer}
                  onAnswerChange={handleAnswerChange}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  isFirst={currentQuestionIndex === 0}
                  isLast={currentQuestionIndex === questions.length - 1}
                  verificationGuidance={verificationGuidanceMap[currentQuestion.id]}
                  autoAdvance={autoAdvance}
                  onAutoAdvanceChange={handleAutoAdvanceChange}
                  onAutoAdvancePendingChange={handleAutoAdvancePendingChange}
                />
              </div>

              <aside className="question-support-desktop sticky top-[76px] max-h-[calc(100vh-92px)] overflow-y-auto pr-1">
                <QuestionSupportPanel
                  key={`desktop-support-${currentQuestion.id}`}
                  question={currentQuestion}
                  verificationGuidance={verificationGuidanceMap[currentQuestion.id]}
                  controlGuidance={guidanceMap[currentQuestion.id]}
                  onSelectQuestion={handleSelectQuestionById}
                />
              </aside>
            </div>
          )}

          {currentView === 'results' && (
            <ResultsDashboard
              questions={questions}
              dimensions={dimensions}
              answers={answers}
              onOpenQuestion={handleSelectQuestionById}
              onBackToAssessment={() => handleSwitchView('assessment')}
              onFinalizeAssessment={handleFinalizeAssessment}
              isCompleted={Boolean(assessment.metadata.completedAt)}
              currentAssessmentId={assessment.metadata.id}
              currentAssessmentUpdatedAt={assessment.metadata.updatedAt}
              comparisonAssessment={comparisonAssessment}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onOpenSavedAssessments={handleOpenSavedAssessments}
            />
          )}
        </main>
      </div>

      {selectedModalQuestionId !== null && (
        <ControlGuidanceModal
          question={questions.find((question) => question.id === selectedModalQuestionId)!}
          currentScore={answers[selectedModalQuestionId]?.score ?? null}
          guidance={guidanceMap[selectedModalQuestionId]}
          onClose={() => setSelectedModalQuestionId(null)}
        />
      )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        assessment={assessment}
        instrument={instrument}
        comparisonAssessment={comparisonAssessment}
      />

      <SavedAssessmentsModal
        isOpen={isSavedAssessmentsOpen}
        onClose={() => setIsSavedAssessmentsOpen(false)}
        assessments={savedAssessments}
        currentAssessmentId={assessment.metadata.id}
        currentInstrumentVersion={instrument.version}
        validQuestionIds={questions.map((question) => question.id)}
        onOpenAssessment={handleOpenSavedAssessment}
        onCompareAssessment={handleCompareSavedAssessment}
        onExportAssessment={handleExportAssessmentBackup}
        onImportAssessmentsToHistory={handleImportAssessmentsToHistory}
        onRestoreRecoveryVersion={handleRestoreRecoveryVersion}
        externalBackupStatus={externalBackupStatus}
        persistenceStatus={persistenceStatus}
        onEnableExternalBackup={handleEnableExternalBackup}
        onAuthorizeExternalBackup={handleAuthorizeExternalBackup}
        onDisableExternalBackup={handleDisableExternalBackup}
      />
    </div>
  );
};

export default App;
