import { useEffect, useRef, useState } from 'react'

import './App.css'
import Map, { type MapHandle } from './Map'
import type { Map as MapGL } from '@2gis/mapgl/types'
import Welcome from './Welcome'
import ModeSelector, { type Mode } from './ModeSelector'
import FpsTestDialog, { type FpsTestSettings } from './FpsTestDialog'
import TestResultsDialog, { type TestMeta } from './TestResultsDialog'
import { measureRender, type TestResults } from './tests/measureRender'
import { DEFAULT_STYLE_ID, STORAGE_KEYS } from './constants'

interface Preset {
  name: string
  style: string
  left: {
    mapglUrl: string
    options: MapOptions
  }
  right: {
    mapglUrl: string
    options: MapOptions
  }
}

interface LocationPreset {
  label: string
  center: [number, number]
  zoom?: number
  pitch?: number
  rotation?: number
}

const PRESETS: Preset[] = [{
  name: "MSAA vs TAA",
  style: "eb10e2c3-3c28-4b81-b74b-859c9c4cf47e",
  left: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "msaa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  },
  right: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "taa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  }
},
{
  name: "FXAA vs TAA",
  style: "eb10e2c3-3c28-4b81-b74b-859c9c4cf47e",
  left: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "fxaa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  },
  right: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "taa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  }
},
{
  name: "SMAA vs TAA",
  style: "eb10e2c3-3c28-4b81-b74b-859c9c4cf47e",
  left: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "smaa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  },
  right: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "taa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  }
},
{
  name: "MSAA vs SMAA",
  style: "eb10e2c3-3c28-4b81-b74b-859c9c4cf47e",
  left: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "msaa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  },
  right: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "smaa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  }
},


{
  name: "MSAA downaScaler:Auto vs TAA",
  style: "eb10e2c3-3c28-4b81-b74b-859c9c4cf47e",
  left: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "msaa",
      "downscaler": "auto",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  },
  right: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "taa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  }
},
{
  name: "FXAA downaScaler:Auto vs TAA",
  style: "eb10e2c3-3c28-4b81-b74b-859c9c4cf47e",
  left: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "fxaa",
      "downscaler": "auto",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  },
  right: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "taa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  }
},
{
  name: "SMAA downaScaler:Auto vs TAA",
  style: "eb10e2c3-3c28-4b81-b74b-859c9c4cf47e",
  left: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "smaa",
      "downscaler": "auto",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  },
  right: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "taa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  }
},
{
  name: "TAA downaScaler:Auto vs TAA",
  style: "eb10e2c3-3c28-4b81-b74b-859c9c4cf47e",
  left: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "taa",
      "downscaler": "auto",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  },
  right: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "taa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  }
},
{
  name: "SMAA downaScaler:Auto vs SMAA",
  style: "eb10e2c3-3c28-4b81-b74b-859c9c4cf47e",
  left: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "smaa",
      "downscaler": "auto",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  },
  right: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "smaa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  }
},
{
  name: "MSAA downaScaler:Auto vs MSAA",
  style: "eb10e2c3-3c28-4b81-b74b-859c9c4cf47e",
  left: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "msaa",
      "downscaler": "auto",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  },
  right: {
    mapglUrl: "https://mapgl.2gis.com/api/js/v0.0.409",
    options: {
      "zoom": 18,
      "antiAliasingMode": "msaa",
      "downscaler": "none",
      "styleState": {
        "immersiveRoadsOn": true
      }
    }
  }
},
]
const LOCATIONS: LocationPreset[] = [
  {
    label: 'ВДНХ - вход',
    center: [37.63760896115528, 55.82633369374944],
    pitch: 66,
    rotation: 40.8,
    zoom: 18.7,
  },
  {
    label: 'ВДНХ - канатка',
    center: [37.627627325649094, 55.829703990749145],
    pitch: 64,
    zoom: 18.9,
    rotation: 1,
  },
  {
    label: 'ВДНХ - ракета',
    center: [37.62297572561757, 55.83425861753578],
    pitch: 65,
    zoom: 18.9,
    rotation: 48.7,
  },
  {
    label: 'Сочи - парк',
    center: [39.963559768455305, 43.4047978051997],
    pitch: 65,
    zoom: 18.9,
    rotation: -77,
  }, {
    label: 'Новосибирск - колесо',
    center: [82.93896066965088, 55.005952814414606],
    pitch: 70,
    zoom: 19.1,
    rotation: 27.3,
  },
]

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
  console.log('visual-perf-comparator v.0.8.1')
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

  const [mode, setMode] = useState<Mode>(urlConfig.current?.mode ?? 'split')
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
  const [locationOpen, setLocationOpen] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  const locationRef = useRef<HTMLDivElement>(null)
  const presetRef = useRef<HTMLDivElement>(null)
  const prevMode = useRef<Mode>('split')

  const leftMapRef = useRef<MapHandle>(null)
  const rightMapRef = useRef<MapHandle>(null)
  const mapsReadyRef = useRef(0)
  // Флаг готовности карт
  const [mapsReady, setMapsReady] = useState(0)

  // Синхронизируем ref со state
  mapsReadyRef.current = mapsReady

  const waitForMap = async (
    mapRef: React.RefObject<MapHandle | null>,
    readyRef: React.MutableRefObject<number>
  ): Promise<MapGL> => {
    const targetMapsReady = readyRef.current + 1
    while (true) {
      const map = mapRef.current?.getMap()
      if (map && readyRef.current >= targetMapsReady) {
        return map
      }
      await new Promise((r) => setTimeout(r, 50))
    }
  }

  const needRestoreCamera = useRef<'left' | 'right' | null>(null)
  const savedCamera = useRef<{
    center: [number, number]
    zoom: number
    pitch: number
    rotation: number
  } | null>(null)

  const saveCameraFromMap = (map: MapGL) => {
    savedCamera.current = {
      center: map.getCenter() as [number, number],
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      rotation: map.getRotation(),
    }
  }

  const restoreCameraToMap = (map: MapGL) => {
    const cam = savedCamera.current
    if (!cam) return
    map.setCenter(cam.center, { animate: false } as never)
    map.setZoom(cam.zoom, { animate: false } as never)
    map.setPitch(cam.pitch, { animate: false } as never)
    map.setRotation(cam.rotation, { animate: false } as never)
  }

  const handleLeftReady = () => {
    setMapsReady(v => v + 1)
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
    // Если карта восстанавливается — применяем сохранённые координаты
    if (needRestoreCamera.current === 'left') {
      needRestoreCamera.current = null
      setTimeout(() => {
        const map = leftMapRef.current?.getMap()
        if (map) restoreCameraToMap(map)
      }, 100)
    }
  }
  const handleRightReady = () => {
    setMapsReady(v => v + 1)
    // Если карта восстанавливается — применяем сохранённые координаты
    if (needRestoreCamera.current === 'right') {
      needRestoreCamera.current = null
      setTimeout(() => {
        const map = rightMapRef.current?.getMap()
        if (map) restoreCameraToMap(map)
      }, 100)
    }
  }

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

    // Ждём, пока левая карта загрузится и станет доступна
    const leftMap = await waitForMap(leftMapRef, mapsReadyRef)
    await new Promise((r) => setTimeout(r, 300))

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

    // Ждём, пока правая карта загрузится и станет доступна
    const rightMap = await waitForMap(rightMapRef, mapsReadyRef)

    await new Promise((r) => setTimeout(r, 300))

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
      rightMap.setCenter(leftMap.getCenter(), { animate: false } as never)
      rightMap.setZoom(leftMap.getZoom(), { animate: false } as never)
      rightMap.setPitch(leftMap.getPitch(), { animate: false } as never)
      rightMap.setRotation(leftMap.getRotation(), { animate: false } as never)
      rightMap.triggerRerender();
    }

    const onRightMove = () => {
      if (syncDirection.current !== 'right') return
      leftMap.setCenter(rightMap.getCenter(), { animate: false } as never)
      leftMap.setZoom(rightMap.getZoom(), { animate: false } as never)
      leftMap.setPitch(rightMap.getPitch(), { animate: false } as never)
      leftMap.setRotation(rightMap.getRotation(), { animate: false } as never)
      leftMap.triggerRerender();
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
    // При смене режима, когда одна карта будет демонтирована,
    // сохраняем координаты активной карты
    const leftMap = leftMapRef.current?.getMap()
    const rightMap = rightMapRef.current?.getMap()

    if (mode === 'single-A') {
      if (leftMap) saveCameraFromMap(leftMap)
    }
    if (mode === 'single-B') {
      if (rightMap) saveCameraFromMap(rightMap)
    }

    // Указываем, какую карту нужно восстановить после монтирования
    if (mode === 'single-A' && newMode !== 'single-A') {
      needRestoreCamera.current = 'right'
    } else if (mode === 'single-B' && newMode !== 'single-B') {
      needRestoreCamera.current = 'left'
    } else if (mode === 'single-A' && newMode === 'single-B') {
      needRestoreCamera.current = 'right'
    } else if (mode === 'single-B' && newMode === 'single-A') {
      needRestoreCamera.current = 'left'
    }

    setMode(newMode)
    if (state) {
      updateUrlConfig({ ...state, mode: newMode })
    }
  }

  const handlePresetSelect = (preset: Preset) => {
    localStorage.setItem(STORAGE_KEYS.leftOptions, JSON.stringify(preset.left.options))
    localStorage.setItem(STORAGE_KEYS.rightOptions, JSON.stringify(preset.right.options))
    localStorage.setItem(STORAGE_KEYS.leftUrl, preset.left.mapglUrl)
    localStorage.setItem(STORAGE_KEYS.rightUrl, preset.right.mapglUrl)
    localStorage.setItem(STORAGE_KEYS.styleId, preset.style)
    if (state) {
      localStorage.setItem(STORAGE_KEYS.apiKey, state.apiKey)
      updateUrlConfig({
        ...state,
        leftOptions: preset.left.options,
        rightOptions: preset.right.options,
        leftUrl: preset.left.mapglUrl,
        rightUrl: preset.right.mapglUrl,
        styleId: preset.style,
        mode,
      })
    }
    window.location.reload()
  }

  const handleLocationSelect = (loc: LocationPreset) => {
    const leftMap = leftMapRef.current?.getMap()
    const rightMap = rightMapRef.current?.getMap()

    if (leftMap) {
      leftMap.setCenter(loc.center, { animate: true } as never)
      if (loc.zoom !== undefined) leftMap.setZoom(loc.zoom, { animate: true } as never)
      if (loc.pitch !== undefined) leftMap.setPitch(loc.pitch, { animate: true } as never)
      if (loc.rotation !== undefined) leftMap.setRotation(loc.rotation, { animate: true } as never)
    }
    if (rightMap) {
      rightMap.setCenter(loc.center, { animate: true } as never)
      if (loc.zoom !== undefined) rightMap.setZoom(loc.zoom, { animate: true } as never)
      if (loc.pitch !== undefined) rightMap.setPitch(loc.pitch, { animate: true } as never)
      if (loc.rotation !== undefined) rightMap.setRotation(loc.rotation, { animate: true } as never)
    }
    setLocationOpen(false)
  }

  // Закрытие дропдаунов по клику вне
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationOpen(false)
      }
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
        setPresetOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <>
      {showWelcome && (
        <Welcome
          onSubmit={handleSubmit}
          onClose={state ? () => setShowWelcome(false) : undefined}
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
          <div className="preset-picker" ref={presetRef}>
            <button className="preset-button" onClick={() => setPresetOpen(v => !v)} title="Выбрать пресет">
              📋 Пресеты
            </button>
            {presetOpen && (
              <div className="preset-dropdown">
                {PRESETS.map((preset, i) => (
                  <button key={i} className="preset-option" onClick={() => handlePresetSelect(preset)}>
                    {preset.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <ModeSelector mode={mode} onChange={handleModeChange} />
          <div className="location-picker" ref={locationRef}>
            <button className="location-button" onClick={() => setLocationOpen(v => !v)} title="Выбрать локацию">
              📍 Локация
            </button>
            {locationOpen && (
              <div className="location-dropdown">
                {LOCATIONS.map(loc => (
                  <button key={loc.label} className="location-option" onClick={() => handleLocationSelect(loc)}>
                    {loc.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
              {!isSingleRight && (
                <Map
                  ref={leftMapRef}
                  apiKey={state.apiKey}
                  options={state.leftOptions}
                  engineUrl={state.leftUrl || undefined}
                  styleId={state.styleId}
                  onReady={handleLeftReady}

                />
              )}
            </div>
            <div className={`right-half ${isSingleLeft ? 'hidden' : ''} ${isSingleRight ? 'full' : ''}`}>
              {!isSingleLeft && (
                <Map
                  ref={rightMapRef}
                  apiKey={state.apiKey}
                  options={state.rightOptions}
                  engineUrl={state.rightUrl || undefined}
                  styleId={state.styleId}
                  onReady={handleRightReady}

                />
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default App
