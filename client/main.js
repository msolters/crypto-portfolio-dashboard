import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Template.body.onCreated( function() {
  this.subscribe("Funds")
  this.subscribe("Holdings")
  this.subscribe("Portfolio")
})

Template.registerHelper('portfolio', () => {
  return Portfolio.findOne()
})
Template.registerHelper('formatMoney', (m) => {
  return accounting.formatMoney(m)
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
  let portfolio = Portfolio.findOne()
  if( !portfolio ) return accounting.formatMoney(0)
  let coin_data = _.findWhere(portfolio.coins, {id: coin})
  if( !coin_data ) return accounting.formatMoney(0)
  return accounting.formatMoney(coin_data.coin_value || 0)
})
Template.registerHelper('coinPrice', (coin) => {
  let portfolio = Portfolio.findOne()
  if( !portfolio ) return accounting.formatMoney(0)
  let coin_data = _.findWhere(portfolio.coins, {id: coin})
  if( !coin_data ) return accounting.formatMoney(0)
  return accounting.formatMoney(coin_data.price_usd || 0)
})
