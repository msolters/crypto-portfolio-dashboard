const update_invested = _.debounce( (event) => {
  let funds_q = {
    _id: "invested"
  }
  let funds_update = {
    $set: {
      value: parseFloat(event.currentTarget.value || 0)
    }
  }
  Funds.update(funds_q, funds_update, {'upsert': true})
}, 1000 )

Template.displayPerformance.events({
  'input input[data-edit-invested]'(event, tmpl) {
    update_invested(event)
  }
})
