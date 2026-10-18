# Conversor de Arquivos Ruiz — API (Backend)

API em Node.js/Express que recebe o link de um vídeo do YouTube e devolve
um arquivo MP3 pronto para download, convertido na hora, sem salvar nada
em disco.

🔗 API no ar: https://backend-conversor-video-1.onrender.com
🔗 Frontend (React): https://github.com/MelissaRuiz03/frontend-conversor-video

## Endpoints

```
GET  /          → health-check, retorna { status: "ok" }
POST /convert    → body { "url": "https://www.youtube.com/watch?v=..." }
                   resposta: stream de áudio (audio/mpeg), como download
```

Regras de validação antes de converter:
- Rejeita URLs que não são do YouTube.
- Rejeita transmissões ao vivo.
- Rejeita vídeos acima de 20 minutos (configurável em `server.js`, `MAX_DURATION_SECONDS`).

## Como rodar

```bash
npm install
npm start
```

Acesse `http://localhost:3000`. O `npm install` baixa automaticamente o
binário do `yt-dlp` (ver seção "Decisões técnicas" abaixo) via script
`postinstall` — não precisa instalar nada manualmente.

## Como rodar com Docker

```bash
docker build -t backend-conversor .
docker run -p 3000:3000 backend-conversor
```

## Como testar a regra de negócio

```bash
npm test
```

A regra de bloqueio (lives e vídeos acima de 20 minutos) está isolada em
`validation.js` como função pura, sem depender de rede — por isso o teste
em `validation.test.js` roda em milissegundos. Pra confirmar que o teste
pega erro de verdade, quebre a regra de propósito (ex.: troque `>` por `<`
em `validation.js`), rode `npm test` de novo e veja `not ok` aparecer.

## Decisões técnicas

- **`yt-dlp` em vez de uma biblioteca JS (`ytdl-core`).** A primeira versão
  usava `@distube/ytdl-core`, mas ela parou de conseguir extrair os
  formatos de áudio do player atual do YouTube (erro: "Failed to find any
  playable formats"), mesmo na versão mais recente do pacote — um problema
  recorrente nesse tipo de biblioteca JS, porque o YouTube muda o código do
  player com frequência de propósito pra dificultar esse tipo de extração.
  Troquei pelo `yt-dlp` (binário standalone, chamado via `child_process`),
  que é mantido por uma comunidade grande e atualizado com muito mais
  frequência justamente pra acompanhar essas mudanças. O binário não vai
  pro git (está no `.gitignore`); o script `postinstall`
  (`scripts/ensure-ytdlp.js`) baixa ele automaticamente depois do
  `npm install`, tanto local quanto no deploy.
- **Imagem Docker `node:20` (Debian), não `node:20-alpine`.** O Alpine usa
  musl libc; os binários do `ffmpeg-static` e do `yt-dlp` são compilados
  pra glibc e não funcionam nele — testado e confirmado nesse projeto.
- **Sem banco de dados.** O projeto não guarda estado entre requisições —
  cada conversão é um pedido isolado (recebe URL, devolve arquivo).
- **Bloqueio rígido para lives e vídeos acima de 20 minutos**, decidido
  antes de gastar banda/CPU com download e conversão.
- **Streaming direto, sem salvar arquivo em disco.** O áudio do YouTube é
  convertido "em trânsito" (`yt-dlp` → `ffmpeg` → resposta HTTP) usando
  `pipe()`. Isso evita lotar o disco do servidor com arquivos temporários
  no plano free de hospedagem.
- **O que eu faria diferente com mais tempo:** fila de processamento (ex.
  BullMQ + Redis) para não travar o servidor se várias pessoas converterem
  ao mesmo tempo, e cache dos vídeos mais convertidos para não reprocessar
  o mesmo link repetidamente.

## Uso responsável

Este projeto é um estudo pessoal de portfólio. Converta apenas vídeos sobre
os quais você tem direito de uso (vídeos próprios, conteúdo com licença
Creative Commons ou domínio público). Converter músicas de terceiros sem
autorização pode violar direitos autorais e os Termos de Uso do YouTube.

## Stack

Node.js · Express · `yt-dlp` (binário) · `fluent-ffmpeg` · `ffmpeg-static` · `cors` · `node:test`
