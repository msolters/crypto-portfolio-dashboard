import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

function get_coin( coin ) {
  return new Promise( (resolve, reject) => {
    const request_url = `https://api.coinmarketcap.com/v1/ticker/${coin}/?convert=USD`
    //console.log(request_url)
    HTTP.call( "GET", request_url, (err, resp) => {
      if( err ) reject( err )
      let data = resp.data[0]
      resolve(data)
    })
  })
}

function compute_portfolio() {
  return new Promise( (resolve, reject) => {
    let holdings = Holdings.find().fetch()
    if( !holdings ) {
      reject('No holdings found.')
      return
    }
    let invested = Funds.findOne()
    let coins = {
    /*  usd: {
        symbol: "USD",
        coin_value: holdings.usd
      }*/
    }
    let total_portfolio_value = 0
    for( let coin of holdings ) {
      get_coin(coin.symbol)
      .then( (coin_data) => {
        coins[coin_data.symbol] = coin_data
        let coin_value = parseFloat(coin_data.price_usd) * coin.quantity
        coins[coin_data.symbol].coin_value = coin_value
        total_portfolio_value += coin_value
        //total_portfolio_value += holdings.usd
        if( Object.keys(coins).length === holdings.length ) {
          let return_value = total_portfolio_value - invested.value
          resolve({
            total: total_portfolio_value,
            return: return_value,
            invested: invested.value,
            performance: (return_value / invested.value * 100),
            coins
          })
        }
      })
      .catch( (error) => {
        reject(error)
      })
    }
  })
}

const update_portfolio = () => {
  compute_portfolio()
  .then( (portfolio) => {
    let snapshot = {
      ts: new Date(),
      total: portfolio.total,
      return: portfolio.return,
      performance: portfolio.performance,
      coins: {}
    }
    for( let coin of _.sortBy(portfolio.coins, c => c.coin_value) ) {
      snapshot.coins[coin.symbol] = {
        symbol: coin.symbol,
        value: coin.coin_value
      }
    }
    Portfolio.update({_id: 'current'}, {$set: portfolio}, {upsert: true})
    PortfolioSnapshots.insert(snapshot)
  })
  .catch( (error) => {
    console.log(`Encountered error: `, error)
  })
}

Meteor.startup(() => {
  if( !Funds.findOne({_id: 'invested'}) ) {
    Funds.insert({
      _id: "invested",
      value: 0
    })
  }

  //  Get and store portfolio data every 1 minute
  update_portfolio()
  Meteor.setInterval( update_portfolio, 60000*15)
});
