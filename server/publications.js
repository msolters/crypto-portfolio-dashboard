Meteor.publish( "PortfolioSnapshots", (granularity) => {
  const aggregate_q = {
    'minute': {
      t0: moment().startOf('hour').toDate()
    },
    'hour': {
      t0: moment().startOf('day').toDate()
    },
    'day': {
      t0: moment().startOf('month').toDate()
    }
  }

  return PortfolioSnapshots.find({
    granularity: granularity,
    ts: {
      $gte: aggregate_q[granularity].t0
    }
  }, {
    $sort: {
      ts: -1
    }
  })
})
Meteor.publish( "Holdings", () => {
  return Holdings.find()
})
Meteor.publish( "Funds", () => {
  return Funds.find()
})
