Template.displayHoldings.helpers({
  holdings() {
    return Holdings.find()
  }
})

const update_holding_symbol = _.debounce( (holding, event) => {
  let holding_q = {
    _id: holding._id
  }
  let holding_update = {
    $set: {
      symbol: event.currentTarget.value
    }
  }
  Holdings.update(holding_q, holding_update)
}, 1000 )

const update_holding_quantity = _.debounce( (holding, event) => {
  let holding_q = {
    _id: holding._id
  }
  let holding_update = {
    $set: {
      quantity: parseFloat(event.currentTarget.value || 0)
    }
  }
  Holdings.update(holding_q, holding_update)
}, 1000 )

Template.displayHoldings.events({
  'click button[data-add-coin]'() {
    let num_coins = Holdings.find().count()
    let new_coin = {
      symbol: `New Coin ${num_coins+1}`,
      quantity: 0
    }
    Holdings.insert(new_coin)
  },

  'input input[data-edit-holding-symbol]'(event, tmpl) {
    update_holding_symbol(this, event)
  },

  'input input[data-edit-holding-quantity]'(event, tmpl) {
    update_holding_quantity(this, event)
  },

  'click button[data-delete-coin]'(event, tmpl) {
    let holding_q = {
      _id: this._id
    }
    Holdings.remove(holding_q)
  },
})
