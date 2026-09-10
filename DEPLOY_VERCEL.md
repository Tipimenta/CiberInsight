# Deploy do CyberInsight no Vercel

## Caminho recomendado

1. Publique primeiro o repositório no GitHub.
2. No Vercel, escolha **Add New Project**.
3. Importe o repositório `Tipimenta/CyberInsight`.
4. O projeto usa Vite. O arquivo `vercel.json` já informa:
   - build: `npm run build`
   - saída: `dist`
5. Faça o deploy.

Não é necessário configurar banco de dados, API ou variáveis de ambiente para o funcionamento atual.

## Teste obrigatório depois do deploy

No endereço definitivo do Vercel:

1. crie uma nova avaliação;
2. responda algumas questões;
3. feche a aba/navegador;
4. abra novamente o mesmo endereço e confirme a persistência;
5. conclua uma avaliação;
6. gere o relatório e teste `Imprimir / Salvar como PDF`;
7. crie outra avaliação e teste o comparativo;
8. exporte um backup JSON;
9. importe esse backup em outro navegador/perfil para validar a portabilidade.

## Importante sobre armazenamento local

O CyberInsight é **local-first**. As avaliações são armazenadas no `IndexedDB` da origem do site.

Na prática:

- dados de `localhost` não aparecem automaticamente no endereço do Vercel;
- dados de `seu-projeto.vercel.app` não migram automaticamente para um domínio próprio futuro;
- outro navegador ou outro computador possui outro armazenamento local;
- limpar os dados do site pode apagar o histórico local.

Por isso, mantenha o backup JSON para avaliações importantes.

## Privacidade

Na arquitetura atual, o CyberInsight não precisa enviar respostas das avaliações para banco, API ou servidor de aplicação. O deploy hospeda os arquivos estáticos da aplicação.

Não configure ferramentas de analytics ou rastreamento sem reavaliar a documentação de privacidade do projeto.

## Headers de segurança

O `vercel.json` inclui headers básicos e conservadores:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` desabilitando câmera, microfone, geolocalização, pagamento e USB

Uma Content Security Policy (CSP) rígida não foi adicionada nesta etapa para evitar quebrar recursos do frontend/relatório sem uma rodada específica de testes.
