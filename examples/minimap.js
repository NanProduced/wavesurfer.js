// Minimap plugin

import WaveSurfer from 'wavesurfer.js'
import Minimap from 'wavesurfer.js/dist/plugins/minimap.esm.js'

const ws = WaveSurfer.create({
  container: '#waveform',
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio/audio.wav',
  minPxPerSec: 100,
  hideScrollbar: true,
  autoCenter: false,
  plugins: [
    Minimap.create({
      height: 20,
      waveColor: '#ddd',
      progressColor: '#999',
    }),
  ],
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(ws)

const waveformCard = WS.WaveformContainer.create(ws)
WS.PlayerBar.create(ws)
WS.InfoPanel.create(ws, waveformCard.getCard())

ws.on('interaction', () => {
  ws.play()
})

/*
<html>
  <div id="waveform"></div>
  <p>
    📖 <a href="https://wavesurfer.xyz/docs/classes/plugins_minimap.MinimapPlugin">Minimap plugin docs</a>
  </p>
</html>
*/
