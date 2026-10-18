function validateVideo(videoDetails, maxDurationSeconds) {
  if (videoDetails.isLiveContent) {
    return { ok: false, error: 'Não é possível converter transmissões ao vivo.' };
  }

  const durationSeconds = Number(videoDetails.lengthSeconds);
  if (durationSeconds > maxDurationSeconds) {
    const maxMinutes = maxDurationSeconds / 60;
    return { ok: false, error: `Vídeos acima de ${maxMinutes} minutos não são suportados.` };
  }

  return { ok: true };
}

module.exports = { validateVideo };
