Meteor.publish( "PortfolioSnapshots", (granularity, now) => {
  const aggregate_q = {
    'minute': {
      't0'() {
        return moment(now).subtract(1, 'hour').toDate()
      }
    },
    'hour': {
      't0'() {
        return moment(now).subtract(1, 'day').toDate()
      }
    },
    'day': {
      't0'() {
        return moment(now).subtract(1, 'month').toDate()
      }
    }
  }

  let t0 = aggregate_q[granularity].t0()
  let portfolio_snapshot_q = {
    granularity: granularity,
    ts: {
      $gte: t0
    }
  }
  return PortfolioSnapshots.find(portfolio_snapshot_q, {
    $sort: {
      ts: -1
    }
  })
})
Meteor.publish( "SyncStatus", () => {
  return SyncStatus.find()
})
Meteor.publish( "Holdings", () => {
  return Holdings.find()
})
Meteor.publish( "Funds", () => {
  return Funds.find()
})
