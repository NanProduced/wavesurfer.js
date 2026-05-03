// Hover plugin

import WaveSurfer from 'wavesurfer.js'
import Hover from 'wavesurfer.js/dist/plugins/hover.esm.js'

const ws = WaveSurfer.create({
  container: '#waveform',
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio/audio.wav',
  plugins: [
    Hover.create({
      lineColor: '#ff0000',
      lineWidth: 2,
      labelBackground: '#555',
      labelColor: '#fff',
      labelSize: '11px',
      labelPreferLeft: false,
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
  <style>
    #waveform ::part(hover-label):before {
      content: '⏱️ ';
    }
  </style>

  <div id="waveform"></div>

  <p>
    📖 <a href="https://wavesurfer.xyz/docs/classes/plugins_hover.HoverPlugin">Hover plugin docs</a>
  </p>
</html>
*/
