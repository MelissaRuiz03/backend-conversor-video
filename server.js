const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn, execFile } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { validateVideo } = require('./validation');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3000;
const YTDLP_PATH = path.join(__dirname, 'bin', 'yt-dlp');
const COOKIES_PATH = process.env.YTDLP_COOKIES_PATH || path.join(__dirname, 'cookies.txt');
const cookiesArgs = fs.existsSync(COOKIES_PATH) ? ['--cookies', COOKIES_PATH] : [];

const YOUTUBE_URL_REGEX = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'yt-to-mp3-backend' });
});

const MAX_DURATION_SECONDS = 20 * 60;

function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    execFile(
      YTDLP_PATH,
      ['--dump-json', '--no-playlist', '--no-warnings', ...cookiesArgs, url],
      { maxBuffer: 10 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(err);
        try {
          resolve(JSON.parse(stdout));
        } catch (parseErr) {
          reject(parseErr);
        }
      }
    );
  });
}

app.post('/convert', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Envie a URL do vídeo no campo "url".' });
  }

  if (!YOUTUBE_URL_REGEX.test(url)) {
    return res.status(400).json({ error: 'URL do YouTube inválida.' });
  }

  try {
    const info = await getVideoInfo(url);

    const validation = validateVideo(
      { isLiveContent: info.is_live, lengthSeconds: info.duration },
      MAX_DURATION_SECONDS
    );
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const safeTitle = (info.title || 'audio')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .slice(0, 80) || 'audio';

    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    const ytdlpProcess = spawn(YTDLP_PATH, [
      '-f', 'bestaudio',
      '--no-playlist',
      '--no-warnings',
      ...cookiesArgs,
      '-o', '-',
      url,
    ]);

    ytdlpProcess.on('error', (err) => {
      console.error('Erro ao iniciar yt-dlp:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Falha ao iniciar o download do vídeo.' });
      }
    });

    ffmpeg(ytdlpProcess.stdout)
      .audioBitrate(128)
      .format('mp3')
      .on('error', (err) => {
        console.error('Erro na conversão:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Falha ao converter o áudio.' });
        } else {
          res.end();
        }
      })
      .pipe(res, { end: true });
  } catch (err) {
    console.error('Erro ao processar vídeo:', err.message);
    res.status(500).json({ error: 'Não foi possível processar esse vídeo. Verifique a URL e tente novamente.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
