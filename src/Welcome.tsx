import { useEffect, useState } from 'react'
import './Welcome.css'
import { DEFAULT_STYLE_ID, MAP_STYLES } from './constants'

export interface MapOptions {
  center?: [number, number]
  zoom?: number
  style?: string
  [key: string]: unknown
}

const EMPTY_OPTIONS: MapOptions = {
  "styleState": {
    "immersiveRoadsOn": true,
    "graphicsPreset": "immersive"
  }
}

interface WelcomeProps {
  onSubmit?: (
    apiKey: string,
    leftOptions: MapOptions,
    rightOptions: MapOptions,
    leftUrl: string,
    rightUrl: string,
    styleId: string
  ) => void
  initialKey?: string
  initialLeftOptions?: MapOptions
  initialRightOptions?: MapOptions
  initialLeftUrl?: string
  initialRightUrl?: string
  initialStyleId?: string
}

function Welcome({
  onSubmit,
  initialKey = '',
  initialLeftOptions = EMPTY_OPTIONS,
  initialRightOptions = EMPTY_OPTIONS,
  initialLeftUrl = '',
  initialRightUrl = '',
  initialStyleId = DEFAULT_STYLE_ID,
}: WelcomeProps) {
  const [visible, setVisible] = useState(false)
  const [apiKey, setApiKey] = useState(initialKey)
  const [styleId, setStyleId] = useState(initialStyleId)
  const [leftUrl, setLeftUrl] = useState(initialLeftUrl)
  const [rightUrl, setRightUrl] = useState(initialRightUrl)
  const [leftOptionsText, setLeftOptionsText] = useState(
    JSON.stringify(initialLeftOptions, null, 2)
  )
  const [rightOptionsText, setRightOptionsText] = useState(
    JSON.stringify(initialRightOptions, null, 2)
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = () => {
    let leftOptions: MapOptions
    let rightOptions: MapOptions
    try {
      leftOptions = JSON.parse(leftOptionsText)
    } catch {
      setError('Неверный JSON в опциях левой карты')
      return
    }
    try {
      rightOptions = JSON.parse(rightOptionsText)
    } catch {
      setError('Неверный JSON в опциях правой карты')
      return
    }
    setError(null)
    setVisible(false)
    setTimeout(
      () =>
        onSubmit?.(
          apiKey,
          leftOptions,
          rightOptions,
          leftUrl,
          rightUrl,
          styleId
        ),
      300
    )
  }

  return (
    <div className={`welcome-overlay ${visible ? 'visible' : ''}`}>
      <div className="welcome-window">
        <h1 className="welcome-title">Добро пожаловать!</h1>
        <p className="welcome-text">
          Visual Perf Comparator — приложение для сравнения визуализации карт.
        </p>
        <div className="welcome-input-group">
          <label className="welcome-label" htmlFor="apiKey">
            Ввести ключ к карте
          </label>
          <input
            id="apiKey"
            className="welcome-input"
            type="text"
            value={apiKey}
            placeholder="Введите API-ключ 2GIS"
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <div className="welcome-input-group">
          <label className="welcome-label" htmlFor="styleSelect">
            Стиль карты
          </label>
          <select
            id="styleSelect"
            className="welcome-select"
            value={
              Object.values(MAP_STYLES).includes(styleId)
                ? styleId
                : 'custom'
            }
            onChange={(e) => {
              if (e.target.value !== 'custom') {
                setStyleId(e.target.value)
              }
            }}
          >
            {Object.entries(MAP_STYLES).map(([name, id]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
            <option value="custom" disabled={Object.values(MAP_STYLES).includes(styleId)}>
              ── Свой ID стиля ──
            </option>
          </select>
          <input
            id="styleId"
            className="welcome-input"
            type="text"
            value={styleId}
            placeholder="Введите ID стиля вручную"
            onChange={(e) => setStyleId(e.target.value)}
          />
        </div>
        <div className="welcome-options-row">
          <div className="welcome-input-group">
            <label className="welcome-label" htmlFor="leftUrl">
              MapGL левой карты
            </label>
            <input
              id="leftUrl"
              className="welcome-input"
              type="text"
              value={leftUrl}
              placeholder="https://mapgl.2gis.com/api/js (по умолчанию)"
              onChange={(e) => setLeftUrl(e.target.value)}
            />
            <label className="welcome-label" htmlFor="leftOptions">
              Опции левой карты (JSON)
            </label>
            <textarea
              id="leftOptions"
              className="welcome-textarea"
              value={leftOptionsText}
              onChange={(e) => setLeftOptionsText(e.target.value)}
              rows={6}
              spellCheck={false}
            />
          </div>
          <div className="welcome-input-group">
            <label className="welcome-label" htmlFor="rightUrl">
              MapGL правой карты
            </label>
            <input
              id="rightUrl"
              className="welcome-input"
              type="text"
              value={rightUrl}
              placeholder="https://mapgl.2gis.com/api/js (по умолчанию)"
              onChange={(e) => setRightUrl(e.target.value)}
            />
            <label className="welcome-label" htmlFor="rightOptions">
              Опции правой карты (JSON)
            </label>
            <textarea
              id="rightOptions"
              className="welcome-textarea"
              value={rightOptionsText}
              onChange={(e) => setRightOptionsText(e.target.value)}
              rows={6}
              spellCheck={false}
            />
          </div>
        </div>
        {error && <p className="welcome-error">{error}</p>}
        <button
          className="welcome-button"
          onClick={handleSubmit}
          disabled={!apiKey.trim()}
        >
          Начать работу
        </button>
      </div>
    </div>
  )
}

export default Welcome
