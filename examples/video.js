// Waveform for a video

/*
<html>
  <video
    src="/examples/audio/modular.mp4"
    controls
    playsinline
    style="width: 100%; max-width: 600px; margin: 0 auto; display: block;"
  />
</html>
*/

import WaveSurfer from 'wavesurfer.js'

const ws = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  media: document.querySelector('video'),
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(ws)

const waveformCard = WS.WaveformContainer.create(ws)
WS.PlayerBar.create(ws)
WS.InfoPanel.create(ws, waveformCard.getCard())
