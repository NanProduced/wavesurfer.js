import WaveSurfer from 'wavesurfer.js'

const pitchWorker = new Worker('/examples/pitch-worker.js', { type: 'module' })

const wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: 'rgba(200, 200, 200, 0.5)',
  progressColor: 'rgba(100, 100, 100, 0.5)',
  url: '/examples/audio/librivox.mp3',
  minPxPerSec: 200,
  sampleRate: 11025,
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(wavesurfer)

const waveformCard = WS.WaveformContainer.create(wavesurfer)
WS.PlayerBar.create(wavesurfer)
WS.InfoPanel.create(wavesurfer, waveformCard.getCard())

wavesurfer.on('decode', () => {
  const peaks = wavesurfer.getDecodedData().getChannelData(0)
  pitchWorker.postMessage({ peaks, sampleRate: wavesurfer.options.sampleRate })
})

pitchWorker.onmessage = (e) => {
  const { frequencies, baseFrequency } = e.data

  const pitchUpColor = '#385587'
  const pitchDownColor = '#C26351'
  const height = 100

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = frequencies.length
  canvas.height = height
  canvas.style.width = '100%'
  canvas.style.height = '100%'

  const pointSize = devicePixelRatio
  let prevY = 0
  frequencies.forEach((frequency, index) => {
    if (!frequency) return
    const y = Math.round(height - (frequency / (baseFrequency * 2)) * height)
    ctx.fillStyle = y > prevY ? pitchDownColor : pitchUpColor
    ctx.fillRect(index, y, pointSize, pointSize)
    prevY = y
  })

  wavesurfer.renderer.getWrapper().appendChild(canvas)
  wavesurfer.once('load', () => canvas.remove())
}

wavesurfer.on('interaction', () => {
  if (!wavesurfer.isPlaying()) wavesurfer.play()
})

{
  const dropArea = document.querySelector('#drop')
  dropArea.ondragenter = (e) => {
    e.preventDefault()
    e.target.classList.add('over')
  }
  dropArea.ondragleave = (e) => {
    e.preventDefault()
    e.target.classList.remove('over')
  }
  dropArea.ondragover = (e) => {
    e.preventDefault()
  }
  dropArea.ondrop = (e) => {
    e.preventDefault()
    e.target.classList.remove('over')

    const reader = new FileReader()
    reader.onload = (event) => {
      wavesurfer.load(event.target.result)
    }
    reader.readAsDataURL(e.dataTransfer.files[0])

    dropArea.textContent = e.dataTransfer.files[0].name
    wavesurfer.empty()
  }
  document.body.ondrop = (e) => {
    e.preventDefault()
  }
}

/*
<html>
<style>
#drop {
  height: 128px;
  border: 4px dashed #999;
  margin: 2em 0;
  text-align:center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
#drop.over {
  border-color: #333;
}
</style>

<p align="right">Audio from <a href="https://librivox.org/">LibriVox</a></p>
<div id="waveform"></div>
<div id="drop">Drag-n-drop your own audio file</div>
</html>
*/
