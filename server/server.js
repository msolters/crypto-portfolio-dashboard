import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

function get_coin( coin ) {
  return new Promise( (resolve, reject) => {
    const request_url = `https://api.coinmarketcap.com/v1/ticker/${coin}/?convert=USD`
    HTTP.call( "GET", request_url, (err, resp) => {
      if( err ) {
        reject( err )
        return
      }
      let data = resp.data[0]
      resolve(data)
    })
  })
}

function get_market() {
  return new Promise( (resolve, reject) => {
    const request_url = `https://api.coinmarketcap.com/v1/ticker`
    HTTP.call( "GET", request_url, (err, resp) => {
      if( err ) {
        reject( err )
        return
      }
      let data = resp.data
      _.forEach(data, (c) => {
        c.price_usd = parseFloat( c.price_usd )
      })
      resolve(data)
    })
  })
}

const get_market_snapshot = () => {
  get_market()
  .then( (market) => {
    let market_snapshot = {
      coins: market,
      createdAt: new Date(),
      processed: false
    }
    CoinmarketcapSnapshots.insert(market_snapshot)
  })
  .catch( (error) => {
    console.log(`Encountered error: `, error)
  })
}

Meteor.startup(() => {
  //  Establish DB indices
  PortfolioSnapshots._ensureIndex({
    _id: 1,
    userId: 1,
    granularity: 1,
    ts: 1
  })
  MarketSnapshots._ensureIndex({
    _id: 1,
    processed: 1,
    granularity: 1,
    ts: -1
  })
  Holdings._ensureIndex({
    _id: 1,
    userId: 1
  })

  //  Get and store market data every 1 minute
  const get_market_snapshots = Meteor.bindEnvironment( () => {
    get_market_snapshot()
    setTimeout( get_market_snapshots, 5000 )
  })
  get_market_snapshots()

  //  Process market data into user-specific portfolio data
  const process_market_snapshots = Meteor.bindEnvironment( () => {
    Meteor.call('process_market_snapshots')
    setTimeout( process_market_snapshots, 3000 )
  })
  process_market_snapshots()

  const process_all_portfolios = Meteor.bindEnvironment( () => {
    Meteor.call('process_all_user_portfolios')
    setTimeout( process_all_portfolios, 3000 )
  })
  process_all_portfolios()

  Meteor.setInterval( () => {
    Meteor.call('cleanup_documents')
  }, 60000)
});
