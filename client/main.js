import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Template.registerHelper('portfolio', () => {
  return PortfolioSnapshots.findOne({}, {
    sort: {
      ts: -1
    },
    limit: 1
  })
})
Template.registerHelper('syncStatus', () => {
  return SyncStatus.findOne()
})

Template.registerHelper('formatMoney', (m) => {
  return accounting.formatMoney(m)
})
Template.registerHelper('humanDuration', (t0) => {
  let diff = moment().diff(t0, 'seconds')
  return moment.duration(diff, 'seconds').humanize()
})
Template.registerHelper('formatFixed', (m) => {
  if( !m ) return 0
  m = parseFloat(m)
  return m.toFixed(2)
})
Template.registerHelper('invested', () => {
  if( Funds.findOne() ) return Funds.findOne().invested
  return "0"
})
Template.registerHelper('performancePercent', () => {
  let portfolio = PortfolioSnapshots.findOne({}, {
    sort: {
      ts: -1
    }
  })
  if( !portfolio || isNaN(portfolio.performance) || portfolio.performance === Infinity ) return '---'
  return portfolio.performance.toFixed(2)
})
Template.registerHelper('coinValue', (coin) => {
  if( coin === null ) {
    return '---'
  }
  let market = MarketSnapshots.findOne({}, {
    sort: {
      ts: -1
    }
  })
  if( !market ) return '---'
  let holding = Holdings.findOne({
    symbol: coin
  })
  let coin_data = _.findWhere(market.coins, {id: coin})
  if( !coin_data ) return '---'
  return accounting.formatMoney((coin_data.price_usd/coin_data.samples) * holding.quantity || 0)
})
Template.registerHelper('coinPrice', (coin) => {
  let market = MarketSnapshots.findOne({}, {
    sort: {
      ts: -1
    }
  })
  if( !market ) return accounting.formatMoney(0)
  let coin_data = _.findWhere(market.coins, {id: coin})
  if( !coin_data ) return accounting.formatMoney(0)
  return accounting.formatMoney(coin_data.price_usd/coin_data.samples || 0)
})
