Template.displayHoldings.helpers({
  holdings() {
    return Holdings.find()
  }
})

const update_holding_quantity = _.debounce( (holding, tmpl) => {
  //  Update Holding document
  let holding_q = {
    _id: holding._id
  }
  let holding_update = {
    $set: {
      quantity: parseFloat(tmpl.find('input[data-edit-holding-quantity]').value || 0)
    }
  }
  Holdings.update(holding_q, holding_update)

  //  Create a new allocation snapshot
  Meteor.call('update_allocation_snapshot')
}, 1000 )

Template.displayHoldings.events({
  'click button[data-add-coin]'(event, tmpl) {
    let num_coins = Holdings.find().count()
    let new_coin = {
      userId: Meteor.userId(),
      symbol: null,
      quantity: 0,
    }
    let holding_id = Holdings.insert(new_coin)

    //  Focus the new coin box's text input
    // let new_coin_input = tmpl.find(`select#${holding_id}`)

    //  Create a new allocation snapshot
    Meteor.call('update_allocation_snapshot')
  },
})


Template.coin.onCreated( function() {

})

const all_coins = [{"value":null,"text":"Choose"},{"value":"bitcoin","text":"BTC"},{"value":"ripple","text":"XRP"},{"value":"ethereum","text":"ETH"},{"value":"bitcoin-cash","text":"BCH"},{"value":"cardano","text":"ADA"},{"value":"litecoin","text":"LTC"},{"value":"iota","text":"MIOTA"},{"value":"nem","text":"XEM"},{"value":"stellar","text":"XLM"},{"value":"dash","text":"DASH"},{"value":"monero","text":"XMR"},{"value":"eos","text":"EOS"},{"value":"neo","text":"NEO"},{"value":"bitcoin-gold","text":"BTG"},{"value":"qtum","text":"QTUM"},{"value":"raiblocks","text":"XRB"},{"value":"tron","text":"TRX"},{"value":"ethereum-classic","text":"ETC"},{"value":"lisk","text":"LSK"},{"value":"icon","text":"ICX"},{"value":"bitconnect","text":"BCC"},{"value":"verge","text":"XVG"},{"value":"bitshares","text":"BTS"},{"value":"omisego","text":"OMG"},{"value":"zcash","text":"ZEC"},{"value":"populous","text":"PPT"},{"value":"ardor","text":"ARDR"},{"value":"stratis","text":"STRAT"},{"value":"tether","text":"USDT"},{"value":"waves","text":"WAVES"},{"value":"hshare","text":"HSR"},{"value":"steem","text":"STEEM"},{"value":"bytecoin-bcn","text":"BCN"},{"value":"komodo","text":"KMD"},{"value":"dogecoin","text":"DOGE"},{"value":"siacoin","text":"SC"},{"value":"status","text":"SNT"},{"value":"binance-coin","text":"BNB"},{"value":"augur","text":"REP"},{"value":"golem-network-tokens","text":"GNT"},{"value":"ark","text":"ARK"},{"value":"veritaseum","text":"VERI"},{"value":"decred","text":"DCR"},{"value":"digibyte","text":"DGB"},{"value":"vechain","text":"VEN"},{"value":"salt","text":"SALT"},{"value":"nxt","text":"NXT"},{"value":"pivx","text":"PIVX"},{"value":"factom","text":"FCT"},{"value":"monacoin","text":"MONA"},{"value":"request-network","text":"REQ"},{"value":"byteball","text":"GBYTE"},{"value":"maidsafecoin","text":"MAID"},{"value":"zcoin","text":"XZC"},{"value":"dragonchain","text":"DRGN"},{"value":"basic-attention-token","text":"BAT"},{"value":"0x","text":"ZRX"},{"value":"kyber-network","text":"KNC"},{"value":"tenx","text":"PAY"},{"value":"wax","text":"WAX"},{"value":"electroneum","text":"ETN"},{"value":"power-ledger","text":"POWR"},{"value":"bitcoindark","text":"BTCD"},{"value":"syscoin","text":"SYS"},{"value":"bytom","text":"BTM"},{"value":"funfair","text":"FUN"},{"value":"aion","text":"AION"},{"value":"kucoin-shares","text":"KCS"},{"value":"digixdao","text":"DGD"},{"value":"santiment","text":"SAN"},{"value":"qash","text":"QASH"},{"value":"aeternity","text":"AE"},{"value":"civic","text":"CVC"},{"value":"reddcoin","text":"RDD"},{"value":"storj","text":"STORJ"},{"value":"vertcoin","text":"VTC"},{"value":"ethos","text":"ETHOS"},{"value":"rchain","text":"RHOC"},{"value":"walton","text":"WTC"},{"value":"skycoin","text":"SKY"},{"value":"gas","text":"GAS"},{"value":"quantstamp","text":"QSP"},{"value":"kin","text":"KIN"},{"value":"gamecredits","text":"GAME"},{"value":"experience-points","text":"XP"},{"value":"gnosis-gno","text":"GNO"},{"value":"iconomi","text":"ICN"},{"value":"aelf","text":"ELF"},{"value":"raiden-network-token","text":"RDN"},{"value":"chainlink","text":"LINK"},{"value":"bancor","text":"BNT"},{"value":"enigma-project","text":"ENG"},{"value":"substratum","text":"SUB"},{"value":"decentraland","text":"MANA"},{"value":"smartcash","text":"SMART"},{"value":"nav-coin","text":"NAV"},{"value":"bridgecoin","text":"BCO"},{"value":"triggers","text":"TRIG"},{"value":"ubiq","text":"UBQ"},{"value":"cryptonex","text":"CNX"}]

Template.coin.helpers({
  'available_coins'() {
    let data = Template.currentData()
    let holdings = Holdings.find().fetch()
    holdings = _.reject(holdings, h => {
      return (h.symbol === data.symbol)
    })
    holdings = _.map(holdings, h => h.symbol)
    let available_coins = _.reject(all_coins, (c) => {
      return _.contains(holdings, c.value)
    })
    if( data.symbol !== null ) {
      available_coins = _.reject(available_coins, c => {
        return (c.value === null)
      })
    }
    return available_coins
  },

  'current_choice'() {
    let holding = Holdings.findOne({_id: Template.currentData()._id})
    if( !holding ) return
    return {
      value: holding.symbol
    }
  }
})

Template.coin.events({
  'change select'(event, tmpl) {
    let holding_q = {
      _id: tmpl.data._id
    }
    let holding_update = {
      $set: {
        symbol: this.choice.value
      }
    }
    Holdings.update(holding_q, holding_update)

    //  Create a new allocation snapshot
    Meteor.call('update_allocation_snapshot')
  },

  'input input[data-edit-holding-quantity]'(event, tmpl) {
    update_holding_quantity(this, tmpl)
  },

  'click button[data-delete-coin]'(event, tmpl) {
    let holding_q = {
      _id: tmpl.data._id
    }
    Holdings.remove(holding_q)

    //  Create a new allocation snapshot
    Meteor.call('update_allocation_snapshot')
  },
})
