import { lazy, Suspense, useMemo, useState } from 'react'
import type { Police } from '#/lib/supabase'
import 'mapbox-gl/dist/mapbox-gl.css'

interface RiskMapProps {
  polices: Police[]
  selectedWilaya?: string
  onWilayaChange?: (wilaya: string) => void
}

const RiskMapInner = lazy(() =>
  import('./RiskMapInner').then((m) => ({ default: m.RiskMapInner })),
)

export function RiskMap({
  polices,
  selectedWilaya,
  onWilayaChange,
}: RiskMapProps) {
  const [mapLevel, setMapLevel] = useState<'wilaya' | 'commune'>(
    selectedWilaya ? 'commune' : 'wilaya',
  )

  const wilayas = useMemo(() => {
    const unique = [...new Set(polices.map((p) => p.wilaya).filter(Boolean))]
    return unique.sort()
  }, [polices])

  const handleWilayaChange = (value: string) => {
    onWilayaChange?.(value)
    setMapLevel(value ? 'commune' : 'wilaya')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Niveau:
          </label>
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => {
                onWilayaChange?.('')
                setMapLevel('wilaya')
              }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                mapLevel === 'wilaya'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              Wilayas
            </button>
            <button
              onClick={() => setMapLevel('commune')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
                mapLevel === 'commune'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              Communes
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Wilaya:
          </label>
          <select
            value={selectedWilaya || ''}
            onChange={(e) => handleWilayaChange(e.target.value)}
            className="h-8 px-2 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary min-w-[160px]"
          >
            <option value="">Toutes</option>
            {wilayas.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <span className="text-muted-foreground">Loading map...</span>
            </div>
          }
        >
          <RiskMapInner
            polices={polices}
            selectedWilaya={selectedWilaya}
            level={mapLevel}
          />
        </Suspense>
      </div>
    </div>
  )
}
