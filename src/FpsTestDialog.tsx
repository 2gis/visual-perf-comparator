import { useState } from 'react'
import './FpsTestDialog.css'
import { scenarios } from './tests/scenarios'

interface FpsTestDialogProps {
  open: boolean
  onClose: () => void
  onStart: (settings: FpsTestSettings) => void
}

export interface FpsTestSettings {
  warmupCache: boolean
  iterations: number
  scenario: string
  speedMultiplier: number // 1 = normal, 2 = 2x faster, 3 = 3x faster
}

function FpsTestDialog({ open, onClose, onStart }: FpsTestDialogProps) {
  const [warmupCache, setWarmupCache] = useState(true)
  const [iterations, setIterations] = useState(3)
  const scenarioNames = Object.keys(scenarios)
  const [scenario, setScenario] = useState(scenarioNames[0] ?? '')
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2 | 3>(1)

  if (!open) return null

  const handleStart = () => {
    onStart({ warmupCache, iterations, scenario, speedMultiplier })
    onClose()
  }

  return (
    <div className="fps-test-overlay" onClick={onClose}>
      <div className="fps-test-window" onClick={(e) => e.stopPropagation()}>
        <h2 className="fps-test-title">Тест производительности</h2>
        <p className="fps-test-desc">
          Замер FPS и времени рендера кадров для обеих карт.
        </p>

        <div className="fps-test-field">
          <label className="fps-test-label" htmlFor="scenario">
            Сценарий пролёта
          </label>
          <select
            id="scenario"
            className="fps-test-select"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
          >
            {scenarioNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="fps-test-field">
          <label className="fps-test-label fps-test-checkbox-label">
            <input
              type="checkbox"
              checked={warmupCache}
              onChange={(e) => setWarmupCache(e.target.checked)}
            />
            Прогрев кэша
          </label>
        </div>

        <div className="fps-test-field">
          <label className="fps-test-label" htmlFor="iterations">
            Количество повторов
          </label>
          <input
            id="iterations"
            className="fps-test-input"
            type="number"
            min={1}
            max={100}
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
          />
        </div>

        <div className="fps-test-field">
          <label className="fps-test-label" htmlFor="speed">
            Скорость сценария
          </label>
          <select
            id="speed"
            className="fps-test-select"
            value={speedMultiplier}
            onChange={(e) => setSpeedMultiplier(Number(e.target.value) as 1 | 2 | 3)}
          >
            <option value={1}>Обычная (1x)</option>
            <option value={2}>Ускоренная 2x</option>
            <option value={3}>Ускоренная 3x</option>
          </select>
        </div>

        <div className="fps-test-actions">
          <button className="fps-test-btn cancel" onClick={onClose}>
            Отмена
          </button>
          <button className="fps-test-btn start" onClick={handleStart}>
            ▶ Запустить
          </button>
        </div>
      </div>
    </div>
  )
}

export default FpsTestDialog
