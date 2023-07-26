// vars referenced by multiple components

export default {
  spaceZoom: {
    max: 100,
    min: 20
  },
  spaceBetweenCards: 12,
  maxCardLength: 300,
  defaultCardWidth: 76,
  referralCreditAmount: 6,
  defaultTimeout: 40000,
  minCardEmbedWidth: 235,
  defaultCardMaxWidth: 200,
  AIImageLimitUpgradedUser: 50,
  AIImageLimitFreeUser: 10,
  pexelsApiKey: '4kZOQl4a0OjcWLrMHzj6sEJMarmlZzJiP6P67lqZpOrxbtITfwpKyC4j',
  iframelyApiKey: '0788beaa34f65adc0fe7ac',
  rootUserId: 'euGhpBrR9eBcjKnK16C_g',
  sidebarWidth: 250,
  systemCommands: { explore: 'Explore', newSpace: 'New Space', templates: 'Templates', apps: 'Download Apps and Extensions' },
  isDevelopment: import.meta.env.MODE === 'development',
  isSecureAppContextIOS: navigator.isSecureAppContextIOS, // true = iOS app
  isSecureAppContext: navigator.isSecureAppContext, // true = iOS app
  kinopioDomain () {
    let domain = 'https://kinopio.club'
    if (this.isDevelopment) {
      domain = 'https://kinopio.local:8080'
    }
    return domain
  },
  apiHost () {
    let host = 'https://api.kinopio.club'
    if (this.isDevelopment) {
      host = 'https://kinopio.local:3000'
    }
    return host
  },
  websocketHost () {
    let host = 'wss://api.kinopio.club'
    if (this.isDevelopment) {
      host = 'wss://kinopio.local:3000'
    }
    return host
  },
  userPrefersReducedMotion () {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (query.matches) {
      return true
    } else {
      return false
    }
  },

  // price

  price (period) {
    if (period === 'month') {
      return this.monthlyPrice()
    } else if (period === 'year') {
      return this.yearlyPrice()
    }
  },
  monthlyPrice () {
    let price = {
      amount: 6,
      period: 'month',
      stripePriceId: 'price_1L2GvBDFIr5ywhwobbE35dhA',
      applePriceId: 'apple_monthly_2023'
    }
    if (this.isDevelopment) {
      price.stripePriceId = 'price_1L7200DFIr5ywhwoAJGkA7yK'
    }
    if (this.isSecureAppContextIOS) {
      price.amount = 7
    }
    return price
  },
  yearlyPrice () {
    let price = {
      amount: 60,
      period: 'year',
      stripePriceId: 'price_1L2ErWDFIr5ywhwodsKxEEAq',
      applePriceId: 'apple_yearly_2023'
    }
    if (this.isDevelopment) {
      price.stripePriceId = 'price_1L720NDFIr5ywhwo0wS5PWAv'
    }
    if (this.isSecureAppContextIOS) {
      price.amount = 70
    }
    return price
  }

}
