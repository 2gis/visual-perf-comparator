import { useEffect, useRef, useState } from 'react'

import './App.css'
import Map, { type MapHandle } from './Map'
import Welcome from './Welcome'
import ModeSelector, { type Mode } from './ModeSelector'
import FpsTestDialog, { type FpsTestSettings } from './FpsTestDialog'
import TestResultsDialog, { type TestMeta } from './TestResultsDialog'
import { measureRender, type TestResults } from './tests/measureRender'
import { DEFAULT_STYLE_ID, STORAGE_KEYS } from './constants'

interface MapOptions {
  center?: [number, number]
  zoom?: number
  style?: string
  [key: string]: unknown
}

const EMPTY_OPTIONS: MapOptions = {}

interface UrlConfig {
  apiKey: string
  leftOptions: MapOptions
  rightOptions: MapOptions
  leftUrl: string
  rightUrl: string
  styleId: string
  mode: Mode
  view?: {
    center: [number, number]
    zoom: number
    pitch: number
    rotation: number
  }
}

function encodeConfig(config: UrlConfig): string {
  return btoa(encodeURIComponent(JSON.stringify(config)))
}

function decodeConfig(encoded: string): UrlConfig | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)))
  } catch {
    return null
  }
}

function getUrlConfig(): UrlConfig | null {
  const params = new URLSearchParams(window.location.search)
  const cfg = params.get('cfg')
  if (!cfg) return null
  return decodeConfig(cfg)
}

function updateUrlConfig(config: UrlConfig) {
  const encoded = encodeConfig(config)
  const url = new URL(window.location.href)
  url.searchParams.set('cfg', encoded)
  window.history.replaceState({}, '', url.toString())
}

function safeParse(value: string | null, fallback: MapOptions): MapOptions {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value)
    return parsed
  } catch {
    return fallback
  }
}

function App() {
  const urlConfig = useRef(getUrlConfig())

  const [state] = useState<{
    apiKey: string
    leftOptions: MapOptions
    rightOptions: MapOptions
    leftUrl: string
    rightUrl: string
    styleId: string
  } | null>(urlConfig.current ? {
    apiKey: urlConfig.current.apiKey,
    leftOptions: urlConfig.current.leftOptions,
    rightOptions: urlConfig.current.rightOptions,
    leftUrl: urlConfig.current.leftUrl,
    rightUrl: urlConfig.current.rightUrl,
    styleId: urlConfig.current.styleId,
  } : null)

  const [mode, setMode] = useState<Mode>(urlConfig.current?.mode ?? 'side-by-side')
  const [showWelcome, setShowWelcome] = useState(!urlConfig.current)
  const [fpsTestOpen, setFpsTestOpen] = useState(false)
  const [testRunning, setTestRunning] = useState(false)
  const [testProgress, setTestProgress] = useState('')
  const [testResults, setTestResults] = useState<{
    left: TestResults | null
    right: TestResults | null
  }>({ left: null, right: null })
  const [testMeta, setTestMeta] = useState<TestMeta | null>(null)
  const [showResults, setShowResults] = useState(false)
  const prevMode = useRef<Mode>('side-by-side')

  const leftMapRef = useRef<MapHandle>(null)
  const rightMapRef = useRef<MapHandle>(null)
  // Флаг готовности карт
  const [mapsReady, setMapsReady] = useState(false)

  const handleLeftReady = () => {
    setMapsReady(true)
    // Если из URL есть сохранённый view — применяем
    const cfg = urlConfig.current
    if (cfg?.view) {
      const map = leftMapRef.current?.getMap()
      if (map) {
        map.setCenter(cfg.view.center, { animate: false } as never)
        map.setZoom(cfg.view.zoom, { animate: false } as never)
        map.setPitch(cfg.view.pitch, { animate: false } as never)
        map.setRotation(cfg.view.rotation, { animate: false } as never)
      }
    }
  }
  const handleRightReady = () => setMapsReady(true)

  const handleSubmit = (
    apiKey: string,
    leftOptions: MapOptions,
    rightOptions: MapOptions,
    leftUrl: string,
    rightUrl: string,
    styleId: string
  ) => {
    localStorage.setItem(STORAGE_KEYS.apiKey, apiKey)
    localStorage.setItem(STORAGE_KEYS.leftOptions, JSON.stringify(leftOptions))
    localStorage.setItem(STORAGE_KEYS.rightOptions, JSON.stringify(rightOptions))
    localStorage.setItem(STORAGE_KEYS.leftUrl, leftUrl)
    localStorage.setItem(STORAGE_KEYS.rightUrl, rightUrl)
    localStorage.setItem(STORAGE_KEYS.styleId, styleId)
    const newState = { apiKey, leftOptions, rightOptions, leftUrl, rightUrl, styleId }
    updateUrlConfig({ ...newState, mode })
    window.location.reload()
  }

  const handleStartFpsTest = async (settings: FpsTestSettings) => {
    if (!state || !mapsReady) return

    const leftMap = leftMapRef.current?.getMap()
    const rightMap = rightMapRef.current?.getMap()
    if (!leftMap || !rightMap) return

    prevMode.current = mode
    setTestRunning(true)
    setTestResults({ left: null, right: null })
    setTestMeta({
      scenario: settings.scenario,
      iterations: settings.iterations,
      speedMultiplier: settings.speedMultiplier,
      warmup: settings.warmupCache,
      leftOptions: state.leftOptions,
      rightOptions: state.rightOptions,
      leftUrl: state.leftUrl,
      rightUrl: state.rightUrl,
      styleId: state.styleId,
    })

    // Тест левой карты: показываем только левую
    setMode('single-A')
    setTestProgress('Левая карта: подготовка...')
    await new Promise((r) => setTimeout(r, 500))

    setTestProgress('Левая карта: тест...')
    const leftResults = await measureRender(
      leftMap,
      settings.scenario,
      settings.iterations,
      settings.warmupCache,
      settings.speedMultiplier,
      (phase) => setTestProgress(`Левая карта: ${phase}`)
    )

    // Тест правой карты: показываем только правую
    setMode('single-B')
    setTestProgress('Правая карта: подготовка...')
    await new Promise((r) => setTimeout(r, 500))

    setTestProgress('Правая карта: тест...')
    const rightResults = await measureRender(
      rightMap,
      settings.scenario,
      settings.iterations,
      settings.warmupCache,
      settings.speedMultiplier,
      (phase) => setTestProgress(`Правая карта: ${phase}`)
    )

    setTestResults({ left: leftResults, right: rightResults })
    setTestRunning(false)
    setMode(prevMode.current)
    setShowResults(true)
  }

  const isSingleLeft = mode === 'single-A'
  const isSingleRight = mode === 'single-B'
  // Направление синхронизации: 'left' = left→right, 'right' = right→left
  const syncDirection = useRef<'left' | 'right'>('left')

  // Синхронизация вида между картами (однонаправленная, направление по mousedown)
  useEffect(() => {
    if (!state || !mapsReady || testRunning) return

    const leftMap = leftMapRef.current?.getMap() ?? null
    const rightMap = rightMapRef.current?.getMap() ?? null
    if (!leftMap || !rightMap) return

    // В single режимах фиксируем направление синхронизации
    if (mode === 'single-A') syncDirection.current = 'left'
    if (mode === 'single-B') syncDirection.current = 'right'

    const leftContainer = leftMap.getCanvas().parentElement!
    const rightContainer = rightMap.getCanvas().parentElement!

    const onLeftMouseDown = () => { syncDirection.current = 'left' }
    const onRightMouseDown = () => { syncDirection.current = 'right' }

    // Переключение направления по mousedown/wheel только в двухкартовых режимах
    if (mode !== 'single-A' && mode !== 'single-B') {
      leftContainer.addEventListener('mousedown', onLeftMouseDown, true)
      leftContainer.addEventListener('wheel', onLeftMouseDown, true)
      rightContainer.addEventListener('mousedown', onRightMouseDown, true)
      rightContainer.addEventListener('wheel', onRightMouseDown, true)
    }

    const onLeftMove = () => {
      if (syncDirection.current !== 'left') return
      rightMap.triggerRerender();
      rightMap.setCenter(leftMap.getCenter(), { animate: false } as never)
      rightMap.setZoom(leftMap.getZoom(), { animate: false } as never)
      rightMap.setPitch(leftMap.getPitch(), { animate: false } as never)
      rightMap.setRotation(leftMap.getRotation(), { animate: false } as never)
    }

    const onRightMove = () => {
      if (syncDirection.current !== 'right') return
      leftMap.triggerRerender();
      leftMap.setCenter(rightMap.getCenter(), { animate: false } as never)
      leftMap.setZoom(rightMap.getZoom(), { animate: false } as never)
      leftMap.setPitch(rightMap.getPitch(), { animate: false } as never)
      leftMap.setRotation(rightMap.getRotation(), { animate: false } as never)
    }

    leftMap.on('move', onLeftMove)
    rightMap.on('move', onRightMove)

    // Обновляем URL при завершении движения (moveend)
    const updateUrlView = () => {
      if (!state) return
      const source = syncDirection.current === 'left' ? leftMap : rightMap
      updateUrlConfig({
        ...state,
        mode,
        view: {
          center: source.getCenter() as [number, number],
          zoom: Math.round(source.getZoom() * 100) / 100,
          pitch: Math.round(source.getPitch() * 100) / 100,
          rotation: Math.round(source.getRotation() * 100) / 100,
        },
      })
    }
    leftMap.on('moveend', updateUrlView)
    rightMap.on('moveend', updateUrlView)

    return () => {
      leftMap.off('move', onLeftMove)
      rightMap.off('move', onRightMove)
      leftMap.off('moveend', updateUrlView)
      rightMap.off('moveend', updateUrlView)
      leftContainer.removeEventListener('mousedown', onLeftMouseDown, true)
      leftContainer.removeEventListener('wheel', onLeftMouseDown, true)
      rightContainer.removeEventListener('mousedown', onRightMouseDown, true)
      rightContainer.removeEventListener('wheel', onRightMouseDown, true)
    }
  }, [state, mapsReady, mode, testRunning])

  // Управление padding для режима "split"
  useEffect(() => {
    if (!state || !mapsReady) return

    const leftMap = leftMapRef.current?.getMap() ?? null
    const rightMap = rightMapRef.current?.getMap() ?? null
    if (!leftMap || !rightMap) return

    const applyPadding = () => {
      const containerWidth = window.innerWidth / 2
      const halfWidth = Math.floor(containerWidth)

      if (mode === 'split') {
        leftMap.setPadding({ top: 0, bottom: 0, right: 0, left: halfWidth }, { animate: false } as never)
        rightMap.setPadding({ top: 0, bottom: 0, right: halfWidth, left: 0 }, { animate: false } as never)
      } else {
        leftMap.setPadding({ top: 0, bottom: 0, left: 0, right: 0 }, { animate: false } as never)
        rightMap.setPadding({ top: 0, bottom: 0, left: 0, right: 0 }, { animate: false } as never)
      }
    }

    // Вызываем сразу и повторно после CSS-транзиции (flex анимация 300ms)
    applyPadding()
    const timer = setTimeout(applyPadding, 350)
    window.addEventListener('resize', applyPadding)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', applyPadding)
    }
  }, [state, mapsReady, mode])

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    if (state) {
      updateUrlConfig({ ...state, mode: newMode })
    }
  }

  return (
    <>
      {showWelcome && (
        <Welcome
          onSubmit={handleSubmit}
          initialKey={localStorage.getItem(STORAGE_KEYS.apiKey) ?? ''}
          initialLeftOptions={safeParse(
            localStorage.getItem(STORAGE_KEYS.leftOptions),
            EMPTY_OPTIONS
          )}
          initialRightOptions={safeParse(
            localStorage.getItem(STORAGE_KEYS.rightOptions),
            EMPTY_OPTIONS
          )}
          initialLeftUrl={localStorage.getItem(STORAGE_KEYS.leftUrl) ?? ''}
          initialRightUrl={localStorage.getItem(STORAGE_KEYS.rightUrl) ?? ''}
          initialStyleId={
            localStorage.getItem(STORAGE_KEYS.styleId) ?? DEFAULT_STYLE_ID
          }
        />
      )}
      {state && (
        <>
        <button className="settings-button" onClick={() => setShowWelcome(true)} title="Настройки">
          ⚙ Настройки
        </button>
        <ModeSelector mode={mode} onChange={handleModeChange} />
        <button className="fps-test-button" onClick={() => setFpsTestOpen(true)} disabled={testRunning}>
          ▶ Тест FPS
        </button>
        <FpsTestDialog
          open={fpsTestOpen}
          onClose={() => setFpsTestOpen(false)}
          onStart={handleStartFpsTest}
        />
        <TestResultsDialog
          open={showResults}
          onClose={() => setShowResults(false)}
          leftResults={testResults.left}
          rightResults={testResults.right}
          meta={testMeta}
        />
        {testRunning && (
          <div className="test-progress-overlay">
            <div className="test-progress-box">
              <div className="test-progress-spinner" />
              <span className="test-progress-text">{testProgress}</span>
            </div>
          </div>
        )}
        <div className="split-container">
          <div className={`left-half ${isSingleRight ? 'hidden' : ''} ${isSingleLeft ? 'full' : ''}`}>
            <Map
              ref={leftMapRef}
              apiKey={state.apiKey}
              options={state.leftOptions}
              engineUrl={state.leftUrl || undefined}
              styleId={state.styleId}
              onReady={handleLeftReady}
            />
          </div>
          <div className={`right-half ${isSingleLeft ? 'hidden' : ''} ${isSingleRight ? 'full' : ''}`}>
            <Map
              ref={rightMapRef}
              apiKey={state.apiKey}
              options={state.rightOptions}
              engineUrl={state.rightUrl || undefined}
              styleId={state.styleId}
              onReady={handleRightReady}
            />
          </div>
        </div>
        </>
      )}
    </>
  )
}

export default App
