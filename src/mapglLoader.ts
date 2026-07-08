import type * as mapgl from '@2gis/mapgl/types'

const DEFAULT_MAPGL_URL = 'https://mapgl.2gis.com/api/js'

const loadedScripts = new Map<string, Promise<typeof mapgl>>()

/**
 * Загружает движок MapGL по указанному URL.
 * Если url не задан — использует дефолтный.
 * Кэширует загруженные скрипты по URL, чтобы не загружать повторно.
 */
export function loadMapglScript(url: string = DEFAULT_MAPGL_URL): Promise<typeof mapgl> {
  if (loadedScripts.has(url)) {
    return loadedScripts.get(url)!
  }

  const promise = createScriptAndLoad(url).then(() => {
    return (window as unknown as { mapgl: typeof mapgl }).mapgl
  })

  loadedScripts.set(url, promise)
  return promise
}

function createScriptAndLoad(mapglURL: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.src = mapglURL

    document.body.appendChild(script)

    script.addEventListener('load', () => {
      resolve()
    })

    script.addEventListener('error', (error) => {
      reject(error)
    })
  })
}
