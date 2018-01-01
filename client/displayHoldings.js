Template.displayHoldings.helpers({
  holdings() {
    return Holdings.find()
  }
})

const update_holding_symbol = _.debounce( (holding, tmpl) => {
  let holding_q = {
    _id: holding._id
  }
  let holding_update = {
    $set: {
      symbol: tmpl.find('input[data-edit-holding-symbol]').value
    }
  }
  Holdings.update(holding_q, holding_update)

  //  Create a new allocation snapshot
  Meteor.call('update_allocation_snapshot')
}, 1000 )

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
      symbol: `New Coin ${num_coins+1}`,
      quantity: 0,
    }
    let holding_id = Holdings.insert(new_coin)

    //  Focus the new coin box's text input
    let new_coin_input = tmpl.find(`input#coin-symbol-input-${holding_id}`)
    new_coin_input.focus()
    new_coin_input.select()

    //  Create a new allocation snapshot
    Meteor.call('update_allocation_snapshot')
  },
})

Template.coin.events({
  'input input[data-edit-holding-symbol]'(event, tmpl) {
    update_holding_symbol(this, tmpl)
  },

  'input input[data-edit-holding-quantity]'(event, tmpl) {
    update_holding_quantity(this, tmpl)
  },

  'click button[data-delete-coin]'(event, tmpl) {
    let holding_q = {
      _id: this._id
    }
    Holdings.remove(holding_q)

    //  Create a new allocation snapshot
    Meteor.call('update_allocation_snapshot')
  },
})
