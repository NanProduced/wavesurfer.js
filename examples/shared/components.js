;(function () {
  'use strict'

  window.WS = window.WS || {}
  window.__ws_instances = window.__ws_instances || []

  function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '00:00.000'
    var mins = Math.floor(seconds / 60)
    var secs = Math.floor(seconds % 60)
    var ms = Math.floor((seconds % 1) * 1000)
    return (
      String(mins).padStart(2, '0') +
      ':' +
      String(secs).padStart(2, '0') +
      '.' +
      String(ms).padStart(3, '0')
    )
  }

  function formatDuration(seconds) {
    if (!seconds || !isFinite(seconds)) return '0:00'
    var mins = Math.floor(seconds / 60)
    var secs = Math.floor(seconds % 60)
    return mins + ':' + String(secs).padStart(2, '0')
  }

  function createElement(tag, attrs, children) {
    var el = document.createElement(tag)
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'className') {
          el.className = attrs[key]
        } else if (key === 'style' && typeof attrs[key] === 'object') {
          Object.assign(el.style, attrs[key])
        } else if (key.startsWith('on')) {
          el.addEventListener(key.slice(2).toLowerCase(), attrs[key])
        } else {
          el.setAttribute(key, attrs[key])
        }
      })
    }
    if (children) {
      if (typeof children === 'string') {
        el.textContent = children
      } else if (Array.isArray(children)) {
        children.forEach(function (child) {
          if (child) el.appendChild(child)
        })
      } else {
        el.appendChild(children)
      }
    }
    return el
  }

  var playSVG =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="6,3 20,12 6,21"/></svg>'
  var pauseSVG =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>'
  var volumeOnSVG =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" opacity="0.7"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14" opacity="0.4" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
  var volumeOffSVG =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 9v6h4l5 5V4L7 9H3z"/><line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2"/><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2"/></svg>'
  var infoSVG =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="8" r="1" fill="currentColor"/></svg>'
  var deleteSVG =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="currentColor" stroke-width="2"/></svg>'

  var PlayerBar = {
    create: function (wavesurfer, container) {
      var bar = createElement('div', { className: 'ws-player-bar' })

      var playBtn = createElement('button', {
        className: 'ws-play-btn',
        'aria-label': 'Play',
      })
      playBtn.innerHTML = playSVG

      var timeDisplay = createElement('div', { className: 'ws-time-display' })
      var timeCurrent = createElement('span', { className: 'ws-time-current' }, '00:00.000')
      var timeSep = createElement('span', {}, ' / ')
      var timeTotal = createElement('span', {}, '00:00.000')
      timeDisplay.appendChild(timeCurrent)
      timeDisplay.appendChild(timeSep)
      timeDisplay.appendChild(timeTotal)

      var volumeGroup = createElement('div', { className: 'ws-volume-group' })

      var muteBtn = createElement('button', {
        className: 'ws-mute-btn',
        'aria-label': 'Mute',
      })
      muteBtn.innerHTML = volumeOnSVG

      var volumeSlider = createElement('input', {
        className: 'ws-volume-slider',
        type: 'range',
        min: '0',
        max: '1',
        step: '0.01',
        value: String(wavesurfer.getVolume()),
        'aria-label': 'Volume',
      })

      var rateSelect = createElement('select', { className: 'ws-rate-select', 'aria-label': 'Playback rate' })
      ;[0.5, 0.75, 1, 1.25, 1.5, 2].forEach(function (rate) {
        var opt = createElement('option', { value: String(rate) }, rate + 'x')
        if (rate === 1) opt.selected = true
        rateSelect.appendChild(opt)
      })

      volumeGroup.appendChild(muteBtn)
      volumeGroup.appendChild(volumeSlider)
      volumeGroup.appendChild(rateSelect)

      bar.appendChild(playBtn)
      bar.appendChild(timeDisplay)
      bar.appendChild(volumeGroup)

      if (container) {
        container.appendChild(bar)
      } else {
        document.body.appendChild(bar)
      }

      function updatePlayButton() {
        if (wavesurfer.isPlaying()) {
          playBtn.innerHTML = pauseSVG
          playBtn.setAttribute('aria-label', 'Pause')
        } else {
          playBtn.innerHTML = playSVG
          playBtn.setAttribute('aria-label', 'Play')
        }
      }

      function updateMuteButton() {
        if (wavesurfer.getMuted() || wavesurfer.getVolume() === 0) {
          muteBtn.innerHTML = volumeOffSVG
          muteBtn.setAttribute('aria-label', 'Unmute')
        } else {
          muteBtn.innerHTML = volumeOnSVG
          muteBtn.setAttribute('aria-label', 'Mute')
        }
      }

      function updateTime() {
        timeCurrent.textContent = formatTime(wavesurfer.getCurrentTime())
        timeTotal.textContent = formatTime(wavesurfer.getDuration())
      }

      playBtn.addEventListener('click', function () {
        wavesurfer.playPause()
      })

      muteBtn.addEventListener('click', function () {
        if (wavesurfer.getMuted()) {
          wavesurfer.setMuted(false)
        } else {
          wavesurfer.setMuted(true)
        }
      })

      volumeSlider.addEventListener('input', function () {
        wavesurfer.setVolume(parseFloat(volumeSlider.value))
        if (wavesurfer.getMuted()) {
          wavesurfer.setMuted(false)
        }
        updateMuteButton()
      })

      rateSelect.addEventListener('change', function () {
        wavesurfer.setPlaybackRate(parseFloat(rateSelect.value))
      })

      var unsubFns = []

      function on(event, fn) {
        wavesurfer.on(event, fn)
        unsubFns.push(function () {
          wavesurfer.un(event, fn)
        })
      }

      on('play', updatePlayButton)
      on('pause', updatePlayButton)
      on('finish', updatePlayButton)
      on('timeupdate', updateTime)
      on('ready', function () {
        updateTime()
        updatePlayButton()
      })
      on('decode', updateTime)

      updatePlayButton()
      updateTime()
      updateMuteButton()

      return {
        destroy: function () {
          unsubFns.forEach(function (fn) {
            fn()
          })
          bar.remove()
        },
        updateTheme: function (isDark) {
          WS.applyTheme(wavesurfer, isDark)
        },
      }
    },
  }

  var WaveformContainer = {
    create: function (wavesurfer) {
      var wrapper = wavesurfer.getWrapper()
      if (!wrapper) return { destroy: function () {} }

      var rootNode = wrapper.getRootNode()
      var hostEl = rootNode.host
      if (!hostEl) return { destroy: function () {} }

      var parentEl = hostEl.parentElement
      if (!parentEl) return { destroy: function () {} }

      var card = createElement('div', { className: 'ws-waveform-card' })

      var meta = createElement('div', { className: 'ws-waveform-meta' })

      var skeleton = createElement('div', { className: 'ws-skeleton' })
      for (var i = 0; i < 60; i++) {
        var bar = createElement('div', { className: 'ws-skeleton-bar' })
        bar.style.height = Math.random() * 80 + 20 + '%'
        bar.style.animationDelay = (i * 0.02) + 's'
        skeleton.appendChild(bar)
      }

      parentEl.insertBefore(card, hostEl)
      card.appendChild(meta)
      card.appendChild(skeleton)
      card.appendChild(hostEl)

      skeleton.style.display = 'block'

      function updateMeta() {
        var decoded = wavesurfer.getDecodedData()
        meta.innerHTML = ''

        if (decoded) {
          var url = (wavesurfer.options && wavesurfer.options.url) || ''
          var filename = url.split('/').pop() || 'Unknown'
          var ext = filename.split('.').pop().toUpperCase()

          var items = [
            { label: 'File', value: filename },
            { label: 'Format', value: ext },
            { label: 'Duration', value: formatDuration(decoded.duration) },
            { label: 'Sample Rate', value: decoded.sampleRate + ' Hz' },
            { label: 'Channels', value: decoded.numberOfChannels + 'ch' },
          ]

          items.forEach(function (item) {
            var el = createElement('div', { className: 'ws-waveform-meta-item' })
            el.appendChild(createElement('span', { className: 'ws-waveform-meta-label' }, item.label + ':'))
            el.appendChild(createElement('span', {}, item.value))
            meta.appendChild(el)
          })
        }

        skeleton.style.display = 'none'
      }

      var unsubFns = []

      function on(event, fn) {
        wavesurfer.on(event, fn)
        unsubFns.push(function () {
          wavesurfer.un(event, fn)
        })
      }

      on('ready', updateMeta)
      on('decode', updateMeta)
      on('load', function () {
        skeleton.style.display = 'block'
        meta.innerHTML = ''
      })

      return {
        destroy: function () {
          unsubFns.forEach(function (fn) {
            fn()
          })
          if (card.parentNode) {
            card.parentNode.insertBefore(hostEl, card)
            card.remove()
          }
        },
        updateMeta: updateMeta,
        getCard: function () {
          return card
        },
      }
    },
  }

  var ControlPanel = {
    create: function (container) {
      var panel = createElement('div', { className: 'ws-control-panel' })

      if (container) {
        container.appendChild(panel)
      } else {
        document.body.appendChild(panel)
      }

      var items = []

      return {
        addToggle: function (opts) {
          var inputId = opts.id || ('ws-toggle-' + Math.random().toString(36).slice(2))
          var label = createElement('label', { className: 'ws-control-label', for: inputId }, opts.label)
          var item = createElement('div', { className: 'ws-control-item' })
          var toggle = createElement('label', { className: 'ws-toggle' })
          var input = createElement('input', {
            type: 'checkbox',
            id: inputId,
          })
          if (opts.checked) input.checked = true
          var track = createElement('span', { className: 'ws-toggle-track' })
          toggle.appendChild(input)
          toggle.appendChild(track)
          item.appendChild(toggle)

          input.addEventListener('change', function () {
            if (opts.onChange) opts.onChange(input.checked)
          })

          panel.appendChild(label)
          panel.appendChild(item)
          items.push({ label: label, item: item })

          return input
        },
        addSlider: function (opts) {
          var label = createElement('label', { className: 'ws-control-label' }, opts.label)
          var item = createElement('div', { className: 'ws-control-item' })
          var slider = createElement('input', {
            className: 'ws-range-slider',
            type: 'range',
            min: String(opts.min),
            max: String(opts.max),
            step: String(opts.step || 1),
            value: String(opts.value),
            id: opts.id || '',
          })
          var valueLabel = createElement('span', { className: 'ws-control-value' })
          valueLabel.textContent = opts.value + (opts.unit ? ' ' + opts.unit : '')

          slider.addEventListener('input', function () {
            var val = parseFloat(slider.value)
            valueLabel.textContent = val + (opts.unit ? ' ' + opts.unit : '')
            if (opts.onChange) opts.onChange(val)
          })

          item.appendChild(slider)
          item.appendChild(valueLabel)

          panel.appendChild(label)
          panel.appendChild(item)
          items.push({ label: label, item: item })

          return slider
        },
        addSelect: function (opts) {
          var label = createElement('label', { className: 'ws-control-label' }, opts.label)
          var item = createElement('div', { className: 'ws-control-item' })
          var select = createElement('select', {
            className: 'ws-styled-select',
            id: opts.id || '',
          })
          opts.options.forEach(function (opt) {
            var option = createElement('option', { value: String(opt.value) }, opt.label)
            if (String(opt.value) === String(opts.value)) option.selected = true
            select.appendChild(option)
          })

          select.addEventListener('change', function () {
            if (opts.onChange) opts.onChange(select.value)
          })

          item.appendChild(select)

          panel.appendChild(label)
          panel.appendChild(item)
          items.push({ label: label, item: item })

          return select
        },
        destroy: function () {
          panel.remove()
        },
      }
    },
  }

  var InfoPanel = {
    create: function (wavesurfer, container, opts) {
      opts = opts || {}
      var card = container
      if (!card) return { destroy: function () {} }

      var toggleBtn = createElement('button', {
        className: 'ws-info-toggle',
        'aria-label': 'Toggle info panel',
      })
      toggleBtn.innerHTML = infoSVG

      var panel = createElement('div', { className: 'ws-info-panel' })

      card.style.position = card.style.position || 'relative'
      card.appendChild(toggleBtn)
      card.appendChild(panel)

      var isOpen = false

      toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation()
        isOpen = !isOpen
        if (isOpen) {
          panel.classList.add('open')
        } else {
          panel.classList.remove('open')
        }
      })

      function renderPanel() {
        panel.innerHTML = ''

        var decoded = wavesurfer.getDecodedData()
        var url = (wavesurfer.options && wavesurfer.options.url) || ''

        var basicSection = createElement('div', { className: 'ws-info-section' })
        basicSection.appendChild(createElement('div', { className: 'ws-info-section-title' }, 'Basic Info'))

        var filename = url.split('/').pop() || 'Unknown'
        var ext = filename.split('.').pop().toUpperCase()

        var basicRows = [
          ['File', filename],
          ['Format', ext],
          ['Duration', decoded ? formatDuration(decoded.duration) : '--'],
          ['Sample Rate', decoded ? decoded.sampleRate + ' Hz' : '--'],
          ['Channels', decoded ? decoded.numberOfChannels + 'ch' : '--'],
        ]

        basicRows.forEach(function (row) {
          var r = createElement('div', { className: 'ws-info-row' })
          r.appendChild(createElement('span', { className: 'ws-info-key' }, row[0]))
          r.appendChild(createElement('span', { className: 'ws-info-value' }, row[1]))
          basicSection.appendChild(r)
        })
        panel.appendChild(basicSection)

        var liveSection = createElement('div', { className: 'ws-info-section' })
        liveSection.appendChild(createElement('div', { className: 'ws-info-section-title' }, 'Live'))

        var currentTime = formatTime(wavesurfer.getCurrentTime())
        var zoomLevel = (wavesurfer.options && wavesurfer.options.minPxPerSec) || 1

        var liveRows = [
          ['Position', currentTime],
          ['Zoom', zoomLevel + ' px/s'],
        ]

        if (decoded) {
          var peaks = wavesurfer.exportPeaks({ maxLength: 1000 })
          liveRows.push(['Peaks', peaks[0] ? peaks[0].length : '--'])
        }

        liveRows.forEach(function (row) {
          var r = createElement('div', { className: 'ws-info-row' })
          r.appendChild(createElement('span', { className: 'ws-info-key' }, row[0]))
          r.appendChild(createElement('span', { className: 'ws-info-value' }, String(row[1])))
          liveSection.appendChild(r)
        })
        panel.appendChild(liveSection)

        if (opts.pluginInstances) {
          var pluginSection = createElement('div', { className: 'ws-info-section' })
          pluginSection.appendChild(createElement('div', { className: 'ws-info-section-title' }, 'Plugins'))

          if (opts.pluginInstances.regions) {
            var regionCount = opts.pluginInstances.regions.getRegions().length
            var r = createElement('div', { className: 'ws-info-row' })
            r.appendChild(createElement('span', { className: 'ws-info-key' }, 'Regions'))
            r.appendChild(createElement('span', { className: 'ws-info-value' }, String(regionCount)))
            pluginSection.appendChild(r)
          }

          if (opts.pluginInstances.record) {
            var isRecording = opts.pluginInstances.record.isRecording()
            var status = isRecording ? 'Recording' : 'Idle'
            var r = createElement('div', { className: 'ws-info-row' })
            r.appendChild(createElement('span', { className: 'ws-info-key' }, 'Record'))
            r.appendChild(createElement('span', { className: 'ws-info-value' }, status))
            pluginSection.appendChild(r)
          }

          panel.appendChild(pluginSection)
        }
      }

      var unsubFns = []

      function on(event, fn) {
        wavesurfer.on(event, fn)
        unsubFns.push(function () {
          wavesurfer.un(event, fn)
        })
      }

      on('timeupdate', function () {
        if (isOpen) renderPanel()
      })
      on('zoom', function () {
        if (isOpen) renderPanel()
      })
      on('ready', renderPanel)
      on('decode', renderPanel)

      if (opts.pluginInstances && opts.pluginInstances.regions) {
        var regions = opts.pluginInstances.regions
        ;['region-created', 'region-removed', 'region-updated'].forEach(function (evt) {
          var handler = function () {
            if (isOpen) renderPanel()
          }
          regions.on(evt, handler)
          unsubFns.push(function () {
            regions.un(evt, handler)
          })
        })
      }

      renderPanel()

      return {
        destroy: function () {
          unsubFns.forEach(function (fn) {
            fn()
          })
          toggleBtn.remove()
          panel.remove()
        },
      }
    },
  }

  WS.applyTheme = function (wavesurfer, isDark) {
    var currentWaveColor = wavesurfer.options && wavesurfer.options.waveColor
    var isDefaultWaveColor = !currentWaveColor || currentWaveColor === '#999' || currentWaveColor === 'rgb(153, 153, 153)'
    if (isDefaultWaveColor) {
      wavesurfer.setOptions({
        waveColor: isDark ? '#6e6e73' : '#999',
        progressColor: isDark ? '#0a84ff' : '#555',
        cursorColor: isDark ? '#f5f5f7' : '#333',
      })
    }
  }

  WS.formatTime = formatTime
  WS.formatDuration = formatDuration
  WS.createElement = createElement
  WS.PlayerBar = PlayerBar
  WS.WaveformContainer = WaveformContainer
  WS.ControlPanel = ControlPanel
  WS.InfoPanel = InfoPanel
  WS.svgs = { play: playSVG, pause: pauseSVG, volumeOn: volumeOnSVG, volumeOff: volumeOffSVG, info: infoSVG, delete: deleteSVG }

  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ws-theme-change') {
      var theme = e.data.theme
      document.documentElement.setAttribute('data-theme', theme)
      var isDark = theme === 'dark'
      if (window.__ws_instances) {
        window.__ws_instances.forEach(function (ws) {
          WS.applyTheme(ws, isDark)
        })
      }
    }
  })
})()
