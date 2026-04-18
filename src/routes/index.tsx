import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { createFileRoute } from '@tanstack/react-router'
import { RiskMap } from '@/components/RiskMap'
import {
  fetchPolices,
  fetchPortfolioStats,
  type Police,
  type PortfolioStats,
} from '@/lib/supabase'
import { useEffect, useState, useMemo } from 'react'
import {
  BarChart3,
  Bell,
  Building2,
  Factory,
  HelpCircle,
  History,
  Layers,
  LayoutDashboard,
  MapPin,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

const RiskDashboard = () => {
  const [polices, setPolices] = useState<Police[]>([])
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [selectedWilaya, setSelectedWilaya] = useState<string>('')

  useEffect(() => {
    const loadData = async () => {
      const [policesData, statsData] = await Promise.all([
        fetchPolices(),
        fetchPortfolioStats(selectedWilaya || null),
      ])
      setPolices(policesData)
      setPortfolioStats(statsData)
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (loading) return
    const loadStats = async () => {
      const statsData = await fetchPortfolioStats(selectedWilaya || null)
      console.log('Loaded stats:', statsData)
      setPortfolioStats(statsData)
    }
    loadStats()
  }, [selectedWilaya, loading])

  const filteredPolices = useMemo(() => {
    if (!selectedWilaya) return polices
    return polices.filter((p) => p.wilaya === selectedWilaya)
  }, [polices, selectedWilaya])

  const stats = useMemo(() => {
    console.log(
      'Computing stats, portfolioStats:',
      portfolioStats,
      'filtered:',
      filteredPolices.length,
    )
    if (!portfolioStats) {
      const data = filteredPolices
      const totalTSI = data.reduce((sum, p) => sum + p.capital_assure, 0)
      const totalPremium = data.reduce((sum, p) => sum + p.prime_nette, 0)
      const avgRisk =
        data.length > 0
          ? data.reduce((sum, p) => sum + p.risk_score_ia, 0) / data.length
          : 0
      const atRisk = data.filter((p) => p.risk_score_ia > 0.7).length
      return { totalTSI, totalPremium, avgRisk, atRisk }
    }
    return {
      totalTSI: portfolioStats.weighted_capital_sum ?? 0,
      totalPremium: portfolioStats.net_premiums_sum ?? 0,
      avgRisk: portfolioStats.avg_criticite ?? 0,
      atRisk: portfolioStats.alert_contracts_count ?? 0,
    }
  }, [filteredPolices, portfolioStats])

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* 1. SideNavBar - Variable-first colors & Shadow-less depth */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-background flex flex-col py-8 z-50">
        <div className="px-6 mb-10">
          <h1 className="text-xl font-extrabold tracking-tight text-primary">
            GAM Risk
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Suite d'analyse sismique
          </p>
        </div>

        <nav className="flex-1 flex flex-col px-3 space-y-1">
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Vue d'ensemble"
            active
          />
          <NavItem
            icon={<BarChart3 size={18} />}
            label="Analyse du portefeuille"
          />
          <NavItem
            icon={<ShieldCheck size={18} />}
            label="Gestion des sinistres"
          />
          <NavItem
            icon={<Layers size={18} />}
            label="Stratégie de réassurance"
          />

          <div className="mt-auto pt-4">
            <NavItem icon={<Settings size={18} />} label="Paramètres" />
          </div>
        </nav>

        <div className="px-6 mt-6">
          <Button className="w-full font-bold uppercase text-[10px] tracking-widest py-6">
            Générer le rapport
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col relative overflow-hidden">
        {/* 2. Sticky Header with Glassmorphism */}
        <header className="sticky top-0 w-full h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40 px-8 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <span className="text-lg font-extrabold text-primary">
              GAM Risk
            </span>
          </div>
          <div className="flex items-center gap-6">
            {/* Integrated Input Prefix Pattern */}
            <div className="relative hidden lg:block group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search size={14} />
              </span>
              <Input
                className="pl-9 w-64 bg-muted/50 border-border focus-visible:ring-1 focus-visible:ring-primary h-9 text-xs"
                placeholder="Rechercher propriété, zone..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Bell size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <HelpCircle size={18} />
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div className="w-8 h-8 rounded-full border border-border bg-muted overflow-hidden">
                <img src="/api/placeholder/32/32" alt="Profile" />
              </div>
            </div>
          </div>
        </header>

        {/* 3. Scrollable Canvas */}
        <main className="p-8 space-y-8 overflow-y-auto bg-background">
          {/* KPI Cards Grid - Shadow-none, Border-driven */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Exposition Financière (Anciennement TSI) */}
            <KPICard
              title="Capitaux Exposés (IA)"
              value={
                stats.totalTSI > 0
                  ? `${(stats.totalTSI / 1000000).toFixed(1)}M`
                  : '0'
              }
              subtext="Cumul pondéré par criticité"
              trend="+2.4%"
            />

            {/* Card 2: Revenus (Primes) */}
            <KPICard
              title="Primes Nettes Totales"
              value={
                stats.totalPremium > 0
                  ? `${(stats.totalPremium / 1000).toFixed(0)}k`
                  : '0'
              }
              subtext="Total des primes encaissées"
              status="Modéré"
              statusColor="text-yellow-600"
            />

            {/* Card 3: Alertes Critiques (Anciennement Policies at Risk) */}
            <KPICard
              title="Contrats en Alerte"
              value={stats.atRisk.toString()}
              subtext="Score IA supérieur à 3.8"
              icon={<History size={12} />}
              status="Priorité Haute"
              statusColor="text-destructive"
            />

            {/* Card 4: Score de Risque Moyen (Conversion du 298.5 en format 1-5) */}
            <KPICard
              title="Indice de Risque Global"
              value={stats.avgRisk.toFixed(1) + ' / 5'}
              subtext="Moyenne de criticité IA"
              status="Stable"
              statusColor="text-primary"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[500px]">
            {/* 4. Centerpiece: Map Area */}
            <div className="lg:col-span-8 border border-border bg-muted/30 rounded-lg relative overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-muted-foreground">Loading map...</span>
                </div>
              ) : (
                <div className="h-full">
                  <RiskMap
                    polices={polices}
                    selectedWilaya={selectedWilaya}
                    onWilayaChange={setSelectedWilaya}
                  />
                </div>
              )}
              <div className="absolute bottom-6 left-6 z-20 bg-background/80 backdrop-blur-md p-4 border border-border rounded-md w-60">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-3">
                  Risque sismique
                </h3>
                <div className="space-y-2">
                  <RiskLevel label="Zone 1 (Faible)" color="bg-emerald-500" />
                  <RiskLevel label="Zone 2 (Modéré)" color="bg-yellow-500" />
                  <RiskLevel label="Zone 3 (Élevé)" color="bg-destructive" />
                </div>
              </div>
            </div>

            {/* 5. Right Sidebar Widget */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <Card className="shadow-none border-border bg-background flex-1 flex flex-col">
                <CardHeader className="items-center pb-2">
                  <CardTitle className="text-sm font-bold">
                    Reinsurance strategy
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Taux de rétention
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-6">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted/50"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="364"
                        strokeDashoffset="109"
                        className="text-primary"
                      />
                    </svg>
                    <span className="absolute text-2xl font-extrabold">
                      70%
                    </span>
                  </div>
                  <div className="w-full space-y-2">
                    <StrategyRow
                      label="GAM Retention"
                      value="70%"
                      color="bg-primary"
                    />
                    <StrategyRow
                      label="Ceded"
                      value="30%"
                      color="bg-muted-foreground"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-none bg-primary text-primary-foreground p-6">
                <h4 className="text-sm font-bold mb-1">
                  Portfolio stress test
                </h4>
                <p className="text-xs opacity-80 mb-4">
                  Run 1-in-200 year seismic simulations.
                </p>
                <Button
                  variant="secondary"
                  className="w-full text-xs font-bold uppercase tracking-widest h-9"
                >
                  <Rocket size={14} className="mr-2" /> Launch simulation
                </Button>
              </Card>
            </div>
          </div>

          {/* 6. Critical Exposure Nodes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
                Critical exposure nodes
              </h2>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: RiskDashboard,
})

// Sub-components for clean architecture

const NavItem = ({ icon, label, active = false }) => (
  <a
    href="#"
    className={`
    flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors
    ${active ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}
  `}
  >
    {icon}
    <span>{label}</span>
  </a>
)

const KPICard = ({ title, value, subtext, status, statusColor, icon }) => (
  <div className="border border-border bg-background p-5 rounded-md space-y-3">
    <div className="flex justify-between items-start">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {title}
      </span>
      {status && (
        <span className={`text-[10px] font-bold ${statusColor}`}>{status}</span>
      )}
    </div>
    <div>
      <span className="text-2xl font-extrabold leading-none">{value}</span>
      <div className="flex items-center gap-1 mt-1 text-muted-foreground">
        {icon}
        <p className="text-[10px] italic">{subtext}</p>
      </div>
    </div>
  </div>
)

const RiskLevel = ({ label, color }) => (
  <div className="flex items-center justify-between text-[10px] font-bold text-foreground">
    <span>{label}</span>
    <div className={`w-10 h-1 rounded-full ${color}`} />
  </div>
)

const StrategyRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between bg-muted/50 p-2 rounded border border-border">
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
    </div>
    <span className="text-xs font-bold">{value}</span>
  </div>
)

const NodeItem = ({ icon, name, zone, value, progress, risk = false }) => (
  <div className="p-4 border border-border bg-background hover:bg-muted/30 transition-colors flex items-center gap-4 group cursor-pointer">
    <div
      className={`w-10 h-10 rounded flex items-center justify-center ${risk ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}
    >
      {icon}
    </div>
    <div className="flex-1">
      <h5 className="text-xs font-bold">{name}</h5>
      <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
        {zone}
      </p>
    </div>
    <div className="text-right">
      <span
        className={`text-xs font-bold ${risk ? 'text-destructive' : 'text-foreground'}`}
      >
        {value}
      </span>
      <div className="w-16 h-1 bg-muted mt-1 overflow-hidden">
        <div
          className={`h-full ${risk ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  </div>
)

export default RiskDashboard
