import { useEffect, useState } from 'react'
import {
  Bell, Check, ChevronRight, Gift, Home, Hotel, LockKeyhole, Mail,
  MapPin, Martini, MessageSquare, ShieldCheck, Sparkles, Star,
  UserRound, Utensils, X,
} from 'lucide-react'
import './App.css'
import {
  getLoyaltyData, redeemOffer, savePreferences,
  type ActivityItem, type LoyaltyData, type Offer, type OfferCategory,
  type Player, type Preferences as PreferenceValues,
} from './api'

type Screen = 'register' | 'home' | 'rewards' | 'alerts' | 'profile'

const formatPoints = (value: number) => new Intl.NumberFormat('en-US').format(value)

function Brand() {
  return <div className="brand"><span><Star fill="currentColor" /></span>L&amp;W Rewards</div>
}

function Registration({ onComplete }: { onComplete: () => void }) {
  const [birthDate, setBirthDate] = useState('1990-05-14')
  const [consent, setConsent] = useState(true)
  const [error, setError] = useState('')
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--
    if (!consent || age < 21) return setError('You must be 21 or older and accept the program terms.')
    onComplete()
  }

  return <main className="auth-shell">
    <section className="auth-story">
      <Brand />
      <div className="story-copy"><p className="eyebrow">YOUR PLAY. REWARDED.</p><h1>Every visit<br />has its rewards.</h1><p>One membership for unforgettable stays, dining, play, and access across every L&amp;W destination.</p><div className="trust-row"><span><ShieldCheck /> Verified membership</span><span><MapPin /> 24 destinations</span></div></div>
    </section>
    <section className="auth-panel">
      <div className="mobile-brand"><Brand /></div>
      <div className="form-wrap"><p className="step-label">MEMBERSHIP / 01</p><h2>Create your account</h2><p className="subtle">Join the loyalty program in under a minute.</p>
        <form onSubmit={submit}>
          <label>Full name<input autoComplete="name" defaultValue="Jordan Rivera" required /></label>
          <label>Email<input type="email" autoComplete="email" defaultValue="jordan.rivera@email.com" required /></label>
          <div className="field-row"><label>Mobile<input type="tel" autoComplete="tel" defaultValue="(702) 555-0148" required /></label><label>Date of birth<input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} required /></label></div>
          <label>Password<input type="password" autoComplete="new-password" defaultValue="Rewarded!24" minLength={8} required /></label>
          <label className="check-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I am 21+ and accept the <a href="#terms">Terms</a> and <a href="#responsible-gaming">Responsible Gaming policy</a>.</span></label>
          {error && <p className="form-error" role="alert"><X />{error}</p>}
          <button className="primary-button" type="submit">Create account <ChevronRight /></button>
        </form>
        <button className="text-button" type="button" onClick={onComplete}>Already a member? <strong>Sign in</strong></button><p className="secure-note"><LockKeyhole /> Secured by Microsoft Entra ID</p>
      </div>
    </section>
  </main>
}

function AppHeader({ title, kicker }: { title: string; kicker: string }) {
  return <header className="app-header"><div><p>{kicker}</p><h1>{title}</h1></div><button className="avatar" type="button" aria-label="Open profile">JR</button></header>
}

function Dashboard({ player, activity }: { player: Player; activity: ActivityItem[] }) {
  const { balance, metrics, nextTier, nextTierThreshold, tier } = player
  return <div className="screen-content"><AppHeader title={`Welcome back, ${player.firstName}`} kicker="SUNDAY, AUGUST 2" />
    <section className="balance-panel"><div className="balance-top"><span>AVAILABLE POINTS</span><strong><Star fill="currentColor" /> {tier.toUpperCase()}</strong></div><p className="balance-number">{formatPoints(balance)}</p><div className="progress-copy"><span>{formatPoints(nextTierThreshold - balance)} points to {nextTier}</span><span>{Math.round((balance / nextTierThreshold) * 100)}%</span></div><div className="progress-track"><span style={{ width: `${Math.min(100, (balance / nextTierThreshold) * 100)}%` }} /></div></section>
    <section className="metric-grid"><div><span>THIS MONTH</span><strong>+{formatPoints(metrics.monthPoints)}</strong><small>points earned</small></div><div><span>REDEEMED</span><strong>{metrics.redeemedOffers}</strong><small>offers</small></div><div><span>VISITS</span><strong>{metrics.yearVisits}</strong><small>this year</small></div></section>
    <section className="activity-section"><SectionHeading kicker="POINTS LEDGER" title="Recent activity" /><div className="activity-list">{activity.map((item) => <article key={item.id}><span className="activity-icon"><Star /></span><div><strong>{item.title}</strong><small>{item.detail}</small></div><b>+{item.points}</b></article>)}</div></section>
  </div>
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return <div className="section-heading"><div><p>{kicker}</p><h2>{title}</h2></div></div>
}

const offerIcons = { utensils: Utensils, hotel: Hotel, sparkles: Sparkles, martini: Martini }

function Offers({ balance, offers, onRedeem }: { balance: number; offers: Offer[]; onRedeem: (offer: Offer) => Promise<Offer> }) {
  const [filter, setFilter] = useState<OfferCategory>('All')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const visibleOffers = offers.filter((offer) => filter === 'All' || offer.category === filter)
  const act = async (offer: Offer) => {
    if (offer.cost > balance) return
    setBusyId(offer.id)
    setError('')
    try {
      const redeemed = await onRedeem(offer)
      setNotice(offer.cost ? `${offer.title} redeemed. Code ${redeemed.redemptionCode}.` : `${offer.title} activated.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The offer could not be redeemed.')
    } finally {
      setBusyId(null)
    }
  }
  return <div className="screen-content"><AppHeader title="Offers & rewards" kicker="CURATED FOR YOU" />
    <div className="offer-intro"><div><p>YOUR BALANCE</p><strong>{formatPoints(balance)} <small>PTS</small></strong></div><p>Use points for stays, dining, and experiences selected for your tier.</p></div>
    <div className="filter-bar" role="group" aria-label="Offer categories">{(['All', 'Dining', 'Play', 'Hotel'] as OfferCategory[]).map((category) => <button className={filter === category ? 'active' : ''} type="button" key={category} onClick={() => setFilter(category)}>{category}</button>)}</div>
    {notice && <div className="success-notice" role="status"><Check />{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss"><X /></button></div>}
    {error && <p className="form-error" role="alert"><X />{error}</p>}
    <section className="offer-grid">{visibleOffers.map((offer) => { const unavailable = offer.cost > balance; const Icon = offerIcons[offer.icon]; return <article className="offer-card" key={offer.id}><div className={`offer-art ${offer.category.toLowerCase()}`}><Icon /><span>{offer.category}</span></div><div className="offer-body"><p>{offer.category.toUpperCase()} · GOLD EXCLUSIVE</p><h2>{offer.title}</h2><span>{offer.detail}</span><div><strong>{offer.cost ? `${formatPoints(offer.cost)} points` : 'No points required'}</strong><button type="button" disabled={unavailable || offer.redeemed || busyId === offer.id} onClick={() => void act(offer)}>{offer.redeemed ? 'Added' : busyId === offer.id ? 'Working...' : unavailable ? 'More points needed' : offer.cost ? 'Redeem' : 'Activate'}</button></div></div></article> })}</section>
  </div>
}

function Switch({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch ${checked ? 'on' : ''}`} onClick={onClick}><span /></button>
}

function Preferences({ preferences, onSave }: { preferences: PreferenceValues; onSave: (preferences: PreferenceValues) => Promise<void> }) {
  const [prefs, setPrefs] = useState(preferences)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const toggle = (key: keyof typeof prefs) => { setPrefs((current) => ({ ...current, [key]: !current[key] })); setSaved(false) }
  const channels = [{ key: 'push', label: 'Push notifications', detail: 'Real-time updates on this device', icon: Bell }, { key: 'email', label: 'Email', detail: 'Sent to jordan.rivera@email.com', icon: Mail }, { key: 'sms', label: 'SMS', detail: 'Sent to mobile ending 0148', icon: MessageSquare }] as const
  const categories = [{ key: 'offers', label: 'Offers & promotions', detail: 'New rewards and limited-time offers' }, { key: 'points', label: 'Points & tier updates', detail: 'Balance changes and tier milestones' }, { key: 'events', label: 'Event invitations', detail: 'Shows, tastings, and member events' }, { key: 'responsible', label: 'Responsible gaming reminders', detail: 'Account and play wellness updates' }] as const
  return <div className="screen-content preferences"><AppHeader title="Notification preferences" kicker="PRIVACY & COMMUNICATION" /><p className="page-lead">Choose what you hear about and how we reach you. Your choices sync across every device.</p>
    <section className="preference-group"><SectionHeading kicker="DELIVERY" title="Channels" />{channels.map(({ key, label, detail, icon: Icon }) => <div className="preference-row" key={key}><span><Icon /></span><div><strong>{label}</strong><small>{detail}</small></div><Switch checked={prefs[key]} onClick={() => toggle(key)} label={label} /></div>)}</section>
    <section className="preference-group"><SectionHeading kicker="CONTENT" title="Categories" />{categories.map(({ key, label, detail }) => <div className="preference-row" key={key}><div><strong>{label}</strong><small>{detail}</small></div><Switch checked={prefs[key]} onClick={() => toggle(key)} label={label} /></div>)}</section>
    <section className="quiet-row"><div><strong>Quiet hours</strong><small>10:00 PM - 8:00 AM</small></div><Switch checked={prefs.quiet} onClick={() => toggle('quiet')} label="Quiet hours" /></section>
    {error && <p className="form-error" role="alert"><X />{error}</p>}
    <button className="primary-button save-button" type="button" disabled={saving} onClick={() => { setSaving(true); setError(''); void onSave(prefs).then(() => setSaved(true)).catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Preferences could not be saved.')).finally(() => setSaving(false)) }}>{saved ? <><Check /> Preferences saved</> : saving ? 'Saving...' : 'Save preferences'}</button>
  </div>
}

function Profile({ player }: { player: Player }) {
  return <div className="screen-content"><AppHeader title="Your profile" kicker={`MEMBER SINCE ${player.memberSince}`} /><section className="profile-panel"><div className="profile-avatar">{player.initials}</div><h2>{player.name}</h2><p>{player.tier} member · {player.city}</p><div><ShieldCheck /><span><strong>Identity verified</strong><small>Protected with Microsoft Entra ID</small></span></div></section></div>
}

function Navigation({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) {
  const items = [{ screen: 'home', label: 'Home', icon: Home }, { screen: 'rewards', label: 'Rewards', icon: Gift }, { screen: 'alerts', label: 'Alerts', icon: Bell }, { screen: 'profile', label: 'Profile', icon: UserRound }] as const
  return <nav className="bottom-nav" aria-label="Main navigation">{items.map(({ screen: target, label, icon: Icon }) => <button className={screen === target ? 'active' : ''} type="button" key={target} onClick={() => onNavigate(target)}><Icon /><span>{label}</span></button>)}</nav>
}

function App() {
  const [screen, setScreen] = useState<Screen>('register')
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [apiError, setApiError] = useState('')
  useEffect(() => {
    getLoyaltyData().then(setData).catch((requestError: unknown) => setApiError(requestError instanceof Error ? requestError.message : 'The loyalty service is unavailable.'))
  }, [])
  if (screen === 'register') return <Registration onComplete={() => setScreen('home')} />
  if (apiError) return <main className="auth-shell"><section className="auth-panel"><div className="form-wrap"><p className="step-label">SERVICE UNAVAILABLE</p><h2>Rewards are taking a break.</h2><p className="form-error" role="alert"><X />{apiError}</p><button className="primary-button" type="button" onClick={() => window.location.reload()}>Try again</button></div></section></main>
  if (!data) return <main className="auth-shell"><section className="auth-panel"><div className="form-wrap"><p className="step-label">LOADING</p><h2>Getting your rewards ready...</h2></div></section></main>

  const handleRedeem = async (offer: Offer) => {
    const result = await redeemOffer(offer.id, {
      ageVerified: data.player.ageVerified,
      kycStatus: data.player.kycStatus,
      entitlements: data.player.entitlements,
    })
    setData((current) => current && {
      ...current,
      player: { ...current.player, balance: result.balance },
      offers: current.offers.map((candidate) => candidate.id === result.offer.id ? result.offer : candidate),
    })
    return result.offer
  }
  const handlePreferences = async (preferences: PreferenceValues) => {
    const saved = await savePreferences(preferences)
    setData((current) => current && { ...current, preferences: saved })
  }

  return <div className="app-shell"><div className="desktop-brand"><Brand /><span>{data.player.tier.toUpperCase()} MEMBER</span></div>{screen === 'home' && <Dashboard player={data.player} activity={data.activity} />}{screen === 'rewards' && <Offers balance={data.player.balance} offers={data.offers} onRedeem={handleRedeem} />}{screen === 'alerts' && <Preferences preferences={data.preferences} onSave={handlePreferences} />}{screen === 'profile' && <Profile player={data.player} />}<Navigation screen={screen} onNavigate={setScreen} /></div>
}

export default App
