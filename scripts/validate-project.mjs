import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const instrument = readJson('src/data/instrumento.json');
const verification = readJson('src/data/verificationGuidance.json');
const guidance = readJson('src/data/controlGuidance.json');

const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

assert(instrument.questions.length === 93, `Esperadas 93 questões; encontradas ${instrument.questions.length}.`);
const ids = instrument.questions.map((q) => q.id).sort((a,b) => a-b);
assert(ids.every((id, i) => id === i + 1), 'IDs das questões devem formar a sequência Q1-Q93 sem lacunas.');

for (const q of instrument.questions) {
  const levels = Object.keys(q.criteria || {}).sort();
  assert(JSON.stringify(levels) === JSON.stringify(['0','1','2','3']), `Q${q.id}: critérios 0-3 incompletos.`);
  const relatedIds = q.relatedQuestionIds || [];
  assert(relatedIds.length > 0, `Q${q.id}: nenhum controle relacionado cadastrado.`);
  assert(!relatedIds.includes(q.id), `Q${q.id}: não pode referenciar a própria questão como relacionada.`);
  assert(new Set(relatedIds).size === relatedIds.length, `Q${q.id}: controles relacionados duplicados.`);
  for (const relatedId of relatedIds) {
    assert(ids.includes(relatedId), `Q${q.id}: controle relacionado Q${relatedId} não existe.`);
  }
}
assert(Object.keys(verification).length === 93, 'verificationGuidance.json deve conter 93 entradas.');
assert(Object.keys(guidance).length === 93, 'controlGuidance.json deve conter 93 entradas.');

let materialLinks = 0;
for (const [qid, item] of Object.entries(guidance)) {
  for (const resource of item.practicalResources || []) {
    if (resource.sourceType === 'instrument' && resource.file) {
      materialLinks += 1;
      const filePath = path.join(root, 'public', resource.file.replace(/^\//, ''));
      assert(fs.existsSync(filePath), `Q${qid}: material ausente: ${resource.file}`);
    }
    assert(!String(resource.id || '').startsWith('nist-csf-20-q'), `Q${qid}: referência genérica NIST CSF repetida no guia.`);
    assert(!String(resource.id || '').startsWith('nist-sp1300-por-q'), `Q${qid}: referência genérica NIST SP 1300 repetida no guia.`);
  }
}
assert(materialLinks === 358, `Esperados 358 materiais individuais vinculados; encontrados ${materialLinks}.`);
assert(!fs.existsSync(path.join(root, 'src/data/instrumento.refinado.json')), 'instrumento.refinado.json não deve coexistir com a fonte canônica instrumento.json.');

const scoringSource = fs.readFileSync(path.join(root, 'src/services/scoring.ts'), 'utf8');
assert(scoringSource.includes('if (!isNumericScoreValue(answer.score)) return;'), 'Regra de exclusão de NS/NA do índice foi alterada ou não encontrada.');

if (errors.length) {
  console.error('VALIDAÇÃO FALHOU');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Validação estrutural OK');
console.log(`- Questões: ${instrument.questions.length}`);
console.log(`- Guias de verificação: ${Object.keys(verification).length}`);
console.log(`- Guias de evolução: ${Object.keys(guidance).length}`);
console.log(`- Materiais individuais vinculados: ${materialLinks}`);
console.log('- Relações entre controles: cadastradas para Q1-Q93.');
console.log('- Fonte canônica: src/data/instrumento.json');
console.log('- Sem referências genéricas NIST CSF/SP1300 repetidas nos recursos por questão.');
console.log('- Sem alteração da regra metodológica: NS/NA continuam fora do índice numérico.');
