/// <reference path="../node_modules/@2gis/mapgl/global.d.ts" />
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { Map as MapGL } from '@2gis/mapgl/types'
import { DEFAULT_MAP_OPTIONS } from './constants'
import { loadMapglScript } from './mapglLoader'

export interface MapOptions {
  center?: [number, number]
  zoom?: number
  [key: string]: unknown
}

export interface MapHandle {
  getMap: () => MapGL | null
}

interface MapProps {
  apiKey?: string
  options?: MapOptions
  engineUrl?: string
  styleId?: string
  onReady?: () => void
}
const key = import.meta.env.VITE_MAPGL_KEY;

const Map = forwardRef<MapHandle, MapProps>(
  (
    {
      apiKey = key || 'YOUR_2GIS_API_KEY',
      options = DEFAULT_MAP_OPTIONS,
      engineUrl,
      onReady,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<MapGL | null>(null)

    useImperativeHandle(ref, () => ({
      getMap: () => mapInstanceRef.current,
    }))

    // Сливаем с дефолтными опциями
    const mergedOptions: MapOptions = {
      ...DEFAULT_MAP_OPTIONS,
      ...options,
      style: options.style ?? DEFAULT_MAP_OPTIONS.style,
      zoom: options.zoom ?? DEFAULT_MAP_OPTIONS.zoom,
      enableTrackResize: true,
      zoomControl: false,
    }

    useEffect(() => {
      if (!containerRef.current) return

      let isMounted = true

      loadMapglScript(engineUrl).then((mapglAPI) => {
        if (!isMounted || !containerRef.current) return

        const map = new mapglAPI.Map(containerRef.current, {
          ...mergedOptions,
          key: apiKey,
        } as ConstructorParameters<typeof mapglAPI.Map>[1])
        mapInstanceRef.current = map

        onReady?.()
      })

      return () => {
        isMounted = false
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy()
          mapInstanceRef.current = null
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey])

    // Запасной механизм: обновляем размеры карты при ресайзе окна
    useEffect(() => {
      const handleResize = () => {
        const map = mapInstanceRef.current as unknown as {
          invalidate?: () => void
        }
        if (map?.invalidate) {
          map.invalidate()
        }
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    )
  }
)

Map.displayName = 'Map'

export default Map