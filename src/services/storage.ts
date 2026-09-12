import type { FullAssessment, QuestionAnswer } from '../types';
import { isValidScoreValue } from './scoreValue';

const DB_NAME = 'ciberseguranca_local_db';
const DB_VERSION = 2;
const ASSESSMENTS_STORE = 'assessments';
const RECOVERY_STORE = 'recoverySnapshots';
const APP_STATE_STORE = 'appState';
const RECOVERY_LIMIT = 5;
const EMERGENCY_MIRROR_KEY = 'ciberseguranca_emergency_mirror_v1';
const EXTERNAL_BACKUP_HANDLE_KEY = 'externalAutoBackupHandle';

// Chaves legadas: usadas somente para migração automática da versão anterior.
const LEGACY_STORAGE_KEY = 'ciberseguranca_assessment';
const LEGACY_BACKUP_KEY = 'ciberseguranca_assessment_last_backup';

// localStorage passa a guardar somente preferências leves da interface.
const UI_PREFERENCES_KEY = 'ciberseguranca_ui_preferences_v1';

export interface UiPreferences {
  currentAssessmentId?: string;
  currentQuestionByAssessment?: Record<string, number>;
  currentView?: 'assessment' | 'results';
  autoAdvance?: boolean;
  privacyNoticeDismissed?: boolean;
}

export interface AssessmentStorageBootstrapResult {
  assessment: FullAssessment;
  assessments: FullAssessment[];
  preferences: UiPreferences;
  notice?: string;
  migratedLegacyCount?: number;
}

export interface AssessmentRecoverySnapshot {
  id: string;
  assessmentId: string;
  createdAt: string;
  reason: 'score-change' | 'protective' | 'periodic';
  assessment: FullAssessment;
}

export type StoragePersistenceStatus = 'granted' | 'not-granted' | 'unsupported';
export type ExternalAutoBackupStatus = 'active' | 'inactive' | 'permission-needed' | 'unsupported';

interface AppStateRecord {
  key: string;
  value: unknown;
}

function createAnonymousAssessmentId(): string {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');

  let suffix = '';
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    suffix = (buffer[0] % 0x100000).toString(16).toUpperCase().padStart(5, '0');
  } else {
    suffix = Math.floor(Math.random() * 0x100000).toString(16).toUpperCase().padStart(5, '0');
  }

  return `AV-${date}-${suffix}`;
}

export function createNewAssessment(instrumentVersion: string = 'v0.5'): FullAssessment {
  const now = new Date().toISOString();
  const id = createAnonymousAssessmentId();
  return {
    metadata: {
      id,
      label: id,
      instrumentVersion,
      startedAt: now,
      updatedAt: now,
    },
    answers: {},
  };
}

function sanitizeAnswer(raw: unknown, fallbackQuestionId: number): QuestionAnswer | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Record<string, unknown>;
  const questionId = Number.isInteger(candidate.questionId)
    ? Number(candidate.questionId)
    : fallbackQuestionId;

  if (!Number.isInteger(questionId) || questionId <= 0) return null;

  const rawScore = candidate.score;
  const score = rawScore === null || rawScore === undefined
    ? null
    : isValidScoreValue(rawScore)
      ? rawScore
      : null;

  if (rawScore !== null && rawScore !== undefined && !isValidScoreValue(rawScore)) {
    console.warn(`Resposta inválida encontrada para a questão ${questionId}. O valor foi descartado.`);
  }

  return {
    questionId,
    score,
    evidence: typeof candidate.evidence === 'string' ? candidate.evidence : '',
    observation: typeof candidate.observation === 'string' ? candidate.observation : '',
    nsNaJustification:
      typeof candidate.nsNaJustification === 'string' ? candidate.nsNaJustification : '',
    reviewLater: candidate.reviewLater === true,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : undefined,
  };
}

function sanitizeAssessment(
  raw: unknown,
  currentInstrumentVersion: string,
  validQuestionIds?: Set<number>,
  enforceInstrumentVersion: boolean = true
): FullAssessment | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Record<string, unknown>;
  const metadataRaw = candidate.metadata;
  const answersRaw = candidate.answers;

  if (!metadataRaw || typeof metadataRaw !== 'object') return null;
  const metadata = metadataRaw as Record<string, unknown>;

  const storedVersion =
    typeof metadata.instrumentVersion === 'string' && metadata.instrumentVersion.trim()
      ? metadata.instrumentVersion
      : currentInstrumentVersion;

  if (enforceInstrumentVersion && storedVersion !== currentInstrumentVersion) return null;

  const answers: Record<number, QuestionAnswer> = {};
  if (answersRaw && typeof answersRaw === 'object') {
    Object.entries(answersRaw as Record<string, unknown>).forEach(([key, value]) => {
      const fallbackQuestionId = Number(key);
      if (!Number.isInteger(fallbackQuestionId)) return;
      const answer = sanitizeAnswer(value, fallbackQuestionId);
      if (!answer) return;
      if (validQuestionIds && !validQuestionIds.has(answer.questionId)) return;
      answers[answer.questionId] = answer;
    });
  }

  const now = new Date().toISOString();
  const id = typeof metadata.id === 'string' && metadata.id.trim()
    ? metadata.id
    : createAnonymousAssessmentId();

  return {
    metadata: {
      id,
      label:
        typeof metadata.label === 'string' && metadata.label.trim()
          ? metadata.label
          : id,
      instrumentVersion: storedVersion,
      startedAt: typeof metadata.startedAt === 'string' ? metadata.startedAt : now,
      updatedAt: typeof metadata.updatedAt === 'string' ? metadata.updatedAt : now,
      completedAt: typeof metadata.completedAt === 'string' ? metadata.completedAt : undefined,
    },
    answers,
  };
}

let databasePromise: Promise<IDBDatabase> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB não está disponível neste navegador.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ASSESSMENTS_STORE)) {
        const store = db.createObjectStore(ASSESSMENTS_STORE, { keyPath: 'metadata.id' });
        store.createIndex('updatedAt', 'metadata.updatedAt', { unique: false });
        store.createIndex('instrumentVersion', 'metadata.instrumentVersion', { unique: false });
      }
      if (!db.objectStoreNames.contains(RECOVERY_STORE)) {
        const recoveryStore = db.createObjectStore(RECOVERY_STORE, { keyPath: 'id' });
        recoveryStore.createIndex('assessmentId', 'assessmentId', { unique: false });
        recoveryStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(APP_STATE_STORE)) {
        db.createObjectStore(APP_STATE_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error || new Error('Não foi possível abrir o armazenamento local.'));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error('O armazenamento local está bloqueado por outra aba do sistema. Feche abas antigas do CiberInsight e tente novamente.'));
    };
  });

  return databasePromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Falha ao acessar o armazenamento local.'));
  });
}

async function putAssessmentDirect(assessment: FullAssessment): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(ASSESSMENTS_STORE, 'readwrite');
    const store = transaction.objectStore(ASSESSMENTS_STORE);
    store.put(assessment);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Não foi possível salvar a avaliação.'));
    transaction.onabort = () => reject(transaction.error || new Error('O salvamento da avaliação foi interrompido.'));
  });
}

function cloneAssessment(assessment: FullAssessment): FullAssessment {
  return JSON.parse(JSON.stringify(assessment)) as FullAssessment;
}

function scoreSignature(assessment: FullAssessment): string {
  return Object.entries(assessment.answers)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([questionId, answer]) => `${questionId}:${String(answer.score ?? '')}`)
    .join('|');
}

function scoredAnswerCount(assessment: FullAssessment): number {
  return Object.values(assessment.answers).filter(
    (answer) => answer.score !== null && answer.score !== undefined
  ).length;
}

async function getAssessmentByIdDirect(id: string): Promise<FullAssessment | null> {
  const db = await openDatabase();
  const transaction = db.transaction(ASSESSMENTS_STORE, 'readonly');
  const result = await requestToPromise(transaction.objectStore(ASSESSMENTS_STORE).get(id));
  return result ? (result as FullAssessment) : null;
}

export async function listRecoverySnapshots(assessmentId: string): Promise<AssessmentRecoverySnapshot[]> {
  const db = await openDatabase();
  const transaction = db.transaction(RECOVERY_STORE, 'readonly');
  const store = transaction.objectStore(RECOVERY_STORE);
  const index = store.index('assessmentId');
  const result = await requestToPromise(index.getAll(assessmentId));
  return (result as AssessmentRecoverySnapshot[]).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

async function createRecoverySnapshot(
  assessment: FullAssessment,
  reason: AssessmentRecoverySnapshot['reason']
): Promise<void> {
  const db = await openDatabase();
  const createdAt = new Date().toISOString();
  const snapshot: AssessmentRecoverySnapshot = {
    id: `${assessment.metadata.id}:${createdAt}:${Math.random().toString(36).slice(2, 8)}`,
    assessmentId: assessment.metadata.id,
    createdAt,
    reason,
    assessment: cloneAssessment(assessment),
  };

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(RECOVERY_STORE, 'readwrite');
    transaction.objectStore(RECOVERY_STORE).put(snapshot);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Não foi possível criar a cópia de recuperação.'));
    transaction.onabort = () => reject(transaction.error || new Error('A criação da cópia de recuperação foi interrompida.'));
  });

  const snapshots = await listRecoverySnapshots(assessment.metadata.id);
  const obsolete = snapshots.slice(RECOVERY_LIMIT);
  if (obsolete.length === 0) return;

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(RECOVERY_STORE, 'readwrite');
    const store = transaction.objectStore(RECOVERY_STORE);
    obsolete.forEach((item) => store.delete(item.id));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Não foi possível rotacionar as cópias de recuperação.'));
    transaction.onabort = () => reject(transaction.error || new Error('A rotação das cópias de recuperação foi interrompida.'));
  });
}

async function maybeCreateRecoverySnapshot(previous: FullAssessment, next: FullAssessment): Promise<void> {
  const previousCount = scoredAnswerCount(previous);
  const nextCount = scoredAnswerCount(next);
  const scoreChanged = scoreSignature(previous) !== scoreSignature(next);

  if (nextCount < previousCount) {
    await createRecoverySnapshot(previous, 'protective');
    return;
  }

  if (scoreChanged) {
    await createRecoverySnapshot(previous, 'score-change');
    return;
  }

  const snapshots = await listRecoverySnapshots(previous.metadata.id);
  const latestTime = snapshots[0] ? new Date(snapshots[0].createdAt).getTime() : 0;
  const tenMinutes = 10 * 60 * 1000;
  if (Date.now() - latestTime >= tenMinutes) {
    await createRecoverySnapshot(previous, 'periodic');
  }
}

function saveEmergencyMirror(assessment: FullAssessment): void {
  try {
    localStorage.setItem(EMERGENCY_MIRROR_KEY, JSON.stringify(assessment));
  } catch (error) {
    console.warn('Não foi possível atualizar o espelho de emergência:', error);
  }
}

function loadEmergencyMirror(currentInstrumentVersion: string): FullAssessment | null {
  try {
    const raw = localStorage.getItem(EMERGENCY_MIRROR_KEY);
    if (!raw) return null;
    return sanitizeAssessment(JSON.parse(raw), currentInstrumentVersion, undefined, true);
  } catch {
    return null;
  }
}

export async function saveAssessment(assessment: FullAssessment): Promise<void> {
  const snapshot = cloneAssessment(assessment);
  // Espelho síncrono: protege inclusive a última alteração caso a aba seja fechada
  // antes de a fila assíncrona do IndexedDB terminar.
  saveEmergencyMirror(snapshot);
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      const previous = await getAssessmentByIdDirect(snapshot.metadata.id);
      if (previous) {
        try {
          await maybeCreateRecoverySnapshot(previous, snapshot);
        } catch (error) {
          console.warn('Não foi possível criar uma versão de recuperação:', error);
        }
      }
      await putAssessmentDirect(snapshot);
      scheduleExternalAutoBackup();
    });
  return writeQueue;
}

export async function getAssessmentById(id: string): Promise<FullAssessment | null> {
  return getAssessmentByIdDirect(id);
}

export async function listAssessments(): Promise<FullAssessment[]> {
  const db = await openDatabase();
  const transaction = db.transaction(ASSESSMENTS_STORE, 'readonly');
  const result = await requestToPromise(transaction.objectStore(ASSESSMENTS_STORE).getAll());
  return (result as FullAssessment[]).sort((a, b) => {
    const aTime = new Date(a.metadata.updatedAt || a.metadata.startedAt).getTime();
    const bTime = new Date(b.metadata.updatedAt || b.metadata.startedAt).getTime();
    return bTime - aTime;
  });
}

export function getUiPreferences(): UiPreferences {
  try {
    const raw = localStorage.getItem(UI_PREFERENCES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as UiPreferences;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function updateUiPreferences(patch: Partial<UiPreferences>): UiPreferences {
  const current = getUiPreferences();
  const updated: UiPreferences = { ...current, ...patch };
  try {
    localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Não foi possível salvar preferências da interface:', error);
  }
  return updated;
}

export function rememberQuestionForAssessment(assessmentId: string, questionId: number): void {
  const current = getUiPreferences();
  updateUiPreferences({
    currentQuestionByAssessment: {
      ...(current.currentQuestionByAssessment || {}),
      [assessmentId]: questionId,
    },
  });
}

export async function requestPersistentStorage(): Promise<StoragePersistenceStatus> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return 'unsupported';
    if (navigator.storage.persisted && (await navigator.storage.persisted())) return 'granted';
    return (await navigator.storage.persist()) ? 'granted' : 'not-granted';
  } catch {
    return 'not-granted';
  }
}

export async function getStoragePersistenceStatus(): Promise<StoragePersistenceStatus> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persisted) return 'unsupported';
    return (await navigator.storage.persisted()) ? 'granted' : 'not-granted';
  } catch {
    return 'not-granted';
  }
}

async function putAppState(key: string, value: unknown): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(APP_STATE_STORE, 'readwrite');
    transaction.objectStore(APP_STATE_STORE).put({ key, value } satisfies AppStateRecord);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Não foi possível salvar a configuração local.'));
    transaction.onabort = () => reject(transaction.error || new Error('A gravação da configuração local foi interrompida.'));
  });
}

async function getAppState<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  const transaction = db.transaction(APP_STATE_STORE, 'readonly');
  const result = await requestToPromise(transaction.objectStore(APP_STATE_STORE).get(key));
  if (!result) return null;
  return (result as AppStateRecord).value as T;
}

async function deleteAppState(key: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(APP_STATE_STORE, 'readwrite');
    transaction.objectStore(APP_STATE_STORE).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Não foi possível remover a configuração local.'));
    transaction.onabort = () => reject(transaction.error || new Error('A remoção da configuração local foi interrompida.'));
  });
}

type FileHandleLike = {
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
  queryPermission?: (options?: { mode: 'readwrite' }) => Promise<'granted' | 'denied' | 'prompt'>;
  requestPermission?: (options?: { mode: 'readwrite' }) => Promise<'granted' | 'denied' | 'prompt'>;
};

type FilePickerWindow = Window & {
  showSaveFilePicker?: (options?: Record<string, unknown>) => Promise<FileHandleLike>;
};

function supportsExternalAutoBackup(): boolean {
  return typeof window !== 'undefined' && typeof (window as FilePickerWindow).showSaveFilePicker === 'function';
}

function fullBackupContent(assessments: FullAssessment[]): string {
  return JSON.stringify(
    {
      schemaVersion: 'ciberinsight-full-backup-1',
      exportedAt: new Date().toISOString(),
      assessments,
    },
    null,
    2
  );
}

async function writeExternalBackup(handle: FileHandleLike, assessments: FullAssessment[]): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(fullBackupContent(assessments));
  await writable.close();
}

export async function getExternalAutoBackupStatus(): Promise<ExternalAutoBackupStatus> {
  if (!supportsExternalAutoBackup()) return 'unsupported';
  const handle = await getAppState<FileHandleLike>(EXTERNAL_BACKUP_HANDLE_KEY);
  if (!handle) return 'inactive';
  try {
    const permission = handle.queryPermission ? await handle.queryPermission({ mode: 'readwrite' }) : 'granted';
    return permission === 'granted' ? 'active' : 'permission-needed';
  } catch {
    return 'permission-needed';
  }
}

export async function enableExternalAutoBackup(): Promise<ExternalAutoBackupStatus> {
  if (!supportsExternalAutoBackup()) {
    throw new Error('O backup automático em arquivo não é suportado por este navegador. Use Chrome ou Edge no computador.');
  }

  const picker = (window as FilePickerWindow).showSaveFilePicker!;
  const handle = await picker({
    suggestedName: 'CiberInsight_autobackup.json',
    types: [
      {
        description: 'Backup do CiberInsight',
        accept: { 'application/json': ['.json'] },
      },
    ],
  });

  if (handle.requestPermission) {
    const permission = await handle.requestPermission({ mode: 'readwrite' });
    if (permission !== 'granted') throw new Error('A permissão para atualizar o arquivo de backup não foi concedida.');
  }

  await putAppState(EXTERNAL_BACKUP_HANDLE_KEY, handle);
  await writeExternalBackup(handle, await listAssessments());
  return 'active';
}

export async function authorizeExternalAutoBackup(): Promise<ExternalAutoBackupStatus> {
  const handle = await getAppState<FileHandleLike>(EXTERNAL_BACKUP_HANDLE_KEY);
  if (!handle) return 'inactive';
  if (handle.requestPermission) {
    const permission = await handle.requestPermission({ mode: 'readwrite' });
    if (permission !== 'granted') return 'permission-needed';
  }
  await writeExternalBackup(handle, await listAssessments());
  return 'active';
}

export async function disableExternalAutoBackup(): Promise<void> {
  await deleteAppState(EXTERNAL_BACKUP_HANDLE_KEY);
}

export async function syncExternalAutoBackup(): Promise<ExternalAutoBackupStatus> {
  const status = await getExternalAutoBackupStatus();
  if (status !== 'active') return status;
  const handle = await getAppState<FileHandleLike>(EXTERNAL_BACKUP_HANDLE_KEY);
  if (!handle) return 'inactive';
  await writeExternalBackup(handle, await listAssessments());
  return 'active';
}

let externalBackupTimer: number | null = null;
function scheduleExternalAutoBackup(): void {
  if (typeof window === 'undefined') return;
  if (externalBackupTimer !== null) window.clearTimeout(externalBackupTimer);
  externalBackupTimer = window.setTimeout(() => {
    externalBackupTimer = null;
    void syncExternalAutoBackup().catch((error) => {
      console.warn('Backup externo automático não pôde ser atualizado:', error);
    });
  }, 1500);
}

async function migrateLegacyLocalStorage(
  currentInstrumentVersion: string
): Promise<{ migratedCount: number; notice?: string }> {
  const candidates: FullAssessment[] = [];

  [LEGACY_STORAGE_KEY, LEGACY_BACKUP_KEY].forEach((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const assessment = sanitizeAssessment(
        parsed,
        currentInstrumentVersion,
        undefined,
        false
      );
      if (assessment) candidates.push(assessment);
    } catch {
      // Conteúdo legado inválido é ignorado; não impede a inicialização do novo armazenamento.
    }
  });

  const unique = new Map<string, FullAssessment>();
  candidates.forEach((assessment) => {
    const existing = unique.get(assessment.metadata.id);
    if (!existing) {
      unique.set(assessment.metadata.id, assessment);
      return;
    }
    const existingTime = new Date(existing.metadata.updatedAt).getTime();
    const candidateTime = new Date(assessment.metadata.updatedAt).getTime();
    if (candidateTime > existingTime) unique.set(assessment.metadata.id, assessment);
  });

  if (unique.size === 0) return { migratedCount: 0 };

  for (const assessment of unique.values()) {
    await putAssessmentDirect(assessment);
  }

  // Só remove os dados antigos depois que a migração para IndexedDB foi concluída com sucesso.
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_BACKUP_KEY);
  } catch {
    // Não é crítico: o novo armazenamento já contém as avaliações.
  }

  return {
    migratedCount: unique.size,
    notice: `${unique.size} avaliação(ões) da versão anterior foram migradas automaticamente para o histórico local.`,
  };
}

export async function initializeAssessmentStorage(
  currentInstrumentVersion: string,
  validQuestionIds: number[]
): Promise<AssessmentStorageBootstrapResult> {
  const preferences = getUiPreferences();
  void requestPersistentStorage();

  try {
    const migration = await migrateLegacyLocalStorage(currentInstrumentVersion);
    const validIds = new Set(validQuestionIds);
    let storedAssessments = await listAssessments();
    let emergencyNotice: string | undefined;
    const emergencyMirror = loadEmergencyMirror(currentInstrumentVersion);
    if (emergencyMirror) {
      const existing = storedAssessments.find((item) => item.metadata.id === emergencyMirror.metadata.id);
      if (!existing || (scoredAnswerCount(existing) === 0 && scoredAnswerCount(emergencyMirror) > 0)) {
        await putAssessmentDirect(emergencyMirror);
        storedAssessments = upsertAssessment(storedAssessments, emergencyMirror);
        emergencyNotice = `A avaliação ${emergencyMirror.metadata.id} foi recuperada automaticamente pelo espelho local de emergência.`;
      }
    }
    const allAssessments = storedAssessments.map((item) => {
      if (item.metadata.instrumentVersion !== currentInstrumentVersion) return item;
      return sanitizeAssessment(item, currentInstrumentVersion, validIds) || item;
    });
    const compatibleAssessments = allAssessments.filter(
      (item) => item.metadata.instrumentVersion === currentInstrumentVersion
    );

    let assessment: FullAssessment | null = null;
    if (preferences.currentAssessmentId) {
      assessment = compatibleAssessments.find(
        (item) => item.metadata.id === preferences.currentAssessmentId
      ) || null;
    }

    if (!assessment && compatibleAssessments.length > 0) {
      assessment = compatibleAssessments[0];
    }

    let notice = emergencyNotice || migration.notice;

    if (!assessment) {
      assessment = createNewAssessment(currentInstrumentVersion);
      await saveAssessment(assessment);
      allAssessments.unshift(assessment);
      if (!notice) {
        notice = 'Uma nova avaliação anônima foi criada e será mantida no armazenamento local deste navegador.';
      }
    }

    updateUiPreferences({ currentAssessmentId: assessment.metadata.id });

    return {
      assessment,
      assessments: sortAssessments(upsertAssessment(allAssessments, assessment)),
      preferences: getUiPreferences(),
      notice,
      migratedLegacyCount: migration.migratedCount,
    };
  } catch (error) {
    const assessment = createNewAssessment(currentInstrumentVersion);
    return {
      assessment,
      assessments: [assessment],
      preferences,
      notice: `Não foi possível inicializar o IndexedDB (${error instanceof Error ? error.message : 'erro desconhecido'}). A avaliação funcionará nesta sessão, mas gere um backup JSON antes de fechar o navegador.`,
    };
  }
}

export function upsertAssessment(
  assessments: FullAssessment[],
  assessment: FullAssessment
): FullAssessment[] {
  const next = assessments.filter((item) => item.metadata.id !== assessment.metadata.id);
  next.push(assessment);
  return sortAssessments(next);
}

export function sortAssessments(assessments: FullAssessment[]): FullAssessment[] {
  return [...assessments].sort((a, b) => {
    const aTime = new Date(a.metadata.updatedAt || a.metadata.startedAt).getTime();
    const bTime = new Date(b.metadata.updatedAt || b.metadata.startedAt).getTime();
    return bTime - aTime;
  });
}

export function exportAssessmentBackup(assessment: FullAssessment): string {
  return JSON.stringify(
    {
      schemaVersion: 'assessment-backup-1',
      exportedAt: new Date().toISOString(),
      instrumentVersion: assessment.metadata.instrumentVersion,
      assessment,
    },
    null,
    2
  );
}

export function importAssessmentBackup(
  content: string,
  currentInstrumentVersion: string,
  validQuestionIds: number[]
): FullAssessment {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('O arquivo selecionado não contém um JSON válido.');
  }

  const validIds = new Set(validQuestionIds);
  const candidate = parsed as Record<string, unknown>;

  // Formato de backup próprio.
  if (candidate && typeof candidate === 'object' && candidate.schemaVersion === 'assessment-backup-1') {
    const assessment = sanitizeAssessment(candidate.assessment, currentInstrumentVersion, validIds);
    if (!assessment) {
      throw new Error('O backup pertence a outra versão do instrumento ou possui estrutura incompatível.');
    }
    return assessment;
  }

  // Exportação operacional: reconstrói a avaliação a partir da lista de respostas.
  if (candidate && typeof candidate === 'object' && Array.isArray(candidate.answers)) {
    const assessmentRaw = candidate.assessment;
    if (!assessmentRaw || typeof assessmentRaw !== 'object') {
      throw new Error('A exportação não contém metadados suficientes para restauração.');
    }

    const metadata = assessmentRaw as Record<string, unknown>;
    const answersObject: Record<number, unknown> = {};
    candidate.answers.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const item = entry as Record<string, unknown>;
      const questionId = Number(item.questionId);
      if (!Number.isInteger(questionId) || !validIds.has(questionId)) return;
      answersObject[questionId] = item;
    });

    const reconstructed = sanitizeAssessment(
      {
        metadata: {
          id: metadata.id,
          label: metadata.label,
          instrumentVersion:
            typeof metadata.instrumentVersion === 'string'
              ? metadata.instrumentVersion
              : currentInstrumentVersion,
          startedAt: metadata.startedAt,
          updatedAt: metadata.updatedAt,
          completedAt: metadata.completedAt,
        },
        answers: answersObject,
      },
      currentInstrumentVersion,
      validIds
    );

    if (!reconstructed) {
      throw new Error('A exportação pertence a outra versão do instrumento ou possui estrutura incompatível.');
    }
    return reconstructed;
  }

  // Compatibilidade: aceita uma FullAssessment direta.
  const direct = sanitizeAssessment(parsed, currentInstrumentVersion, validIds);
  if (direct) return direct;

  throw new Error('O arquivo não corresponde a um backup/exportação compatível deste instrumento.');
}

export function importAssessmentBackupCollection(
  content: string,
  currentInstrumentVersion: string,
  validQuestionIds: number[]
): FullAssessment[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('O arquivo selecionado não contém um JSON válido.');
  }

  if (parsed && typeof parsed === 'object') {
    const candidate = parsed as Record<string, unknown>;
    if (candidate.schemaVersion === 'ciberinsight-full-backup-1' && Array.isArray(candidate.assessments)) {
      const validIds = new Set(validQuestionIds);
      const unique = new Map<string, FullAssessment>();
      candidate.assessments.forEach((raw) => {
        const assessment = sanitizeAssessment(raw, currentInstrumentVersion, validIds);
        if (assessment) unique.set(assessment.metadata.id, assessment);
      });
      const assessments = sortAssessments([...unique.values()]);
      if (assessments.length === 0) {
        throw new Error('O backup automático não contém avaliações compatíveis com esta versão do instrumento.');
      }
      return assessments;
    }
  }

  return [importAssessmentBackup(content, currentInstrumentVersion, validQuestionIds)];
}

