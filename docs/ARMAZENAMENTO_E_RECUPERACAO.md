# Armazenamento e recuperação

O CiberInsight é local-first. A versão 0.5.1 adiciona redundância sem transformar cópias técnicas em avaliações reais.

## Camadas

1. **IndexedDB** — fonte principal das avaliações e do histórico normal.
2. **Espelho de emergência em localStorage** — guarda a avaliação mais recentemente alterada e é atualizado de forma síncrona.
3. **Versões internas de recuperação** — até cinco snapshots por avaliação, armazenados em um object store separado.
4. **Persistent Storage API** — é solicitada quando suportada pelo navegador para reduzir a possibilidade de descarte automático do armazenamento local.
5. **Backup automático externo opcional** — um único arquivo JSON escolhido pelo usuário e sobrescrito automaticamente com o conjunto de avaliações.

## Comparação

Somente registros do object store principal `assessments` aparecem em **Avaliações** e podem ser selecionados para comparação. Snapshots de recuperação ficam em `recoverySnapshots` e só são exibidos quando o usuário escolhe **Recuperar versão anterior**.

## Rotação

Cada avaliação mantém no máximo cinco snapshots. Uma nova alteração de pontuação protege a versão anterior; reduções no número de respostas geram um snapshot protetivo. Alterações sem mudança de pontuação podem gerar um snapshot periódico quando necessário.

## Backup externo

O arquivo externo usa o schema `ciberinsight-full-backup-1` e contém todas as avaliações reais do histórico. O mesmo arquivo é atualizado; portanto, a função não cria múltiplos backups no diretório do usuário.

O arquivo pode ser importado pela própria tela **Avaliações → Importar backup**.
