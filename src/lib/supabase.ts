import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Police = {
  id: string
  wilaya: string
  commune: string
  capital_assure: number
  prime_nette: number
  risk_score_ia: number
  latitude?: number
  longitude?: number
}

export type WilayaAggregate = {
  wilaya: string
  contrats_count: number
  capital_assure_sum: number
  prime_nette_sum: number
  risk_score_ia_avg: number
  rpa_sismique_count: number
}

export type PortfolioStats = {
  weighted_capital_sum?: number
  net_premiums_sum?: number
  alert_contracts_count?: number
  avg_criticite?: number
  [key: string]: any
}

// export const mockPolices: Police[] = [
//   {
//     id: '1',
//     numero_police: 'POL-001',
//     date_effet: '2024-01-01',
//     date_expiration: '2025-01-01',
//     type_installation: 'Industrielle',
//     wilaya: 'Alger',
//     commune: 'Alger Centre',
//     capital_assure: 50000000,
//     prime_nette: 250000,
//     latitude: 36.7538,
//     longitude: 3.0588,
//     risk_score_ia: 0.85,
//   },
//   {
//     id: '2',
//     numero_police: 'POL-002',
//     date_effet: '2024-02-15',
//     date_expiration: '2025-02-15',
//     type_installation: 'Commerciale',
//     wilaya: 'Constantine',
//     commune: 'Constantine',
//     capital_assure: 25000000,
//     prime_nette: 125000,
//     latitude: 36.365,
//     longitude: 6.61,
//     risk_score_ia: 0.45,
//   },
//   {
//     id: '3',
//     numero_police: 'POL-003',
//     date_effet: '2024-03-10',
//     date_expiration: '2025-03-10',
//     type_installation: 'Industrielle',
//     wilaya: 'Oran',
//     commune: 'Oran',
//     capital_assure: 75000000,
//     prime_nette: 375000,
//     latitude: 35.6969,
//     longitude: -0.6331,
//     risk_score_ia: 0.25,
//   },
//   {
//     id: '4',
//     numero_police: 'POL-004',
//     date_effet: '2024-04-01',
//     date_expiration: '2025-04-01',
//     type_installation: 'Residentiale',
//     wilaya: 'Blida',
//     commune: 'Blida',
//     capital_assure: 15000000,
//     prime_nette: 75000,
//     latitude: 36.4719,
//     longitude: 2.8275,
//     risk_score_ia: 0.72,
//   },
//   {
//     id: '5',
//     numero_police: 'POL-005',
//     date_effet: '2024-05-20',
//     date_expiration: '2025-05-20',
//     type_installation: 'Commerciale',
//     wilaya: 'Setif',
//     commune: 'Setif',
//     capital_assure: 35000000,
//     prime_nette: 175000,
//     latitude: 36.19,
//     longitude: 5.41,
//     risk_score_ia: 0.55,
//   },
//   {
//     id: '6',
//     numero_police: 'POL-006',
//     date_effet: '2024-06-01',
//     date_expiration: '2025-06-01',
//     type_installation: 'Industrielle',
//     wilaya: 'Annaba',
//     commune: 'Annaba',
//     capital_assure: 60000000,
//     prime_nette: 300000,
//     latitude: 36.9,
//     longitude: 7.7667,
//     risk_score_ia: 0.38,
//   },
//   {
//     id: '7',
//     numero_police: 'POL-007',
//     date_effet: '2024-07-15',
//     date_expiration: '2025-07-15',
//     type_installation: 'Residentiale',
//     wilaya: 'Alger',
//     commune: 'Bab El Oued',
//     capital_assure: 20000000,
//     prime_nette: 100000,
//     latitude: 36.7833,
//     longitude: 3.05,
//     risk_score_ia: 0.91,
//   },
//   {
//     id: '8',
//     numero_police: 'POL-008',
//     date_effet: '2024-08-01',
//     date_expiration: '2025-08-01',
//     type_installation: 'Commerciale',
//     wilaya: 'Tizi Ouzou',
//     commune: 'Tizi Ouzou',
//     capital_assure: 18000000,
//     prime_nette: 90000,
//     latitude: 36.7117,
//     longitude: 4.0453,
//     risk_score_ia: 0.68,
//   },
// ]

// export const fetchPolices = async (): Promise<Police[]> => {
//   return mockPolices
// }

export const fetchPolices = async (): Promise<Police[]> => {
  console.log('Fetching from supabase...')
  const { data, error } = await supabase.from('contrats').select('*')

  if (error) {
    console.error('Supabase error:', error)
    return []
  }

  console.log('Supabase data:', data?.length, 'records')
  if (data && data.length > 0) {
    console.log(
      'Sample records:',
      data.slice(0, 3).map((p) => ({
        commune: p.commune,
        capital: p.capital_assure,
        prime: p.prime_nette,
        score: p.risk_score_ia,
      })),
    )
  }

  return data as Police[]
}

export const fetchPolicesByWilaya = async (
  wilaya?: string,
): Promise<Police[]> => {
  if (!wilaya) {
    return fetchPolices()
  }
  console.log('Fetching from supabase by wilaya:', wilaya)
  const { data, error } = await supabase
    .from('contrats')
    .select('*')
    .ilike('wilaya', `%${wilaya}%`)

  if (error) {
    console.error('Supabase error:', error)
    return []
  }

  return data as Police[]
}

export const fetchWilayaAggregates = async (): Promise<WilayaAggregate[]> => {
  console.log('Fetching wilaya aggregates from supabase function...')
  const { data, error } = await supabase.rpc('contrats_aggregate_by_wilaya')

  if (error) {
    console.error('Supabase RPC error:', error)
    return []
  }

  console.log('Wilaya aggregates:', data?.length, 'records')
  return data as WilayaAggregate[]
}

export const fetchPortfolioStats = async (
  wilaya?: string | null,
): Promise<PortfolioStats | null> => {
  // Don't pass null/undefined - let DB use default
  const params = wilaya ? { p_wilaya: wilaya } : {}
  console.log('Fetching portfolio stats with params:', params)

  const { data, error } = await supabase.rpc('get_portfolio_stats', params)

  if (error) {
    console.error('RPC error:', error.message)
    return null
  }

  // Handle array response from Supabase
  if (Array.isArray(data) && data.length > 0) {
    console.log('Stats (array):', data[0])
    return data[0] as PortfolioStats
  }

  console.log('Stats:', data)
  return data as PortfolioStats
}
