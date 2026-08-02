export type OfferCategory = 'All' | 'Dining' | 'Play' | 'Hotel'
export type PreferenceKey = 'push' | 'email' | 'sms' | 'offers' | 'points' | 'events' | 'responsible' | 'quiet'
export type Preferences = Record<PreferenceKey, boolean>

export interface Player {
  name: string
  firstName: string
  initials: string
  email: string
  mobileEnding: string
  city: string
  memberSince: number
  tier: string
  balance: number
  nextTier: string
  nextTierThreshold: number
  metrics: {
    monthPoints: number
    redeemedOffers: number
    yearVisits: number
  }
}

export interface ActivityItem {
  id: number
  title: string
  detail: string
  points: number
}

export interface Offer {
  id: number
  category: Exclude<OfferCategory, 'All'>
  title: string
  detail: string
  cost: number
  icon: 'utensils' | 'hotel' | 'sparkles' | 'martini'
  redeemed: boolean
  redemptionCode?: string
}

export interface LoyaltyData {
  player: Player
  activity: ActivityItem[]
  offers: Offer[]
  preferences: Preferences
}

export interface RedemptionResult {
  status: 'redeemed'
  offer: Offer
  balance: number
}

const apiUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'The service returned an unexpected response.' })) as { error?: string }
    throw new Error(body.error ?? `Request failed with status ${response.status}.`)
  }
  return response.json() as Promise<T>
}

export async function getLoyaltyData(): Promise<LoyaltyData> {
  const [player, activity, offers, preferences] = await Promise.all([
    request<Player>('/api/player'),
    request<ActivityItem[]>('/api/activity'),
    request<Offer[]>('/api/offers'),
    request<Preferences>('/api/preferences'),
  ])
  return { player, activity, offers, preferences }
}

export function redeemOffer(id: number) {
  return request<RedemptionResult>(`/api/offers/${id}/redeem`, { method: 'POST' })
}

export function savePreferences(preferences: Preferences) {
  return request<Preferences>('/api/preferences', { method: 'PUT', body: JSON.stringify(preferences) })
}