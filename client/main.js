import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Template.body.onCreated( function() {
  const tmpl = this
  tmpl.subscribe("Funds")
  tmpl.subscribe("Holdings")
})

Template.body.events({
})

Template.registerHelper('portfolio', () => {
  return PortfolioSnapshots.findOne({}, {
    sort: {
      ts: -1
    },
    limit: 1
  })
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
  if( Funds.findOne({_id: "invested"}) ) return Funds.findOne({_id: "invested"}).value
  return "0"
})
Template.registerHelper('coinValue', (coin) => {
  let portfolio = PortfolioSnapshots.findOne({}, {
    sort: {
      ts: -1
    }
  })
  if( !portfolio ) return accounting.formatMoney(0)
  let coin_data = _.findWhere(portfolio.coins, {id: coin})
  if( !coin_data ) return accounting.formatMoney(0)
  return accounting.formatMoney(coin_data.coin_value || 0)
})
Template.registerHelper('coinPrice', (coin) => {
  let portfolio = PortfolioSnapshots.findOne({}, {
    sort: {
      ts: -1
    }
  })
  if( !portfolio ) return accounting.formatMoney(0)
  let coin_data = _.findWhere(portfolio.coins, {id: coin})
  if( !coin_data ) return accounting.formatMoney(0)
  return accounting.formatMoney(coin_data.price_usd/coin_data.samples || 0)
})
