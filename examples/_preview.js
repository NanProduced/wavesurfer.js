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

  html {
    font-size: 16px;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: var(--bg-secondary);
    color: var(--text-primary);
    min-height: 100vh;
    padding: 1rem;
    transition: background var(--transition), color var(--transition);
  }

  .app-container {
    max-width: 100%;
    margin: 0 auto;
  }

  .waveform-card {
    background: var(--bg-primary);
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--border-color);
    overflow: hidden;
    box-shadow: var(--shadow-md);
    margin-bottom: 1rem;
  }

  .waveform-header {
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
  }

  .waveform-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .meta-info {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .meta-label {
    color: var(--text-muted);
  }

  .meta-value {
    color: var(--text-primary);
    font-weight: 500;
  }

  .waveform-body {
    padding: 1.25rem 1rem;
    background: var(--bg-primary);
  }

  #waveform-container {
    min-height: 80px;
  }

  .example-content {
    margin-top: 1rem;
  }

  .player-controls {
    background: var(--bg-primary);
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--border-color);
    padding: 0.875rem 1rem;
    box-shadow: var(--shadow-md);
  }

  .controls-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .control-btn {
    width: 40px;
    height: 40px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition);
    flex-shrink: 0;
  }

  .control-btn:hover {
    background: var(--bg-hover);
    border-color: var(--accent-color);
  }

  .control-btn.playing {
    background: var(--accent-light);
    border-color: var(--accent-color);
    color: var(--accent-color);
  }

  .control-btn svg {
    width: 18px;
    height: 18px;
  }

  .time-display {
    font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
    font-size: 0.8125rem;
    color: var(--text-primary);
    font-weight: 500;
    white-space: nowrap;
    min-width: 80px;
    text-align: center;
  }

  .progress-wrapper {
    flex: 1;
    min-width: 120px;
    position: relative;
  }

  .progress-bar {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--bg-tertiary);
    cursor: pointer;
    outline: none;
  }

  .progress-bar::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
    border: 2px solid var(--bg-primary);
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition);
  }

  .progress-bar::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }

  .progress-bar::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
    border: 2px solid var(--bg-primary);
    box-shadow: var(--shadow-sm);
  }

  .volume-group {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-shrink: 0;
  }

  .volume-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 80px;
    height: 4px;
    border-radius: 2px;
    background: var(--bg-tertiary);
    cursor: pointer;
    outline: none;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
    border: 2px solid var(--bg-primary);
  }

  .volume-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
    border: 2px solid var(--bg-primary);
  }

  .speed-select {
    padding: 0.375rem 0.625rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 0.75rem;
    cursor: pointer;
    outline: none;
    transition: all var(--transition);
  }

  .speed-select:hover {
    border-color: var(--accent-color);
  }

  .speed-select:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px var(--accent-light);
  }

  .regions-panel {
    background: var(--bg-primary);
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--border-color);
    margin-top: 1rem;
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }

  .regions-header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .regions-title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .regions-count {
    background: var(--accent-light);
    color: var(--accent-color);
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 600;
  }

  .regions-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .region-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1rem;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: background var(--transition);
  }

  .region-item:last-child {
    border-bottom: none;
  }

  .region-item:hover {
    background: var(--bg-secondary);
  }

  .region-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .region-info {
    flex: 1;
    min-width: 0;
  }

  .region-label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .region-time {
    font-size: 0.6875rem;
    color: var(--text-muted);
    font-family: 'SF Mono', monospace;
  }

  .region-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .region-action-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition);
  }

  .region-action-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .region-action-btn.delete:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .region-action-btn svg {
    width: 14px;
    height: 14px;
  }

  .regions-empty {
    padding: 1.5rem 1rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.8125rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
  }

  @media (max-width: 600px) {
    body {
      padding: 0.5rem;
    }

    .controls-row {
      gap: 0.5rem;
    }

    .control-btn {
      width: 36px;
      height: 36px;
    }

    .time-display {
      font-size: 0.75rem;
      min-width: 70px;
    }

    .volume-slider {
      width: 60px;
    }

    .meta-info {
      gap: 0.5rem;
    }
  }
`

const sharedHTML = `
  <div class="app-container">
    <div class="waveform-card">
      <div class="waveform-header">
        <div class="waveform-title" data-i18n="meta.audio">Audio Waveform</div>
        <div class="meta-info">
          <div class="meta-item">
            <span class="meta-label" data-i18n="meta.duration">Duration:</span>
            <span class="meta-value" id="meta-duration">--:--</span>
          </div>
          <div class="meta-item">
            <span class="meta-label" data-i18n="meta.sampleRate">Sample Rate:</span>
            <span class="meta-value" id="meta-samplerate">--</span>
          </div>
          <div class="meta-item">
            <span class="meta-label" data-i18n="meta.channels">Channels:</span>
            <span class="meta-value" id="meta-channels">--</span>
          </div>
        </div>
      </div>
      <div class="waveform-body">
        <div id="waveform-container"></div>
      </div>
    </div>

    <div class="player-controls">
      <div class="controls-row">
        <button class="control-btn" id="play-btn" data-tooltip="Play/Pause">
          <svg id="play-icon" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <svg id="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        </button>

        <button class="control-btn" id="stop-btn" data-tooltip="Stop">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12"></rect>
          </svg>
        </button>

        <div class="time-display">
          <span id="current-time">00:00</span> / <span id="total-time">00:00</span>
        </div>

        <div class="progress-wrapper">
          <input type="range" class="progress-bar" id="progress-bar" min="0" max="1000" value="0" />
        </div>

        <div class="volume-group">
          <button class="control-btn" id="mute-btn" data-tooltip="Mute" style="width: 32px; height: 32px;">
            <svg id="volume-icon" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
            <svg id="mute-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            </svg>
          </button>
          <input type="range" class="volume-slider" id="volume-slider" min="0" max="100" value="100" />
        </div>

        <select class="speed-select" id="speed-select">
          <option value="0.25">0.25x</option>
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1" selected>1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </div>
    </div>

    <div class="regions-panel" id="regions-panel" style="display: none;">
      <div class="regions-header">
        <div class="regions-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="9"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          <span data-i18n="regions.title">Regions</span>
          <span class="regions-count" id="regions-count">0</span>
        </div>
      </div>
      <div class="regions-list" id="regions-list">
        <div class="regions-empty" data-i18n="regions.empty">No regions</div>
      </div>
    </div>

    <div class="example-content" id="example-content"></div>
  </div>
`

const controlScript = `
window.__waveSurferInstances = []
window.__regionsPlugin = null
window.__currentTheme = 'light'
window.__translations = {}
window.__currentLang = 'en'
window.__originalCreate = null
window.__originalRegionsCreate = null

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
  const regionsPanel = document.getElementById('regions-panel')
  const regionsList = document.getElementById('regions-list')
  const regionsCount = document.getElementById('regions-count')
  
  if (!window.__regionsPlugin || !regionsPanel) return

  const regions = window.__regionsPlugin.getRegions ? window.__regionsPlugin.getRegions() : []
  regionsPanel.style.display = 'block'
  regionsCount.textContent = regions.length

  if (regions.length === 0) {
    regionsList.innerHTML = '<div class="regions-empty" data-i18n="regions.empty">' + (window.__translations['regions.empty'] || 'No regions') + '</div>'
    return
  }

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

      item.querySelector('[data-action="play"]')?.addEventListener('click', (e) => {
        e.stopPropagation()
        region.play?.(true)
      })

      item.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
        e.stopPropagation()
        region.remove?.()
      })
    }
  })
}

const initControls = (ws) => {
  if (!ws) return
  
  window.__waveSurferInstances.push(ws)

  const playBtn = document.getElementById('play-btn')
  const stopBtn = document.getElementById('stop-btn')
  const progressBar = document.getElementById('progress-bar')
  const volumeSlider = document.getElementById('volume-slider')
  const muteBtn = document.getElementById('mute-btn')
  const speedSelect = document.getElementById('speed-select')
  const playIcon = document.getElementById('play-icon')
  const pauseIcon = document.getElementById('pause-icon')
  const volumeIcon = document.getElementById('volume-icon')
  const muteIcon = document.getElementById('mute-icon')
  const currentTimeEl = document.getElementById('current-time')
  const totalTimeEl = document.getElementById('total-time')
  const metaDuration = document.getElementById('meta-duration')
  const metaSampleRate = document.getElementById('meta-samplerate')
  const metaChannels = document.getElementById('meta-channels')

  if (playBtn && playIcon && pauseIcon) {
    playBtn.addEventListener('click', () => {
      ws.playPause?.()
    })
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      ws.stop?.()
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

    const currentVolume = ws.getVolume?.() ?? 1
    if (volumeSlider) {
      volumeSlider.value = currentVolume * 100
    }

    const currentRate = ws.getPlaybackRate?.() ?? 1
    if (speedSelect) {
      speedSelect.value = currentRate.toString()
    }

    updateWaveSurferTheme(window.__currentTheme)
  })

  ws.on('decode', () => {
    const decodedData = ws.getDecodedData?.()
    if (decodedData) {
      if (metaSampleRate) {
        metaSampleRate.textContent = decodedData.sampleRate + ' Hz'
      }
      if (metaChannels) {
        metaChannels.textContent = decodedData.numberOfChannels
      }
    }
  })

  if (ws.getActivePlugins) {
    const plugins = ws.getActivePlugins()
    plugins.forEach(plugin => {
      if (plugin && (plugin.getRegions || plugin.addRegion)) {
        window.__regionsPlugin = plugin
        
        plugin.on?.('region-created', updateRegionsList)
        plugin.on?.('region-updated', updateRegionsList)
        plugin.on?.('region-removed', updateRegionsList)
        
        updateRegionsList()
      }
    })
  }
}

window.__initControls = initControls

const setupInterceptors = () => {
  if (typeof WaveSurfer !== 'undefined' && WaveSurfer.create && !window.__originalCreate) {
    window.__originalCreate = WaveSurfer.create
    WaveSurfer.create = function(options) {
      const instance = window.__originalCreate.call(this, options)
      if (instance) {
        window.__waveSurferInstances.push(instance)
        initControls(instance)
      }
      return instance
    }
  }
  
  if (typeof RegionsPlugin !== 'undefined' && RegionsPlugin.create && !window.__originalRegionsCreate) {
    window.__originalRegionsCreate = RegionsPlugin.create
    RegionsPlugin.create = function(options) {
      const instance = window.__originalRegionsCreate.call(this, options)
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

  const augmentedScript = `
${controlScript}

${script}
`

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
${augmentedScript}
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
