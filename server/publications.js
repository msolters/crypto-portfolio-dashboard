Meteor.publish( "LastHour", function() {
  return PortfolioSnapshots.find( {}, {
    sort: {
      ts: -1
    },
    limit: 60
  })
} )
Meteor.publish( "LastDay", function() {
  return PortfolioSnapshots.find( {}, {
    sort: {
      ts: -1
    },
    limit: 96
  })
} )
Meteor.publish(  "Portfolio", () => {
  return Portfolio.find()
})
Meteor.publish(  "Holdings", () => {
  return Holdings.find()
})
Meteor.publish(  "Funds", () => {
  return Funds.find()
})
