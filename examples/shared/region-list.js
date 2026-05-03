;(function () {
  'use strict'

  window.WS = window.WS || {}

  var createElement = WS.createElement
  var formatTime = WS.formatTime
  var deleteSVG = WS.svgs.delete

  var RegionList = {
    create: function (wavesurfer, regionsPlugin, container) {
      var wrapper = createElement('div', { className: 'ws-region-list' })

      var header = createElement('div', { className: 'ws-region-list-header' })
      header.appendChild(createElement('span', {}, ''))
      header.appendChild(createElement('span', {}, 'Label'))
      header.appendChild(createElement('span', {}, 'Start'))
      header.appendChild(createElement('span', {}, 'End'))
      header.appendChild(createElement('span', {}, 'Duration'))
      header.appendChild(createElement('span', {}, ''))
      wrapper.appendChild(header)

      var listBody = createElement('div', { className: 'ws-region-list-body' })
      wrapper.appendChild(listBody)

      var stats = createElement('div', { className: 'ws-region-stats' })
      wrapper.appendChild(stats)

      if (container) {
        container.appendChild(wrapper)
      } else {
        document.body.appendChild(wrapper)
      }

      var selectedRow = null
      var editingRegion = null
      var editForm = null

      function createRow(region) {
        var row = createElement('div', { className: 'ws-region-row' })

        var colorBlock = createElement('div', { className: 'ws-region-color' })
        colorBlock.style.backgroundColor = region.color || 'rgba(0,0,0,0.1)'

        var label = createElement('span', { className: 'ws-region-label' })
        var content = region.content
        if (content && typeof content !== 'string') {
          label.textContent = content.textContent || ''
        } else {
          label.textContent = content || ''
        }

        var startTime = createElement('span', { className: 'ws-region-time' })
        startTime.textContent = formatTime(region.start)

        var endTime = createElement('span', { className: 'ws-region-time' })
        endTime.textContent = formatTime(region.end || region.start)

        var duration = createElement('span', { className: 'ws-region-time' })
        var dur = (region.end || region.start) - region.start
        duration.textContent = dur > 0 ? dur.toFixed(2) + 's' : '--'

        var deleteBtn = createElement('button', {
          className: 'ws-region-delete',
          'aria-label': 'Delete region',
        })
        deleteBtn.innerHTML = deleteSVG

        row.appendChild(colorBlock)
        row.appendChild(label)
        row.appendChild(startTime)
        row.appendChild(endTime)
        row.appendChild(duration)
        row.appendChild(deleteBtn)

        row.addEventListener('click', function (e) {
          if (e.target.closest('.ws-region-delete')) return
          if (selectedRow) selectedRow.classList.remove('selected')
          row.classList.add('selected')
          selectedRow = row
          wavesurfer.setTime(region.start)
        })

        row.addEventListener('dblclick', function () {
          toggleEdit(region, row)
        })

        deleteBtn.addEventListener('click', function (e) {
          e.stopPropagation()
          region.remove()
        })

        return row
      }

      function toggleEdit(region, row) {
        if (editForm) {
          editForm.remove()
          editForm = null
          if (editingRegion === region) {
            editingRegion = null
            return
          }
        }

        editingRegion = region
        editForm = createElement('div', { className: 'ws-region-edit' })

        var labelField = createElement('div', { className: 'ws-region-edit-field' })
        labelField.appendChild(createElement('label', {}, 'Label'))
        var labelInput = createElement('input', {
          type: 'text',
          value: (typeof region.content === 'string' ? region.content : (region.content && region.content.textContent)) || '',
        })
        labelField.appendChild(labelInput)

        var colorField = createElement('div', { className: 'ws-region-edit-field' })
        colorField.appendChild(createElement('label', {}, 'Color'))
        var colorInput = createElement('input', {
          type: 'color',
          value: rgbaToHex(region.color),
        })
        colorField.appendChild(colorInput)

        var startField = createElement('div', { className: 'ws-region-edit-field' })
        startField.appendChild(createElement('label', {}, 'Start (s)'))
        var startInput = createElement('input', {
          type: 'number',
          step: '0.01',
          min: '0',
          value: region.start.toFixed(2),
        })
        startField.appendChild(startInput)

        var endField = createElement('div', { className: 'ws-region-edit-field' })
        endField.appendChild(createElement('label', {}, 'End (s)'))
        var endInput = createElement('input', {
          type: 'number',
          step: '0.01',
          min: '0',
          value: (region.end || region.start).toFixed(2),
        })
        endField.appendChild(endInput)

        editForm.appendChild(labelField)
        editForm.appendChild(colorField)
        editForm.appendChild(startField)
        editForm.appendChild(endField)

        function applyChanges() {
          var newStart = parseFloat(startInput.value)
          var newEnd = parseFloat(endInput.value)
          var newLabel = labelInput.value
          var newColor = colorInput.value

          if (isNaN(newStart)) newStart = region.start
          if (isNaN(newEnd)) newEnd = region.end || region.start

          region.setOptions({
            start: newStart,
            end: newEnd,
            content: newLabel,
            color: newColor,
          })
        }

        var debounceTimer
        ;[labelInput, colorInput, startInput, endInput].forEach(function (input) {
          input.addEventListener('input', function () {
            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(applyChanges, 300)
          })
          input.addEventListener('change', applyChanges)
        })

        row.after(editForm)
      }

      function rgbaToHex(color) {
        if (!color) return '#000000'
        if (color.startsWith('#')) return color.length > 7 ? color.slice(0, 7) : color
        var match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (!match) return '#000000'
        var r = parseInt(match[1], 10)
        var g = parseInt(match[2], 10)
        var b = parseInt(match[3], 10)
        return '#' + [r, g, b].map(function (v) { return v.toString(16).padStart(2, '0') }).join('')
      }

      function renderList() {
        listBody.innerHTML = ''
        if (editForm) {
          editForm.remove()
          editForm = null
          editingRegion = null
        }
        selectedRow = null

        var regions = regionsPlugin.getRegions()
        regions.forEach(function (region) {
          var row = createRow(region)
          listBody.appendChild(row)
        })

        updateStats()
      }

      function updateStats() {
        var regions = regionsPlugin.getRegions()
        var count = regions.length
        var totalDuration = wavesurfer.getDuration() || 0

        var intervals = []
        regions.forEach(function (r) {
          if (r.end !== undefined && r.end > r.start) {
            intervals.push([r.start, r.end])
          }
        })
        intervals.sort(function (a, b) { return a[0] - b[0] })

        var merged = []
        intervals.forEach(function (interval) {
          if (merged.length === 0 || merged[merged.length - 1][1] < interval[0]) {
            merged.push([interval[0], interval[1]])
          } else {
            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], interval[1])
          }
        })

        var coverageDuration = 0
        merged.forEach(function (m) {
          coverageDuration += m[1] - m[0]
        })

        var coveragePercent = totalDuration > 0 ? ((coverageDuration / totalDuration) * 100).toFixed(1) : '0.0'

        stats.innerHTML =
          '<span><strong>' + count + '</strong> regions</span>' +
          '<span>Coverage: <strong>' + coverageDuration.toFixed(1) + 's</strong></span>' +
          '<span>Cover: <strong>' + coveragePercent + '%</strong></span>'
      }

      var unsubFns = []

      function onPlugin(event, fn) {
        regionsPlugin.on(event, fn)
        unsubFns.push(function () {
          regionsPlugin.un(event, fn)
        })
      }

      onPlugin('region-created', function () {
        renderList()
      })
      onPlugin('region-removed', function () {
        renderList()
      })
      onPlugin('region-updated', function () {
        renderList()
      })

      renderList()

      return {
        destroy: function () {
          unsubFns.forEach(function (fn) {
            fn()
          })
          wrapper.remove()
        },
      }
    },
  }

  WS.RegionList = RegionList
})()
