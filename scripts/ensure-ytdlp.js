const https = require('https');
const fs = require('fs');
const path = require('path');

const BIN_PATH = path.join(__dirname, '..', 'bin', 'yt-dlp');
const DOWNLOAD_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

function download(url, dest, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirectsLeft === 0) return reject(new Error('Muitos redirecionamentos.'));
        res.resume();
        return resolve(download(res.headers.location, dest, redirectsLeft - 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download falhou com status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  if (fs.existsSync(BIN_PATH)) {
    console.log('yt-dlp já existe em bin/, pulando download.');
    return;
  }

  fs.mkdirSync(path.dirname(BIN_PATH), { recursive: true });
  console.log('Baixando yt-dlp...');
  try {
    await download(DOWNLOAD_URL, BIN_PATH);
    fs.chmodSync(BIN_PATH, 0o755);
    console.log('yt-dlp baixado e pronto em bin/yt-dlp');
  } catch (err) {
    console.error('Falha ao baixar yt-dlp:', err.message);
    console.error('A conversão não vai funcionar até isso ser resolvido.');
  }
})();
