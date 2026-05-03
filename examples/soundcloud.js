// Soundcloud-style player

import WaveSurfer from 'wavesurfer.js'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.35)
gradient.addColorStop(0, '#656666')
gradient.addColorStop((canvas.height * 0.7) / canvas.height, '#656666')
gradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff')
gradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff')
gradient.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#B1B1B1')
gradient.addColorStop(1, '#B1B1B1')

const progressGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.35)
progressGradient.addColorStop(0, '#EE772F')
progressGradient.addColorStop((canvas.height * 0.7) / canvas.height, '#EB4926')
progressGradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff')
progressGradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff')
progressGradient.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#F6B094')
progressGradient.addColorStop(1, '#F6B094')

const wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: gradient,
  progressColor: progressGradient,
  barWidth: 2,
  url: '/examples/audio/audio.wav',
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(wavesurfer)

const waveformCard = WS.WaveformContainer.create(wavesurfer)
WS.PlayerBar.create(wavesurfer)
WS.InfoPanel.create(wavesurfer, waveformCard.getCard())

wavesurfer.on('interaction', () => {
  wavesurfer.playPause()
})

{
  const hover = document.querySelector('#hover')
  const waveform = document.querySelector('#waveform')
  waveform.addEventListener('pointermove', (e) => (hover.style.width = `${e.offsetX}px`))
}

{
  const timeEl = document.querySelector('#time')
  const durationEl = document.querySelector('#duration')
  wavesurfer.on('decode', (duration) => {
    const mins = Math.floor(duration / 60)
    const secs = Math.round(duration) % 60
    durationEl.textContent = `${mins}:${String(secs).padStart(2, '0')}`
  })
  wavesurfer.on('timeupdate', (currentTime) => {
    const mins = Math.floor(currentTime / 60)
    const secs = Math.round(currentTime) % 60
    timeEl.textContent = `${mins}:${String(secs).padStart(2, '0')}`
  })
}

/*
<html>
  <style>
    #waveform {
      cursor: pointer;
      position: relative;
    }
    #hover {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 10;
      pointer-events: none;
      height: 100%;
      width: 0;
      mix-blend-mode: overlay;
      background: rgba(255, 255, 255, 0.5);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    #waveform:hover #hover {
      opacity: 1;
    }
    #time,
    #duration {
      position: absolute;
      z-index: 11;
      top: 50%;
      margin-top: -1px;
      transform: translateY(-50%);
      font-size: 11px;
      background: rgba(0, 0, 0, 0.75);
      padding: 2px;
      color: #ddd;
    }
    #time {
      left: 0;
    }
    #duration {
      right: 0;
    }
  </style>
  <div id="waveform">
    <div id="time">0:00</div>
    <div id="duration">0:00</div>
    <div id="hover"></div>
  </div>
</html>
*/
