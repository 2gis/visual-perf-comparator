export const DEFAULT_MAPGL_URL = 'https://mapgl.2gis.com/api/js'

export const MAP_STYLES: Record<string, string> = {
  Online: 'eb10e2c3-3c28-4b81-b74b-859c9c4cf47e',
  SDK: 'c080bb6a-8134-4993-93a1-5b4d8c36a59b',
}

export const DEFAULT_STYLE_ID = MAP_STYLES.Online

export const DEFAULT_MAP_OPTIONS = {
  center: [37.63185261145307, 55.82980220610221] as [number, number],
  zoom: 16,
  style: DEFAULT_STYLE_ID,
  enableTrackResize: true,
  maxPitch: 88,
}

export const STORAGE_KEYS = {
  apiKey: '2gis_api_key',
  leftOptions: '2gis_left_options',
  rightOptions: '2gis_right_options',
  leftUrl: '2gis_left_url',
  rightUrl: '2gis_right_url',
  styleId: '2gis_style_id',
}
