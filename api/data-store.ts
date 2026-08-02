import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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
  category: 'Dining' | 'Play' | 'Hotel'
  title: string
  detail: string
  cost: number
  icon: 'utensils' | 'hotel' | 'sparkles' | 'martini'
  redeemed: boolean
  redemptionCode?: string
}

interface LoyaltyData {
  player: Player
  activity: ActivityItem[]
  offers: Offer[]
  preferences: Preferences
}

const defaultDataFile = fileURLToPath(new URL('../config/loyalty-data.json', import.meta.url))

export class LoyaltyStore {
  private readonly data: LoyaltyData

  constructor(dataFile = defaultDataFile) {
    this.data = JSON.parse(readFileSync(dataFile, 'utf8')) as LoyaltyData
  }

  getPlayer() {
    return structuredClone(this.data.player)
  }

  getActivity() {
    return structuredClone(this.data.activity)
  }

  getOffers() {
    return structuredClone(this.data.offers)
  }

  redeemOffer(id: number) {
    const offer = this.data.offers.find((candidate) => candidate.id === id)
    if (!offer) return { status: 'not-found' as const }
    if (offer.redeemed) return { status: 'already-redeemed' as const, offer: structuredClone(offer) }
    if (offer.cost > this.data.player.balance) return { status: 'insufficient-points' as const }

    this.data.player.balance -= offer.cost
    if (offer.cost > 0) this.data.player.metrics.redeemedOffers += 1
    offer.redeemed = true
    offer.redemptionCode = `LW-${1048 + offer.id}`
    return {
      status: 'redeemed' as const,
      offer: structuredClone(offer),
      balance: this.data.player.balance,
    }
  }

  getPreferences() {
    return structuredClone(this.data.preferences)
  }

  updatePreferences(preferences: Preferences) {
    this.data.preferences = structuredClone(preferences)
    return this.getPreferences()
  }
}