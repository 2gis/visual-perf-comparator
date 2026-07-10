import { runScenario } from './scenarios'
import { stats } from './stats'
import type { Map } from '@2gis/mapgl/types'

const BAD_FPS_THRESHOLD = 20

interface RawResults {
  fps: number[]
  badfps: number[]
  draws: number[]
  tiles: number[]
  vertices: number[]
  timeline: number[] // FPS count per second
}

export interface TestResults {
  fps: Record<string, string>
  badfps: Record<string, string>
  glitches: number
  draws: Record<string, string>
  tiles: Record<string, string>
  vertices: Record<string, string>
  timeline: number[] // Per-second FPS timeline
}

export async function measureRender(
  map: Map,
  scenario: string,
  iterations: number,
  warmup: boolean,
  speedMultiplier: number = 1,
  onProgress?: (phase: string) => void
): Promise<TestResults> {
  const impl = (map as unknown as { _impl: any })._impl
  if (!impl) throw new Error('Cannot access map._impl')

  const ITERATIONS = iterations + (warmup ? 1 : 0)
  const results: RawResults = {
    fps: [],
    badfps: [],
    draws: [],
    tiles: [],
    vertices: [],
    timeline: [],
  }

  let frameStart = NaN
  let timelineInterval: ReturnType<typeof setInterval> | null = null
  let currentSecondFpsCount = 0

  const onFrameStart = () => {
    frameStart = performance.now()
  }

  const onFrameEnd = () => {
    const currentTime = performance.now()
    const fps = 1000 / (currentTime - frameStart)
    if (fps <= BAD_FPS_THRESHOLD) {
      results.badfps.push(fps)
    }
    results.fps.push(fps)
    currentSecondFpsCount++

    // Собираем статистику рендера если доступна
    const mapStats = impl.state?.stats
    if (mapStats) {
      results.draws.push(mapStats.drawCount ?? 0)
      results.tiles.push(mapStats.tileCount ?? 0)
      results.vertices.push((mapStats.vertexCount ?? 0) / 10 ** 6)
    }
  }

  impl.on('framestart', onFrameStart)
  impl.on('frameend', onFrameEnd)

  for (let i = 0; i < ITERATIONS; i++) {
    const isWarmup = warmup && i === 0
    if (isWarmup) {
      onProgress?.('Прогрев кэша...')
      // Очищаем результаты после прогрева
      results.fps.length = 0
      results.badfps.length = 0
      results.draws.length = 0
      results.tiles.length = 0
      results.vertices.length = 0
      results.timeline.length = 0
      currentSecondFpsCount = 0
    } else {
      onProgress?.(`Итерация ${warmup ? i : i + 1} из ${iterations}`)
    }

    // Включаем сбор статистики если доступно
    if (impl.state && !isWarmup) {
      impl.state.collectStats = true
    }

    // Запускаем таймер таймлайна перед запуском сценария
    currentSecondFpsCount = 0
    timelineInterval = setInterval(() => {
      results.timeline.push(currentSecondFpsCount)
      currentSecondFpsCount = 0
    }, 1000)

    await runScenario(map, scenario, isWarmup ? 2 : speedMultiplier)

    // Останавливаем таймер таймлайна
    if (timelineInterval) {
      clearInterval(timelineInterval)
      // Добавляем последнюю секунду если есть данные
      if (currentSecondFpsCount > 0) {
        results.timeline.push(currentSecondFpsCount)
      }
      timelineInterval = null
      currentSecondFpsCount = 0
    }

    if (isWarmup) {
      // Очищаем после прогрева
      results.fps.length = 0
      results.badfps.length = 0
      results.draws.length = 0
      results.tiles.length = 0
      results.vertices.length = 0
      results.timeline.length = 0
    }
  }

  impl.off('framestart', onFrameStart)
  impl.off('frameend', onFrameEnd)

  return processStats(results)
}

function processStats(results: RawResults): TestResults {
  return {
    fps: stats(results.fps, [0.01, 0.05, 0.1, 0.25, 0.5, 0.75]),
    badfps: stats(results.badfps, [0.01, 0.05, 0.1, 0.25, 0.5, 0.75]),
    glitches: results.badfps.length,
    draws: stats(results.draws),
    tiles: stats(results.tiles),
    vertices: stats(results.vertices),
    timeline: results.timeline,
  }
}
