Meteor.publish( "PortfolioSnapshots", function(granularity, now) {
  const aggregate_q = {
    'minute': {
      't0'() {
        return moment.utc(now).subtract(1, 'hour').toDate()
      }
    },
    'hour': {
      't0'() {
        return moment.utc(now).subtract(1, 'day').toDate()
      }
    },
    'day': {
      't0'() {
        return moment.utc(now).subtract(1, 'month').toDate()
      }
    }
  }

  let t0 = aggregate_q[granularity].t0()
  let portfolio_snapshot_q = {
    userId: this.userId,
    granularity: granularity,
    ts: {
      $gte: t0
    },
  }
  return PortfolioSnapshots.find(portfolio_snapshot_q, {
    sort: {
      ts: -1
    }
  })
})
Meteor.publish( "SyncStatus", function() {
  q_ = {
    userId: this.userId
  }
  return SyncStatus.find(q_)
})
Meteor.publish( "Holdings", function() {
  q_ = {
    userId: this.userId
  }
  return Holdings.find(q_)
})
Meteor.publish( "Funds", function() {
  q_ = {
    userId: this.userId
  }
  return Funds.find(q_)
})
Meteor.publish( "LastMarketSnapshot", function( granularity ) {
  return MarketSnapshots.find({
    granularity: granularity
  }, {
    sort: {
      ts: -1
    },
    limit: 1
  })
})
