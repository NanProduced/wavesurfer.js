// Record plugin

import WaveSurfer from 'wavesurfer.js'
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js'

let wavesurfer, record
let scrollingWaveform = false
let continuousWaveform = true

const createWaveSurfer = () => {
  if (wavesurfer) {
    wavesurfer.destroy()
  }

  wavesurfer = WaveSurfer.create({
    container: '#mic',
    waveColor: 'rgb(200, 0, 200)',
    progressColor: 'rgb(100, 0, 100)',
  })

  window.__ws_instances = window.__ws_instances || []
  window.__ws_instances.push(wavesurfer)

  record = wavesurfer.registerPlugin(
    RecordPlugin.create({
      renderRecordedAudio: false,
      scrollingWaveform,
      continuousWaveform,
      continuousWaveformDuration: 30,
    }),
  )

  const waveformCard = WS.WaveformContainer.create(wavesurfer)
  WS.PlayerBar.create(wavesurfer)
  WS.InfoPanel.create(wavesurfer, waveformCard.getCard(), { pluginInstances: { record } })

  record.on('record-end', (blob) => {
    const container = document.querySelector('#recordings')
    const recordedUrl = URL.createObjectURL(blob)

    const wavesurfer = WaveSurfer.create({
      container,
      waveColor: 'rgb(200, 100, 0)',
      progressColor: 'rgb(100, 50, 0)',
      url: recordedUrl,
    })

    const button = container.appendChild(document.createElement('button'))
    button.textContent = 'Play'
    button.onclick = () => wavesurfer.playPause()
    wavesurfer.on('pause', () => (button.textContent = 'Play'))
    wavesurfer.on('play', () => (button.textContent = 'Pause'))

    const link = container.appendChild(document.createElement('a'))
    Object.assign(link, {
      href: recordedUrl,
      download: 'recording.' + blob.type.split(';')[0].split('/')[1] || 'webm',
      textContent: 'Download recording',
    })
  })
  pauseButton.style.display = 'none'
  recButton.textContent = 'Record'

  record.on('record-progress', (time) => {
    updateProgress(time)
  })
}

const progress = document.querySelector('#progress')
const updateProgress = (time) => {
  const formattedTime = [
    Math.floor((time % 3600000) / 60000),
    Math.floor((time % 60000) / 1000),
  ]
    .map((v) => (v < 10 ? '0' + v : v))
    .join(':')
  progress.textContent = formattedTime
}

const pauseButton = document.querySelector('#pause')
pauseButton.onclick = () => {
  if (record.isPaused()) {
    record.resumeRecording()
    pauseButton.textContent = 'Pause'
    return
  }

  record.pauseRecording()
  pauseButton.textContent = 'Resume'
}

const micSelect = document.querySelector('#mic-select')
{
  RecordPlugin.getAvailableAudioDevices().then((devices) => {
    devices.forEach((device) => {
      const option = document.createElement('option')
      option.value = device.deviceId
      option.text = device.label || device.deviceId
      micSelect.appendChild(option)
    })
  })
}

const recButton = document.querySelector('#record')

recButton.onclick = () => {
  if (record.isRecording() || record.isPaused()) {
    record.stopRecording()
    recButton.textContent = 'Record'
    pauseButton.style.display = 'none'
    return
  }

  recButton.disabled = true

  const deviceId = micSelect.value
  record.startRecording({ deviceId }).then(() => {
    recButton.textContent = 'Stop'
    recButton.disabled = false
    pauseButton.style.display = 'inline'
  })
}

const panel = WS.ControlPanel.create(document.querySelector('#controls'))
panel.addToggle({
  id: 'scrollingWaveform',
  label: 'Scrolling waveform',
  checked: false,
  onChange: (v) => {
    scrollingWaveform = v
    if (continuousWaveform && scrollingWaveform) {
      continuousWaveform = false
    }
    createWaveSurfer()
  },
})
panel.addToggle({
  id: 'continuousWaveform',
  label: 'Continuous waveform',
  checked: true,
  onChange: (v) => {
    continuousWaveform = v
    if (continuousWaveform && scrollingWaveform) {
      scrollingWaveform = false
    }
    createWaveSurfer()
  },
})

createWaveSurfer()

/*
<html>
  <h1 style="margin-top: 0">Press Record to start recording 🎙️</h1>

  <p>
    📖 <a href="https://wavesurfer.xyz/docs/classes/plugins_record.RecordPlugin">Record plugin docs</a>
  </p>

  <button id="record">Record</button>
  <button id="pause" style="display: none;">Pause</button>

  <select id="mic-select">
    <option value="" hidden>Select mic</option>
  </select>

  <div id="controls"></div>

  <p id="progress">00:00</p>

  <div id="mic" style="border: 1px solid #ddd; border-radius: 4px; margin-top: 1rem"></div>

  <div id="recordings" style="margin: 1rem 0"></div>

  <style>
    button {
      min-width: 5rem;
      margin: 1rem 1rem 1rem 0;
    }
  </style>
</html>
*/
