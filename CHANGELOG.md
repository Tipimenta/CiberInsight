# Changelog


## Preparação para deploy no Vercel — 2026-09-08

- adicionado `vercel.json` com build Vite e headers básicos de segurança;
- adicionado aviso de privacidade local na primeira utilização;
- documentada a persistência por origem e a necessidade de backup JSON;
- adicionado `DEPLOY_VERCEL.md`;
- definido Node.js 20+ como ambiente recomendado para build;
- adicionados `theme-color` e `apple-touch-icon`;
- nenhuma alteração na metodologia, no scoring ou nas 93 questões.

Todas as mudanças relevantes do CiberInsight serão registradas neste arquivo.

O projeto segue numeração semântica de versões quando uma versão for formalmente publicada.

## [0.5.1] - 2026-09-12

### Proteção de dados
- adicionado espelho síncrono de emergência no `localStorage`;
- adicionadas até 5 versões internas de recuperação por avaliação, separadas do histórico normal;
- versões de recuperação não aparecem no comparativo;
- solicitação de armazenamento persistente do navegador quando suportado;
- adicionado backup externo automático opcional em um único arquivo JSON, sobrescrito com o histórico real de avaliações;
- importação passa a reconhecer também o backup completo automático;
- exibido horário do último salvamento no cabeçalho;
- nenhuma alteração nas 93 questões, critérios, scoring ou regra de NS/NA.

## [0.5.0] - 2026-09-08

### Adicionado
- Identidade **CiberInsight** e favicon próprio.
- Instrumento com 93 questões organizado em nove dimensões.
- Guias de verificação e guias de evolução vinculados às questões.
- Armazenamento local-first com histórico de avaliações em IndexedDB.
- Exportação/importação de backup JSON para portabilidade.
- Comparação entre avaliações.
- Resultados com indicadores, barras por dimensão, distribuição de níveis, heatmap, matriz e lista de controles em níveis inferiores.
- Geração de relatório para impressão/PDF, com comparação opcional.
- Autoavanço de questões com indicação visual.

### Observação
Esta é uma versão de desenvolvimento/pré-lançamento. A versão utilizada formalmente no estudo deverá ser congelada e identificada por uma tag/release específica antes da aplicação oficial.
