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

const createRegionItem = (region) => {
  const content = region.content?.innerHTML || region.content || 'Region'
  const start = region.start.toFixed(2)
  const end = region.end ? region.end.toFixed(2) : start
  
  const item = document.createElement('div')
  item.className = 'region-item'
  item.setAttribute('data-region-id', region.id)
  
  const colorDiv = document.createElement('div')
  colorDiv.className = 'region-color'
  colorDiv.style.backgroundColor = region.color
  
  const infoDiv = document.createElement('div')
  infoDiv.className = 'region-info'
  
  const labelDiv = document.createElement('div')
  labelDiv.className = 'region-label'
  labelDiv.textContent = content
  
  const timeDiv = document.createElement('div')
  timeDiv.className = 'region-time'
  
  const startSpan = document.createElement('span')
  startSpan.setAttribute('data-i18n', 'regions.start')
  startSpan.textContent = window.__translations['regions.start'] || 'Start'
  timeDiv.appendChild(startSpan)
  timeDiv.appendChild(document.createTextNode(': ' + start + 's'))
  
  if (region.end !== undefined) {
    timeDiv.appendChild(document.createTextNode(' | '))
    const endSpan = document.createElement('span')
    endSpan.setAttribute('data-i18n', 'regions.end')
    endSpan.textContent = window.__translations['regions.end'] || 'End'
    timeDiv.appendChild(endSpan)
    timeDiv.appendChild(document.createTextNode(': ' + end + 's'))
  }
  
  infoDiv.appendChild(labelDiv)
  infoDiv.appendChild(timeDiv)
  
  const actionsDiv = document.createElement('div')
  actionsDiv.className = 'region-actions'
  
  const playBtn = document.createElement('button')
  playBtn.className = 'region-action-btn'
  playBtn.setAttribute('data-action', 'play')
  playBtn.setAttribute('title', 'Play')
  playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'
  
  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'region-action-btn delete'
  deleteBtn.setAttribute('data-action', 'delete')
  deleteBtn.setAttribute('title', 'Delete')
  deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'
  
  actionsDiv.appendChild(playBtn)
  actionsDiv.appendChild(deleteBtn)
  
  item.appendChild(colorDiv)
  item.appendChild(infoDiv)
  item.appendChild(actionsDiv)
  
  item.addEventListener('click', (e) => {
    if (!e.target.closest('.region-action-btn') && region.start !== undefined) {
      const ws = window.__waveSurferInstances[0]
      if (ws && ws.setTime) {
        ws.setTime(region.start)
      }
    }
  })
  
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    const ws = window.__waveSurferInstances[0]
    if (ws && region.start !== undefined) {
      ws.setTime(region.start)
      ws.play()
    }
  })
  
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    region.remove()
  })
  
  return item
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
  regionsList.innerHTML = ''
  
  regions.forEach(region => {
    const item = createRegionItem(region)
    regionsList.appendChild(item)
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
