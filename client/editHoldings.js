Template.editHoldings.events({
  'submit form#edit-holdings': (event, tmpl) => {
    let new_holdings = tmpl.find("textarea#holdings-text").value
    new_holdings_json = JSON.parse(new_holdings)
    let _update = {
      $set: new_holdings_json
    }
    Holdings.update({_id: "config"}, _update, {
      upsert: true
    })
    return false
  }
})
