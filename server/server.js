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
  /*  TODO: by user
  if( !Funds.findOne({_id: 'invested'}) ) {
    Funds.insert({
      _id: "invested",
      value: 0
    })
  }
  */

  //  Get and store market data every 1 minute
  get_market_snapshot()
  Meteor.setInterval( get_market_snapshot, 5000 )

  //  Process market data into user-specific portfolio data
  Meteor.setInterval( () => {
    Meteor.call('process_market_snapshots')
  }, 3000)

  Meteor.setInterval( () => {
    Meteor.call('process_all_user_portfolios')
  }, 3000)
});
