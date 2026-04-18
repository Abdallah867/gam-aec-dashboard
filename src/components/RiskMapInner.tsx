import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const token =
  typeof window !== 'undefined'
    ? (import.meta.env.VITE_MAPBOX_TOKEN as string)
    : ''
if (typeof window !== 'undefined') mapboxgl.accessToken = token || ''

interface Police {
  id: string
  wilaya: string
  commune: string
  capital_assure: number
  prime_nette: number
  risk_score_ia: number
}

interface RiskMapInnerProps {
  polices: Police[]
  level?: 'wilaya' | 'commune'
  selectedWilaya?: string
}

const getRiskColor = (scorePercent: number): string => {
  if (scorePercent >= 70) return '#D21034' // Rouge
  if (scorePercent >= 37) return '#F97316' // Orange
  if (scorePercent >= 2.5) return '#006233' // Vert
  return '#006233'
}

export function RiskMapInner({
  polices,
  level: initialLevel,
  selectedWilaya,
}: RiskMapInnerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const popup = useRef<mapboxgl.Popup | null>(null)

  const level = initialLevel || 'wilaya'
  const filteredPolices = selectedWilaya
    ? polices.filter((p) => p.wilaya === selectedWilaya)
    : polices

  const normalize = (s: string) =>
    s
      ?.toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/^(commune de |wilaya de |d'|l'|el |le |la |ain |aïn )/g, '')
      .replace(/\s+/g, '')
      .replace(/[_-]/g, '')
      .trim() || ''

  useEffect(() => {
    if (!mapContainer.current || map.current) return
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [3.0, 28.5],
      zoom: 4.5,
    })

    map.current.on('load', () => loadLayers())

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (map.current?.isStyleLoaded()) loadLayers()
  }, [level, filteredPolices, selectedWilaya, polices])

  const loadLayers = async () => {
    if (!map.current) return

    // Nettoyage des couches existantes
    const layers = ['risk-fill', 'risk-line', 'risk-hitbox']
    layers.forEach((l) => {
      if (map.current?.getLayer(l)) map.current.removeLayer(l)
    })
    if (map.current.getSource('risk-source'))
      map.current.removeSource('risk-source')

    try {
      const fileName =
        level === 'wilaya' ? 'dza_admin1.geojson' : 'dza_admin2.geojson'
      const response = await fetch(`/carte/${fileName}`)
      const geojson = await response.json()

      const processedFeatures = geojson.features.map((f: any) => {
        const props = f.properties
        let matchData: Police[] = []
        let displayName = ''
        let displayWilaya = ''

        if (level === 'wilaya') {
          displayName = props?.adm1_name || props?.NAME_1 || ''
          const normGeoW = normalize(displayName)
          matchData = filteredPolices.filter(
            (p) => normalize(p.wilaya) === normGeoW,
          )
        } else {
          displayName = props?.adm2_name || props?.NAME_2 || ''
          displayWilaya = props?.adm1_name || props?.NAME_1 || ''
          const normGeoC = normalize(displayName)
          const normGeoW = normalize(displayWilaya)
          const found = filteredPolices.find(
            (p) =>
              normalize(p.commune) === normGeoC &&
              normalize(p.wilaya) === normGeoW,
          )
          if (found) matchData = [found]
        }

        const hasData = matchData.length > 0
        const totalCapital = matchData.reduce(
          (sum, p) => sum + (Number(p.capital_assure) || 0),
          0,
        )
        const totalPrime = matchData.reduce(
          (sum, p) => sum + (Number(p.prime_nette) || 0),
          0,
        )

        const avgScoreRaw = hasData
          ? matchData.reduce(
              (sum, p) => sum + (Number(p.risk_score_ia) || 0),
              0,
            ) / matchData.length
          : 0

        const scorePercent = Math.min((avgScoreRaw / 5) * 100, 100)
        const fillColor = hasData ? getRiskColor(scorePercent) : '#D1D5DB'

        return {
          ...f,
          properties: {
            ...props,
            fillColor,
            hasData: String(hasData),
            capital: totalCapital,
            prime: totalPrime, // Prime nette remise ici
            score: scorePercent,
            displayName,
            displayWilaya: displayWilaya || displayName,
          },
        }
      })

      map.current.addSource('risk-source', {
        type: 'geojson',
        data: { ...geojson, features: processedFeatures },
        buffer: 0,
        maxzoom: 12,
      })

      map.current.addLayer({
        id: 'risk-fill',
        type: 'fill',
        source: 'risk-source',
        paint: { 'fill-color': ['get', 'fillColor'], 'fill-opacity': 0.6 },
      })

      map.current.addLayer({
        id: 'risk-line',
        type: 'line',
        source: 'risk-source',
        paint: { 'line-color': '#ffffff', 'line-width': 0.5 },
      })

      map.current.addLayer({
        id: 'risk-hitbox',
        type: 'fill',
        source: 'risk-source',
        paint: { 'fill-color': '#000', 'fill-opacity': 0 },
      })

      setupHoverEffects()
    } catch (err) {
      console.error('Erreur chargement map:', err)
    }
  }

  const setupHoverEffects = () => {
    if (!map.current) return
    if (popup.current) popup.current.remove()

    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    })

    map.current.on('mousemove', 'risk-hitbox', (e) => {
      if (!e.features?.length) return
      const p = e.features[0].properties as any
      const isDataAvailable = String(p.hasData) === 'true'

      let content = `<div style="padding: 8px; font-family: sans-serif; min-width: 160px;">`
      content += `<strong style="color: #1a1a1a; font-size: 14px;">${p.displayName}</strong>`

      if (level === 'commune') {
        content += `<div style="font-size: 11px; color: #666; margin-bottom: 4px;">Wilaya: ${p.displayWilaya}</div>`
      }

      if (isDataAvailable) {
        content += `
          <div style="border-top: 1px solid #eee; margin-top: 6px; padding-top: 6px; font-size: 12px; line-height: 1.5;">
            <span style="color: #444;">Risque:</span> <b style="color:${p.fillColor}">${Number(p.score).toFixed(1)}%</b><br/>
            <span style="color: #444;">Capital:</span> <b>${Number(p.capital).toLocaleString()} DZD</b><br/>
            <span style="color: #444;">Prime Nette:</span> <b>${Number(p.prime).toLocaleString()} DZD</b>
          </div>
        `
      } else {
        content += `<div style="color: #999; font-size: 11px; margin-top: 6px; font-style: italic;">Aucune donnée disponible</div>`
      }
      content += `</div>`

      map.current!.getCanvas().style.cursor = 'pointer'
      popup.current!.setLngLat(e.lngLat).setHTML(content).addTo(map.current!)
    })

    map.current.on('mouseleave', 'risk-hitbox', () => {
      map.current!.getCanvas().style.cursor = ''
      popup.current?.remove()
    })
  }

  return (
    <div
      style={{
        width: '100%',
        height: '600px',
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #ddd',
      }}
    >
      <div
        ref={mapContainer}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      />
    </div>
  )
}
