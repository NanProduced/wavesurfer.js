window.__waveSurferInstances = []
window.__regionsPlugin = null
window.__currentTheme = 'light'
window.__translations = {}
window.__currentLang = 'en'

window.__skipInitialApply = false

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0')
}

const t = (key) => {
  return window.__translations[key] || key
}

const applyTranslations = () => {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')
    const val = t(key)
    if (val !== key) el.textContent = val
  })

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title')
    const val = t(key)
    if (val !== key) el.title = val
  })

  document.querySelectorAll('.region-time [data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')
    const val = t(key)
    if (val !== key) el.textContent = val
  })

  const emptyMsg = document.querySelector('.regions-empty')
  if (emptyMsg) emptyMsg.textContent = t('regions.empty')

  const playBtn = document.getElementById('playBtn')
  if (playBtn) playBtn.title = t('controls.play')

  const muteBtn = document.getElementById('muteBtn')
  if (muteBtn) muteBtn.title = t('controls.mute')

  const speedSelect = document.getElementById('speedSelect')
  if (speedSelect) {
    const labels = ['0.25x', '0.5x', '0.75x', '1x', '1.25x', '1.5x', '2x']
    Array.from(speedSelect.options).forEach((opt, i) => {
      const labeled = t('controls.speed.option_' + (i + 1)) || labels[i]
      if (labeled) opt.textContent = labeled
    })
  }
}

const getThemeColors = (theme) => {
  return theme === 'dark'
    ? { waveColor: '#818cf8', progressColor: '#6366f1', cursorColor: '#a5b4fc' }
    : { waveColor: '#6366f1', progressColor: '#4f46e5', cursorColor: '#818cf8' }
}

const updateWaveSurferTheme = (theme) => {
  const instances = window.__waveSurferInstances
  const colors = getThemeColors(theme)

  instances.forEach((ws) => {
    if (!ws || !ws.setOptions) return
    ws.setOptions(colors)
  })
}

const createRegionItem = (region) => {
  const content = region.content?.innerHTML || region.content || t('regions.untitled')
  const start = region.start?.toFixed(2) ?? '0.00'
  const end = region.end != null ? region.end.toFixed(2) : start

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
  timeDiv.textContent = `${t('regions.start')}: ${start}s → ${t('regions.end')}: ${end}s`

  infoDiv.appendChild(labelDiv)
  infoDiv.appendChild(timeDiv)

  const actionsDiv = document.createElement('div')
  actionsDiv.className = 'region-actions'

  const playBtn = document.createElement('button')
  playBtn.className = 'region-action-btn'
  playBtn.setAttribute('data-action', 'play')
  playBtn.setAttribute('title', t('controls.play'))
  playBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'

  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'region-action-btn delete'
  deleteBtn.setAttribute('data-action', 'delete')
  deleteBtn.setAttribute('title', t('regions.delete'))
  deleteBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'

  actionsDiv.appendChild(playBtn)
  actionsDiv.appendChild(deleteBtn)

  item.appendChild(colorDiv)
  item.appendChild(infoDiv)
  item.appendChild(actionsDiv)

  item.addEventListener('click', (e) => {
    if (!e.target.closest('.region-action-btn')) {
      const ws = window.__waveSurferInstances[0]
      if (ws && ws.setTime) ws.setTime(region.start)
    }
  })

  playBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    const ws = window.__waveSurferInstances[0]
    if (ws && region.start != null) {
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

  regions.forEach((region) => {
    regionsList.appendChild(createRegionItem(region))
  })

  applyTranslations()
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
      ws.playPause?.()
    })
  }

  if (progressBar) {
    progressBar.addEventListener('input', (e) => {
      const duration = ws.getDuration?.() || 0
      if (duration > 0) {
        ws.setTime?.((e.target.value / 1000) * duration)
      }
    })
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const volume = e.target.value / 100
      ws.setVolume?.(volume)
      if (volumeIcon && muteIcon) {
        volumeIcon.style.display = volume === 0 ? 'none' : 'block'
        muteIcon.style.display = volume === 0 ? 'block' : 'none'
      }
    })
  }

  if (muteBtn && volumeIcon && muteIcon) {
    muteBtn.addEventListener('click', () => {
      const isMuted = ws.getMuted?.() || false
      ws.setMuted?.(!isMuted)
      volumeIcon.style.display = isMuted ? 'block' : 'none'
      muteIcon.style.display = isMuted ? 'none' : 'block'
      muteBtn.title = isMuted ? t('controls.mute') : t('controls.unmute')
    })
  }

  if (speedSelect) {
    speedSelect.addEventListener('change', (e) => {
      ws.setPlaybackRate?.(parseFloat(e.target.value))
    })
  }

  const updatePlayState = (isPlaying) => {
    if (!playIcon || !pauseIcon || !playBtn) return
    playIcon.style.display = isPlaying ? 'none' : 'block'
    pauseIcon.style.display = isPlaying ? 'block' : 'none'
    playBtn.classList.toggle('playing', isPlaying)
    playBtn.title = isPlaying ? t('controls.pause') : t('controls.play')
  }

  ws.on('play', () => updatePlayState(true))
  ws.on('pause', () => updatePlayState(false))
  ws.on('finish', () => updatePlayState(false))

  ws.on('timeupdate', (currentTime) => {
    const duration = ws.getDuration?.() || 0
    if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime)
    if (progressBar && duration > 0) {
      progressBar.value = (currentTime / duration) * 1000
    }
  })

  ws.on('ready', () => {
    const duration = ws.getDuration?.() || 0
    if (totalTimeEl) totalTimeEl.textContent = formatTime(duration)
    if (metaDuration) metaDuration.textContent = formatTime(duration)

    const decodedData = ws.getDecodedData?.()
    if (decodedData) {
      if (metaSampleRate) metaSampleRate.textContent = decodedData.sampleRate.toLocaleString() + ' Hz'
      if (metaChannels) metaChannels.textContent = decodedData.numberOfChannels
    }

    const volume = ws.getVolume?.() ?? 1
    if (volumeSlider) volumeSlider.value = volume * 100

    const playbackRate = ws.getPlaybackRate?.() ?? 1
    if (speedSelect) speedSelect.value = playbackRate

    const colors = getThemeColors(window.__currentTheme)
    ws.setOptions?.(colors)
  })
}

window.__initControls = initControls
window.__updateRegionsList = updateRegionsList

if (window.__skipInitialApply && Object.keys(window.__translations).length > 0) {
  window.addEventListener(
    'DOMContentLoaded',
    () => {
      requestAnimationFrame(() => {
        applyTranslations()
      })
    },
    { once: true },
  )
}

window.addEventListener('message', (event) => {
  const { type, theme, lang, translations: trans } = event.data || {}

  if (type === 'init') {
    if (theme) {
      window.__currentTheme = theme
      document.documentElement.setAttribute('data-theme', theme)
      updateWaveSurferTheme(theme)
    }
    return
  }

  if (type === 'theme' && theme) {
    window.__currentTheme = theme
    document.documentElement.setAttribute('data-theme', theme)
    updateWaveSurferTheme(theme)
  }

  if (type === 'language' && trans) {
    window.__currentLang = lang
    window.__translations = trans
    applyTranslations()
    updateRegionsList()
  }
})

window.__applyI18n = (lang, trans) => {
  window.__currentLang = lang
  window.__translations = trans
  applyTranslations()
}
