# Segurança e privacidade

## Modelo local-first

O CiberInsight foi projetado para funcionar sem servidor de aplicação, login ou banco de dados em nuvem. As avaliações permanecem no navegador do usuário, com persistência local em IndexedDB e preferências leves em localStorage.

## Dados sensíveis

Não utilize os campos de evidência/observação para registrar dados de pacientes, credenciais, endereços IP, nomes de servidores ou outras informações sensíveis desnecessárias.

Arquivos JSON exportados podem conter o conteúdo preenchido pelo usuário e devem ser tratados como backups locais potencialmente sensíveis.

## Relato de vulnerabilidades

Ao relatar um problema de segurança no repositório, não publique credenciais, dados reais de pacientes, backups de avaliações ou detalhes internos de uma organização. Prefira uma descrição reproduzível usando dados fictícios.
