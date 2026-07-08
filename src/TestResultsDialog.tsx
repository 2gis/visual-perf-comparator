import { useState } from 'react'
import type { TestResults } from './tests/measureRender'
import { DEFAULT_MAPGL_URL } from './constants'
import './TestResultsDialog.css'

export interface TestMeta {
  scenario: string
  iterations: number
  speedMultiplier: number
  warmup: boolean
  leftOptions: Record<string, unknown>
  rightOptions: Record<string, unknown>
  leftUrl: string
  rightUrl: string
  styleId: string
}

interface TestResultsDialogProps {
  open: boolean
  onClose: () => void
  leftResults: TestResults | null
  rightResults: TestResults | null
  meta?: TestMeta | null
}

function formatDiff(left: string, right: string): { text: string; color: string } {
  const l = parseFloat(left)
  const r = parseFloat(right)
  if (isNaN(l) || isNaN(r)) return { text: '—', color: '#888' }
  const diff = l - r
  const sign = diff > 0 ? '+' : ''
  return {
    text: `${sign}${diff.toFixed(2)}`,
    color: diff > 0 ? '#27ae60' : diff < 0 ? '#e74c3c' : '#888',
  }
}

function StatsTable({
  label,
  left,
  right,
}: {
  label: string
  left: Record<string, string>
  right: Record<string, string>
}) {
  const keys = Object.keys(left)
  if (keys.length === 0) return null

  return (
    <div className="results-section">
      <h3 className="results-section-title">{label}</h3>
      <table className="results-table">
        <thead>
          <tr>
            <th>Перцентиль</th>
            <th>Левая</th>
            <th>Правая</th>
            <th>Разница</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => {
            const diff = formatDiff(left[k], right[k])
            return (
              <tr key={k}>
                <td>{k}</td>
                <td>{left[k]}</td>
                <td>{right[k]}</td>
                <td style={{ color: diff.color, fontWeight: 600 }}>{diff.text}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TimelineChart({
  leftTimeline,
  rightTimeline,
}: {
  leftTimeline: number[]
  rightTimeline: number[]
}) {
  // Trim first and last second from timeline
  const leftTrimmed = leftTimeline.length > 2 
    ? leftTimeline.slice(1, -1) 
    : []
  const rightTrimmed = rightTimeline.length > 2 
    ? rightTimeline.slice(1, -1) 
    : []

  if (leftTrimmed.length === 0 && rightTrimmed.length === 0) return null

  const maxLength = Math.max(leftTrimmed.length, rightTrimmed.length, 1)
  const maxValue = Math.max(
    ...leftTrimmed, 
    ...rightTrimmed, 
    30
  )
  const width = 600
  const height = 200
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const getX = (i: number) => padding + (i / (maxLength - 1 || 1)) * chartWidth
  const getY = (v: number) => padding + chartHeight - (v / maxValue) * chartHeight

  const leftPath = leftTrimmed
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`)
    .join(' ')
  const rightPath = rightTrimmed
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`)
    .join(' ')

  return (
    <div className="results-section">
      <h3 className="results-section-title">FPS по секундам</h3>
      <div className="timeline-chart">
        <svg width={width} height={height}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <g key={ratio}>
              <line
                x1={padding}
                y1={getY(maxValue * ratio)}
                x2={width - padding}
                y2={getY(maxValue * ratio)}
                stroke="#eee"
                strokeDasharray="3,3"
              />
              <text
                x={padding - 5}
                y={getY(maxValue * ratio)}
                textAnchor="end"
                fontSize="10"
                fill="#888"
              >
                {Math.round(maxValue * ratio)}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {[0, Math.floor(maxLength / 2), maxLength - 1].map((i) => (
            <text
              key={i}
              x={getX(i)}
              y={height - 10}
              textAnchor="middle"
              fontSize="10"
              fill="#888"
            >
              {i + 1}с
            </text>
          ))}

          {/* Left timeline */}
          <path
            d={leftPath}
            fill="none"
            stroke="#3498db"
            strokeWidth="2"
          />

          {/* Right timeline */}
          <path
            d={rightPath}
            fill="none"
            stroke="#e74c3c"
            strokeWidth="2"
          />

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize="11"
            fill="#333"
          >
            Время (секунды)
          </text>
          <text
            x={10}
            y={height / 2}
            textAnchor="middle"
            fontSize="11"
            fill="#333"
            transform={`rotate(-90, 10, ${height / 2})`}
          >
            FPS
          </text>
        </svg>

        <div className="timeline-legend">
          <span style={{ color: '#3498db' }}>● Левая карта</span>
          <span style={{ color: '#e74c3c' }}>● Правая карта</span>
        </div>
      </div>
    </div>
  )
}

function TestResultsDialog({
  open,
  onClose,
  leftResults,
  rightResults,
  meta,
}: TestResultsDialogProps) {
  const [copied, setCopied] = useState(false)

  if (!open || !leftResults || !rightResults) return null

  const handleCopy = () => {
    const lines: string[] = []

    // Header
    lines.push('=== Benchmark Report ===')
    lines.push(`Дата: ${new Date().toLocaleString('ru-RU')}`)
    lines.push(`Экран: ${window.screen.width}×${window.screen.height} (viewport ${window.innerWidth}×${window.innerHeight})`)
    lines.push(`devicePixelRatio: ${window.devicePixelRatio}`)
    lines.push('')

    // Test settings
    if (meta) {
      lines.push('--- Настройки теста ---')
      lines.push(`Сценарий: ${meta.scenario}`)
      lines.push(`Итерации: ${meta.iterations}`)
      lines.push(`Скорость: ${meta.speedMultiplier}x`)
      lines.push(`Прогрев кэша: ${meta.warmup ? 'да' : 'нет'}`)
      lines.push(`Стиль: ${meta.styleId}`)
      lines.push('')

      // Engine URLs (only if non-default)
      const defaultUrl = DEFAULT_MAPGL_URL
      const leftIsCustom = meta.leftUrl && meta.leftUrl !== defaultUrl
      const rightIsCustom = meta.rightUrl && meta.rightUrl !== defaultUrl
      if (leftIsCustom || rightIsCustom) {
        lines.push('--- MapGL источники ---')
        lines.push(`Левая: ${meta.leftUrl || defaultUrl}`)
        lines.push(`Правая: ${meta.rightUrl || defaultUrl}`)
        lines.push('')
      }

      // Map options
      lines.push('--- Опции левой карты ---')
      lines.push(JSON.stringify(meta.leftOptions, null, 2))
      lines.push('')
      lines.push('--- Опции правой карты ---')
      lines.push(JSON.stringify(meta.rightOptions, null, 2))
      lines.push('')
    }

    // Stats helper
    const formatStatsBlock = (label: string, left: Record<string, string>, right: Record<string, string>) => {
      const keys = Object.keys(left)
      if (keys.length === 0) return
      lines.push(`--- ${label} ---`)
      lines.push(`${'Перцентиль'.padEnd(12)} ${'Левая'.padEnd(10)} ${'Правая'.padEnd(10)} Разница`)
      for (const k of keys) {
        const diff = formatDiff(left[k], right[k])
        lines.push(`${k.padEnd(12)} ${left[k].padEnd(10)} ${right[k].padEnd(10)} ${diff.text}`)
      }
      lines.push('')
    }

    formatStatsBlock('FPS', leftResults.fps, rightResults.fps)
    formatStatsBlock('Bad FPS (≤20)', leftResults.badfps, rightResults.badfps)

    lines.push('--- Глитчи ---')
    lines.push(`Левая: ${leftResults.glitches}  Правая: ${rightResults.glitches}  Δ ${leftResults.glitches - rightResults.glitches}`)
    lines.push('')

    formatStatsBlock('Draw calls', leftResults.draws, rightResults.draws)
    formatStatsBlock('Tiles', leftResults.tiles, rightResults.tiles)
    formatStatsBlock('Vertices (M)', leftResults.vertices, rightResults.vertices)

    // Timeline
    if (leftResults.timeline.length > 0 || rightResults.timeline.length > 0) {
      const leftTrimmed = leftResults.timeline.length > 2 ? leftResults.timeline.slice(1, -1) : leftResults.timeline
      const rightTrimmed = rightResults.timeline.length > 2 ? rightResults.timeline.slice(1, -1) : rightResults.timeline
      const maxLen = Math.max(leftTrimmed.length, rightTrimmed.length)
      lines.push('--- FPS по секундам ---')
      lines.push(`${'Сек'.padEnd(6)} ${'Левая'.padEnd(8)} Правая`)
      for (let i = 0; i < maxLen; i++) {
        const l = leftTrimmed[i] !== undefined ? String(leftTrimmed[i]) : '—'
        const r = rightTrimmed[i] !== undefined ? String(rightTrimmed[i]) : '—'
        lines.push(`${String(i + 1).padEnd(6)} ${l.padEnd(8)} ${r}`)
      }
      lines.push('')
    }

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="results-overlay" onClick={onClose}>
      <div className="results-window" onClick={(e) => e.stopPropagation()}>
        <h2 className="results-title">Результаты теста</h2>

        <StatsTable label="FPS" left={leftResults.fps} right={rightResults.fps} />
        <StatsTable label="Bad FPS (≤20)" left={leftResults.badfps} right={rightResults.badfps} />

        <div className="results-section">
          <h3 className="results-section-title">Глитчи</h3>
          <div className="results-single-row">
            <span>Левая: <strong>{leftResults.glitches}</strong></span>
            <span>Правая: <strong>{rightResults.glitches}</strong></span>
            <span style={{
              color: leftResults.glitches < rightResults.glitches ? '#27ae60'
                : leftResults.glitches > rightResults.glitches ? '#e74c3c' : '#888',
              fontWeight: 600,
            }}>
              Δ {leftResults.glitches - rightResults.glitches}
            </span>
          </div>
        </div>

        <StatsTable label="Draw calls" left={leftResults.draws} right={rightResults.draws} />
        <StatsTable label="Tiles" left={leftResults.tiles} right={rightResults.tiles} />
        <StatsTable label="Vertices (M)" left={leftResults.vertices} right={rightResults.vertices} />

        <TimelineChart
          leftTimeline={leftResults.timeline}
          rightTimeline={rightResults.timeline}
        />

        <div className="results-actions">
          <button className="results-btn copy" onClick={handleCopy}>
            {copied ? '✓ Скопировано' : '📋 Скопировать результат'}
          </button>
          <button className="results-btn" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

export default TestResultsDialog
