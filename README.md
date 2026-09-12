<div align="center">
  <img src="public/ciberinsight-favicon-256.png" alt="CiberInsight" width="128" />

# CiberInsight

**Autoavaliação do nível de implementação de controles de segurança cibernética em clínicas de diagnóstico por imagem**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.5.0-blue.svg)](CHANGELOG.md)

</div>

## Sobre

O **CiberInsight** é uma aplicação web **local-first** criada para operacionalizar um instrumento estruturado de autoavaliação de controles de segurança cibernética no contexto de clínicas de diagnóstico por imagem.

O instrumento utiliza o **NIST Cybersecurity Framework (NIST CSF)** como referência estruturante, considera o contexto brasileiro de proteção de dados associado à **LGPD** e utiliza referências complementares documentadas no próprio instrumento.

A proposta não é substituir pentest, auditoria independente, avaliação formal de risco ou certificação. O sistema procura tornar a avaliação de controles mais estruturada, rastreável e útil para identificação de lacunas e acompanhamento de evolução.

## Principais características

- 93 questões distribuídas em nove dimensões;
- escala de implementação de **Nível 0 a Nível 3**;
- opções **NS** (informação/evidência insuficiente) e **NA** (não aplicável);
- guias de verificação e evidências esperadas;
- guias e materiais de apoio para evolução dos controles;
- resultados por dimensão e visão consolidada;
- distribuição N0/N1/N2/N3/NS/NA;
- mapa de implementação (heatmap);
- matriz dimensão × níveis;
- identificação automática de controles em Nível 0 e Nível 1;
- histórico local e comparação entre avaliações;
- geração de relatório para impressão/PDF;
- backup/importação em JSON;
- funcionamento sem conta, servidor de aplicação ou banco em nuvem.

## Arquitetura local-first

```text
Navegador
   |
   +-- IndexedDB   -> avaliações e histórico
   |
   +-- localStorage -> preferências leves da interface
   |
   +-- JSON         -> backup e portabilidade manual
```

Nenhuma transmissão externa dos dados da avaliação é necessária para o funcionamento atual da aplicação.

> **Importante:** dados armazenados no navegador podem ser removidos pelo próprio usuário/navegador. Para avaliações importantes, utilize também o backup JSON.

## O que o resultado significa

O índice apresentado pelo CiberInsight representa o **nível de implementação dos controles avaliados segundo o instrumento**.

Ele **não deve ser interpretado** como:

- percentual absoluto de segurança da organização;
- classificação formal de risco;
- certificação;
- garantia de conformidade integral com a LGPD;
- nível oficial de maturidade do NIST CSF;
- garantia de ausência de vulnerabilidades ou incidentes.

Somente respostas numéricas **0–3** participam do índice. **NS, NA e questões não respondidas não são convertidos em zero**.

## Privacidade

O projeto foi pensado com minimização de dados e uso local.

Evite registrar nos campos livres:

- dados de pacientes;
- credenciais;
- endereços IP;
- nomes de servidores;
- segredos internos;
- outras informações sensíveis desnecessárias.

## Tecnologias

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- IndexedDB / Web Storage APIs

## Requisitos

- Node.js compatível com o Vite 6 (recomendado Node.js 20 ou superior)
- npm
- navegador moderno

## Executar localmente

```bash
npm install
npm run dev
```

O Vite exibirá o endereço local da aplicação no terminal.

## Validar o instrumento

```bash
npm run validate:instrument
```

A validação confere, entre outros pontos, a presença das 93 questões e a consistência dos guias e materiais vinculados.

## Compilar para produção

```bash
npm run build
npm run preview
```

## Estrutura principal

```text
src/
  components/    interface e componentes da avaliação
  data/          instrumento, guias, glossário e materiais estruturados
  services/      scoring, armazenamento, comparação, validação e exportação
  types/         tipos TypeScript
public/
  resources/     materiais auxiliares vinculados às questões
scripts/
  validate-project.mjs
docs/
  guias complementares
```

A fonte canônica das perguntas e critérios é:

```text
src/data/instrumento.json
```

## Status do projeto

A versão atual é **0.5.0**, ainda em consolidação acadêmica e técnica.

Antes da aplicação formal do estudo, recomenda-se congelar a versão utilizada (por exemplo `v1.0.0`) para manter a reprodutibilidade dos resultados.

## Citação

O repositório possui um arquivo [`CITATION.cff`](CITATION.cff). Quando publicado no GitHub, a plataforma poderá exibir a opção **Cite this repository**.

## Licença

Este software é disponibilizado sob a [MIT License](LICENSE).

## Autor

**Tiago Pimenta**

Projeto desenvolvido no contexto de pesquisa acadêmica em segurança cibernética aplicada a clínicas de diagnóstico por imagem.

## Deploy no Vercel

O repositório inclui [`vercel.json`](vercel.json) com configuração de build e headers básicos de segurança. Veja o passo a passo em [`DEPLOY_VERCEL.md`](DEPLOY_VERCEL.md).

### Persistência por origem

O armazenamento local do navegador é vinculado à origem do site. Portanto, avaliações criadas em `localhost`, em um endereço `*.vercel.app` ou em um futuro domínio próprio não migram automaticamente entre essas origens. O backup JSON permanece a forma recomendada de portabilidade e cópia externa.

O CiberInsight não requer analytics, banco de dados ou serviços de rastreamento para funcionar.

## Proteção contra perda de dados

A partir da versão 0.5.1, o CiberInsight utiliza camadas adicionais de proteção sem misturar cópias técnicas com o histórico de avaliações:

- cada alteração continua sendo salva no IndexedDB;
- a alteração mais recente também é espelhada no `localStorage` para recuperação de emergência;
- são mantidas até **5 versões internas de recuperação por avaliação** em um object store separado;
- versões de recuperação **não aparecem na lista de Avaliações e não participam do comparativo**;
- a aplicação solicita armazenamento persistente ao navegador quando suportado;
- opcionalmente, o usuário pode escolher **um único arquivo externo** (`CiberInsight_autobackup.json`), que é sobrescrito automaticamente com todas as avaliações. Esse arquivo não cria novas avaliações e não gera uma sequência de downloads.

O backup externo é especialmente útil contra perda causada por remoção do navegador ou limpeza dos dados do site, porque o arquivo permanece fora do armazenamento do navegador. A ativação depende da File System Access API, atualmente melhor suportada em Chrome e Edge para desktop.
