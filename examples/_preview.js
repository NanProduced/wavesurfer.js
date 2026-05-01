const iframe = document.querySelector('iframe')
const textarea = document.querySelector('textarea')

const sharedStyles = `
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-tertiary: #f1f5f9;
    --bg-hover: #e2e8f0;
    --bg-active: #dbeafe;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
    --border-color: #e2e8f0;
    --border-radius: 8px;
    --border-radius-lg: 12px;
    --accent-color: #6366f1;
    --accent-hover: #4f46e5;
    --accent-light: #e0e7ff;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    --transition: 0.2s ease;
    --wave-color: #6366f1;
    --progress-color: #4f46e5;
    --cursor-color: #818cf8;
  }

  [data-theme="dark"] {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --bg-hover: #475569;
    --bg-active: #1e3a5f;
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-muted: #64748b;
    --border-color: #334155;
    --accent-color: #818cf8;
    --accent-hover: #a5b4fc;
    --accent-light: #1e293b;
    --wave-color: #818cf8;
    --progress-color: #6366f1;
    --cursor-color: #a5b4fc;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: var(--bg-secondary);
    color: var(--text-primary);
    min-height: 100vh;
    padding: 1rem;
    transition: background var(--transition), color var(--transition);
  }

  .waveform-card {
    background: var(--bg-primary);
    border-radius: var(--border-radius-lg);
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
  }

  .waveform-header {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .meta-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .meta-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  #waveform-container {
    margin-bottom: 1rem;
  }

  .controls-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-primary);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    flex-wrap: wrap;
  }

  .control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: var(--accent-light);
    color: var(--accent-color);
    cursor: pointer;
    transition: all var(--transition);
  }

  .control-btn:hover {
    background: var(--accent-color);
    color: white;
  }

  .control-btn svg {
    width: 20px;
    height: 20px;
  }

  .time-display {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 0.875rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .progress-slider {
    flex: 1;
    min-width: 100px;
    height: 6px;
    border-radius: 3px;
    background: var(--bg-tertiary);
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  }

  .progress-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
    transition: transform var(--transition);
  }

  .progress-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .volume-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .volume-slider {
    width: 80px;
    height: 4px;
    border-radius: 2px;
    background: var(--bg-tertiary);
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
  }

  .speed-select {
    padding: 0.375rem 0.75rem;
    border-radius: var(--border-radius);
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: border-color var(--transition);
  }

  .speed-select:hover {
    border-color: var(--accent-color);
  }

  .regions-panel {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--bg-primary);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
  }

  .regions-panel.hidden {
    display: none;
  }

  .regions-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .regions-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .region-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--bg-secondary);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: background var(--transition);
  }

  .region-item:hover {
    background: var(--bg-hover);
  }

  .region-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .region-info {
    flex: 1;
    min-width: 0;
  }

  .region-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .region-time {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .region-actions {
    display: flex;
    gap: 0.25rem;
  }

  .region-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition);
  }

  .region-action-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .region-action-btn.delete:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  .region-action-btn svg {
    width: 16px;
    height: 16px;
  }

  .regions-empty {
    font-size: 0.875rem;
    color: var(--text-muted);
    text-align: center;
    padding: 1rem;
  }
`

const sharedHTML = `
  <div class="waveform-card">
    <div class="waveform-header">
      <div class="meta-item">
        <span class="meta-label" data-i18n="meta.duration">Duration</span>
        <span class="meta-value" id="meta-duration">--:--</span>
      </div>
      <div class="meta-item">
        <span class="meta-label" data-i18n="meta.sampleRate">Sample Rate</span>
        <span class="meta-value" id="meta-samplerate">--</span>
      </div>
      <div class="meta-item">
        <span class="meta-label" data-i18n="meta.channels">Channels</span>
        <span class="meta-value" id="meta-channels">--</span>
      </div>
    </div>
    <div id="waveform-container"></div>
  </div>
  
  <div class="controls-bar">
    <button class="control-btn" id="playBtn" title="Play">
      <svg id="playIcon" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      <svg id="pauseIcon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>
    </button>
    <span class="time-display">
      <span id="currentTime">00:00</span> / <span id="totalTime">00:00</span>
    </span>
    <input type="range" class="progress-slider" id="progressSlider" min="0" max="1000" value="0">
    <div class="volume-control">
      <button class="control-btn" id="muteBtn" title="Mute" style="width: 32px; height: 32px;">
        <svg id="volumeIcon" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        <svg id="muteIcon" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; display: none;">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      </button>
      <input type="range" class="volume-slider" id="volumeSlider" min="0" max="100" value="100">
    </div>
    <select class="speed-select" id="speedSelect">
      <option value="0.25">0.25x</option>
      <option value="0.5">0.5x</option>
      <option value="0.75">0.75x</option>
      <option value="1" selected>1x</option>
      <option value="1.25">1.25x</option>
      <option value="1.5">1.5x</option>
      <option value="2">2x</option>
    </select>
  </div>
  
  <div class="regions-panel hidden" id="regionsPanel">
    <div class="regions-title" data-i18n="regions.title">Regions</div>
    <div class="regions-list" id="regionsList"></div>
  </div>
`

const loadPreview = (code) => {
  const html = code.replace(/\n/g, '').match(/<html>(.+?)<\/html>/gm) || []
  let script = code
    .replace(/<\/script>/g, '')
    .replace(/'wavesurfer.js'/g, `'../dist/wavesurfer.esm.js'`)
    .replace(/'wavesurfer.js/g, `'..`)
    .replace(/\.esm\.js/g, '.js')
  const isBabel = script.includes('@babel')

  const hasBodyContainer = script.includes('container: document.body')
  const hasWaveformSelector = script.includes("container: '#waveform'")

  if (hasBodyContainer) {
    script = script.replace(/container:\s*document\.body/g, "container: '#waveform-container'")
  } else if (!hasWaveformSelector && !script.includes('#waveform-container')) {
    script = script.replace(/container:\s*(['"][^'"]+['"])/g, "container: '#waveform-container'")
  }

  const originalHtml = html.join('').replace(/<html>|<\/html>/g, '')

  iframe.srcdoc = `
<!DOCTYPE html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>wavesurfer.js example</title>
    <style>${sharedStyles}</style>
  </head>

  <body>
    ${sharedHTML}
    <div id="original-html">
      ${originalHtml}
    </div>

    <script type="${isBabel ? 'text/babel' : 'module'}" data-type="module">
window.__waveSurferInstances = []
window.__regionsPlugin = null
window.__currentTheme = 'light'
window.__translations = {}
window.__currentLang = 'en'

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0')
}

const applyTranslations = () => {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')
    if (window.__translations[key]) {
      el.textContent = window.__translations[key]
    }
  })
}

const getThemeColors = (theme) => {
  if (theme === 'dark') {
    return {
      waveColor: '#818cf8',
      progressColor: '#6366f1',
      cursorColor: '#a5b4fc'
    }
  }
  return {
    waveColor: '#6366f1',
    progressColor: '#4f46e5',
    cursorColor: '#818cf8'
  }
}

const updateWaveSurferTheme = (theme) => {
  const instances = window.__waveSurferInstances
  const colors = getThemeColors(theme)
  
  instances.forEach(ws => {
    if (ws && ws.setOptions) {
      const currentOptions = ws.options
      const currentWaveColor = currentOptions.waveColor
      
      if (typeof currentWaveColor === 'string' && 
          (currentWaveColor.startsWith('rgb') || currentWaveColor.startsWith('#'))) {
        const shouldUpdate = 
          currentWaveColor.includes('6366f1') || 
          currentWaveColor.includes('818cf8') ||
          currentWaveColor.includes('4f46e5') ||
          currentWaveColor.includes('200, 0, 200') ||
          currentWaveColor.includes('100, 0, 100')
        
        if (shouldUpdate) {
          ws.setOptions({
            waveColor: colors.waveColor,
            progressColor: colors.progressColor,
            cursorColor: colors.cursorColor
          })
        }
      }
    }
  })
}

const updateRegionsList = () => {
  const regionsPanel = document.getElementById('regionsPanel')
  const regionsList = document.getElementById('regionsList')
  const regionsPlugin = window.__regionsPlugin
  
  if (!regionsPlugin || !regionsList || !regionsPanel) return
  
  const regions = regionsPlugin.regions || []
  
  if (regions.length === 0) {
    regionsPanel.classList.add('hidden')
    return
  }
  
  regionsPanel.classList.remove('hidden')
  
  regionsList.innerHTML = regions.map(region => {
    const content = region.content?.innerHTML || region.content || 'Region'
    const start = region.start.toFixed(2)
    const end = region.end ? region.end.toFixed(2) : start
    
    return \`
      <div class="region-item" data-region-id="\${region.id}">
        <div class="region-color" style="background-color: \${region.color}"></div>
        <div class="region-info">
          <div class="region-label">\${content}</div>
          <div class="region-time">
            <span data-i18n="regions.start">\${window.__translations['regions.start'] || 'Start'}</span>: \${start}s
            \${region.end ? ' | <span data-i18n="regions.end">' + (window.__translations['regions.end'] || 'End') + '</span>: ' + end + 's' : ''}
          </div>
        </div>
        <div class="region-actions">
          <button class="region-action-btn" data-action="play" title="Play">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
          <button class="region-action-btn delete" data-action="delete" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    \`
  }).join('')
  
  regionsList.querySelectorAll('.region-item').forEach(item => {
    const regionId = item.getAttribute('data-region-id')
    const region = regions.find(r => r.id === regionId)
    
    if (region) {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.region-action-btn') && region.start !== undefined) {
          const ws = window.__waveSurferInstances[0]
          if (ws && ws.setTime) {
            ws.setTime(region.start)
          }
        }
      })
      
      const playBtn = item.querySelector('[data-action="play"]')
      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          const ws = window.__waveSurferInstances[0]
          if (ws && region.start !== undefined) {
            ws.setTime(region.start)
            ws.play()
          }
        })
      }
      
      const deleteBtn = item.querySelector('[data-action="delete"]')
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          region.remove()
        })
      }
    }
  })
}

const initControls = (ws) => {
  if (!ws) return
  
  const playBtn = document.getElementById('playBtn')
  const playIcon = document.getElementById('playIcon')
  const pauseIcon = document.getElementById('pauseIcon')
  const currentTimeEl = document.getElementById('currentTime')
  const totalTimeEl = document.getElementById('totalTime')
  const progressBar = document.getElementById('progressSlider')
  const volumeSlider = document.getElementById('volumeSlider')
  const muteBtn = document.getElementById('muteBtn')
  const volumeIcon = document.getElementById('volumeIcon')
  const muteIcon = document.getElementById('muteIcon')
  const speedSelect = document.getElementById('speedSelect')
  const metaDuration = document.getElementById('meta-duration')
  const metaSampleRate = document.getElementById('meta-samplerate')
  const metaChannels = document.getElementById('meta-channels')
  
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (ws.playPause) {
        ws.playPause()
      }
    })
  }
  
  if (progressBar) {
    progressBar.addEventListener('input', (e) => {
      const progress = e.target.value / 1000
      const duration = ws.getDuration?.() || 0
      if (duration > 0) {
        ws.setTime?.(progress * duration)
      }
    })
  }
  
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const volume = e.target.value / 100
      ws.setVolume?.(volume)
      if (volumeIcon && muteIcon) {
        const isMuted = volume === 0
        volumeIcon.style.display = isMuted ? 'none' : 'block'
        muteIcon.style.display = isMuted ? 'block' : 'none'
      }
    })
  }
  
  if (muteBtn && volumeIcon && muteIcon) {
    muteBtn.addEventListener('click', () => {
      const isMuted = ws.getMuted?.() || false
      ws.setMuted?.(!isMuted)
      volumeIcon.style.display = isMuted ? 'block' : 'none'
      muteIcon.style.display = isMuted ? 'none' : 'block'
    })
  }
  
  if (speedSelect) {
    speedSelect.addEventListener('change', (e) => {
      const rate = parseFloat(e.target.value)
      ws.setPlaybackRate?.(rate)
    })
  }
  
  ws.on('play', () => {
    if (playIcon && pauseIcon && playBtn) {
      playIcon.style.display = 'none'
      pauseIcon.style.display = 'block'
      playBtn.classList.add('playing')
    }
  })
  
  ws.on('pause', () => {
    if (playIcon && pauseIcon && playBtn) {
      playIcon.style.display = 'block'
      pauseIcon.style.display = 'none'
      playBtn.classList.remove('playing')
    }
  })
  
  ws.on('finish', () => {
    if (playIcon && pauseIcon && playBtn) {
      playIcon.style.display = 'block'
      pauseIcon.style.display = 'none'
      playBtn.classList.remove('playing')
    }
  })
  
  ws.on('timeupdate', (currentTime) => {
    const duration = ws.getDuration?.() || 0
    if (currentTimeEl) {
      currentTimeEl.textContent = formatTime(currentTime)
    }
    if (progressBar && duration > 0) {
      progressBar.value = (currentTime / duration) * 1000
    }
  })
  
  ws.on('ready', () => {
    const duration = ws.getDuration?.() || 0
    if (totalTimeEl) {
      totalTimeEl.textContent = formatTime(duration)
    }
    if (metaDuration) {
      metaDuration.textContent = formatTime(duration)
    }
    
    const decodedData = ws.getDecodedData?.()
    if (decodedData) {
      if (metaSampleRate) {
        metaSampleRate.textContent = decodedData.sampleRate + ' Hz'
      }
      if (metaChannels) {
        metaChannels.textContent = decodedData.numberOfChannels
      }
    }
    
    const volume = ws.getVolume?.() ?? 1
    if (volumeSlider) {
      volumeSlider.value = volume * 100
    }
    
    const playbackRate = ws.getPlaybackRate?.() ?? 1
    if (speedSelect) {
      speedSelect.value = playbackRate
    }
    
    updateWaveSurferTheme(window.__currentTheme)
  })
}

window.__initControls = initControls

const setupInterceptors = () => {
  if (typeof WaveSurfer !== 'undefined' && WaveSurfer.create) {
    const originalCreate = WaveSurfer.create
    WaveSurfer.create = function(options) {
      const instance = originalCreate.call(this, options)
      if (instance) {
        window.__waveSurferInstances.push(instance)
        initControls(instance)
      }
      return instance
    }
  }
  
  if (typeof RegionsPlugin !== 'undefined' && RegionsPlugin.create) {
    const originalRegionsCreate = RegionsPlugin.create
    RegionsPlugin.create = function(options) {
      const instance = originalRegionsCreate.call(this, options)
      if (instance) {
        window.__regionsPlugin = instance
        instance.on?.('region-created', updateRegionsList)
        instance.on?.('region-updated', updateRegionsList)
        instance.on?.('region-removed', updateRegionsList)
        setTimeout(() => updateRegionsList(), 100)
      }
      return instance
    }
  }
}

setupInterceptors()

${script}

window.addEventListener('message', (event) => {
  const { type, theme, lang, translations: trans } = event.data || {}
  
  if (type === 'theme' && theme) {
    window.__currentTheme = theme
    document.documentElement.setAttribute('data-theme', theme)
    updateWaveSurferTheme(theme)
  }
  
  if (type === 'language' && trans) {
    window.__currentLang = lang
    window.__translations = trans
    applyTranslations()
  }
})
    </script>
  </body>
</html>
`
}

const openExample = (url) => {
  fetch(`/examples/${url}`, {
    cache: 'no-cache',
  })
    .then((res) => res.text())
    .then((text) => {
      loadPreview(text)
      textarea.value = text
    })
}

let delay
document.querySelector('textarea').addEventListener('input', (e) => {
  if (delay) clearTimeout(delay)
  delay = setTimeout(() => {
    loadPreview(e.target.value)
  }, 500)
})

const url = location.hash.slice(1) || 'basic.js'
openExample(url)

let active = document.querySelector(`aside a[href="#${url}"]`)
if (active) active.classList.add('active')
document.querySelectorAll('aside a').forEach((link) => {
  link.addEventListener('click', () => {
    const url = link.hash.slice(1)
    openExample(url)
    if (active) active.classList.remove('active')
    active = link
    active.classList.add('active')
  })
})
