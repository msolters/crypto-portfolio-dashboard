Meteor.methods({
  'update_allocation_snapshot'() {
    user_q = {
      userId: Meteor.userId()
    }
    let holdings = Holdings.find(user_q).fetch()
    let funds = Funds.findOne(user_q)
    let allocation_snapshot = {
      userId: Meteor.userId(),
      createdAt: new Date(),
      invested: funds.invested,
      coins: {}
    }
    _.forEach(holdings, (h) => {
      allocation_snapshot.coins[h.symbol] = h.quantity
    })
    AllocationSnapshots.insert(allocation_snapshot)

    let market_snapshot = MarketSnapshots.findOne({}, {
      sort: {
        createdAt: -1
      }
    })
    if( !market_snapshot ) return
    _.each(allocation_snapshot.coins, (quantity, coin) => {
      let coin_data = _.findWhere(market_snapshot.coins, {
        id: coin
      })
    })
    SyncStatus.update(user_q, {
      $set: {
        last_synced: new Date()
      }
    }, {
      upsert: true
    })
  },

  'update_market_snapshots'(cmc_snapshot_ids) {
    const ts_aggregate_filters = {
      'minute': {
        year: {
          $year: '$createdAt',
        },
        month: {
          $month: '$createdAt',
        },
        day: {
          $dayOfMonth: '$createdAt',
        },
        hour: {
          $hour: '$createdAt'
        },
        minute: {
          $minute: '$createdAt'
        }
      },
      'hour': {
        year: {
          $year: '$createdAt',
        },
        month: {
          $month: '$createdAt',
        },
        day: {
          $dayOfMonth: '$createdAt',
        },
        hour: {
          $hour: '$createdAt'
        }
      },
      'day': {
        year: {
          $year: '$createdAt',
        },
        month: {
          $month: '$createdAt',
        },
        day: {
          $dayOfMonth: '$createdAt',
        }
      }
    }

    const ts_date_constructors = {
      'minute'(ts) {
        return new Date(Date.UTC(ts.year, ts.month-1, ts.day, ts.hour, ts.minute))
      },
      'hour'(ts) {
        return new Date(Date.UTC(ts.year, ts.month-1, ts.day, ts.hour))
      },
      'day'(ts) {
        return new Date(Date.UTC(ts.year, ts.month-1, ts.day))
      }
    }

    for( let [granularity, aggregation_filter] of Object.entries(ts_aggregate_filters) ) {
      let pipeline = [
        {
          $match: {
            _id: {
              $in: cmc_snapshot_ids
            }
          },
        },
        {
          $limit: 10
        },
        //  Make a separate document for each unique {date, coin} pair
        {
          $unwind: '$coins'
        },
        //  Group by {aggregate_date, coin}
        //  Add up price and keep track of samples
        {
          $group: {
            _id: {
              'ts': aggregation_filter,
              'coin': '$coins.id',
              'symbol': '$coins.symbol'
            },
            'price': {
              $sum: '$coins.price_usd'
            },
            'samples': {
              $sum: 1
            }
          }
        },
        //  Regroup by aggregate_date alone
        //  Construct an array containing all coins per document
        {
          $group: {
            _id: {
              ts: '$_id.ts',
            },
            coins: {
              $push: {
                id: '$_id.coin',
                symbol: '$_id.symbol',
                price_usd: '$price',
                samples: '$samples'
              }
            }
          }
        }
      ]

      let market_snapshots = CoinmarketcapSnapshots.aggregate( pipeline )

      //  Update MarketSnapshots based on this data
      _.each(market_snapshots, (m) => {
        m.granularity = granularity
        m.ts = ts_date_constructors[granularity](m._id.ts)
        let market_snapshot_q = {
          granularity: m.granularity,
          ts: m.ts
        }
        let market_snapshot_modifier = {
          $inc: {},
          $set: {}
        }
        //  Update each coin
        _.each(m.coins, (c) => {
          market_snapshot_modifier.$set[`coins.${c.id}.id`] = c.id
          market_snapshot_modifier.$set[`coins.${c.id}.symbol`] = c.symbol
          market_snapshot_modifier.$inc[`coins.${c.id}.price_usd`] = c.price_usd
          market_snapshot_modifier.$inc[`coins.${c.id}.samples`] = c.samples
        })
        MarketSnapshots.update(market_snapshot_q, market_snapshot_modifier, {upsert: true})
      })
    }
  },

  'update_funds'(invested) {
    let funds_q = {
      userId: Meteor.userId()
    }
    let funds_update = {
      $set: {
        invested: parseFloat(invested || 0)
      }
    }
    Funds.update(funds_q, funds_update, {'upsert': true})

    //  Create a new allocation snapshot
    Meteor.call('update_allocation_snapshot')
  },

  'cleanup_documents'() {
    //  Delete outdated PortfolioSnapshots
    const portfolio_snapshot_cleanup_q = {
      'minute'() {
        return moment().subtract(60, 'minutes').toDate()
      },
      'hour'() {
        return moment().subtract(24, 'hours').toDate()
      },
      'day'() {
        return moment().subtract(1, 'month').toDate()
      }
    }

    //  Delete processed Coinmarketcap request responses
    CoinmarketcapSnapshots.remove({
      processed: true
    })

    //  Delete outdated MarketSnapshots
    for( let [granularity, t0] of Object.entries(portfolio_snapshot_cleanup_q) ) {
      let market_snapshot = MarketSnapshots.findOne({
        granularity: granularity,
      }, {
        sort: {
          ts: -1
        }
      })
      if( market_snapshot ) {
        MarketSnapshots.remove({
          granularity: granularity,
          ts: {
            $lt: market_snapshot.ts
          }
        })
      }
    }

    for( let [granularity, t0] of Object.entries(portfolio_snapshot_cleanup_q) ) {
      PortfolioSnapshots.remove({
        granularity: granularity,
        ts: {
          $lt: t0()
        }
      })
    }
  },

  /**
   * Find all un-processed CoinmarketcapSnapshots
   * Generate/update aggregated MarketSnapshots based on the new data.
   */
  'process_cmc_snapshots'() {
    //  Get all un-processed CoinmarketcapSnapshots
    let cmc_snapshots = CoinmarketcapSnapshots.find({
      processed: false
    }).fetch()
    cmc_snapshot_ids = cmc_snapshots.map(cmc => cmc._id)

    //  Average reports for all users
    Meteor.call('update_market_snapshots', cmc_snapshot_ids, (e, r) => {console.error(e)})

    //  Process each CMC snapshot
    _.each(cmc_snapshots, (cmc_snapshot) => {
      Meteor.call('process_cmc_snapshot', cmc_snapshot, (e, r) => {console.error(e)})
    })

    //  Mark cmc_snapshot_ids as being processed
    CoinmarketcapSnapshots.update({
      _id: {
        $in: cmc_snapshot_ids
      }
    }, {
      $set: {
        processed: true
      }
    }, {
      multi: true
    })
  },

  /**
   * Process a cmc_snapshot for all users
   */
  'process_cmc_snapshot'(cmc_snapshot) {
    //  Update portfolios, per-user
    let user_ids = Meteor.users.find({}, {
      fields: {
        _id: 1
      }
    })
    .map(u => u._id)
    _.each(user_ids, (userId) => {
      Meteor.call('process_cmc_snapshot_user', cmc_snapshot, userId)
    })
  },

  /**
   * Process a Coinmarketcap snapshot for all granularity levels
   * of a specific user
   */
  'process_cmc_snapshot_user'(cmc_snapshot, userId) {
    //  Get: AllocationSnapshot
    let allocation_snapshot_q = {
      createdAt: {
        $lte: cmc_snapshot.createdAt
      }
    }
    let allocation_filter = {
      sort: {
        createdAt: -1
      },
      limit: 1
    }
    let allocation_snapshot = AllocationSnapshots
      .find(allocation_snapshot_q, allocation_filter)
      .fetch()[0]
    if( !allocation_snapshot ) return
    let invested = (allocation_snapshot.invested) ? allocation_snapshot.invested : 0

    //  Compute: Portfolio changes
    let updated_coin_data = {}
    let total_portfolio_value = 0
    _.each(allocation_snapshot.coins, (quantity, coin) => {
      let coin_data = _.findWhere(cmc_snapshot.coins, {
        id: coin
      })
      if( !coin_data ) return // skip this coin
      coin_data.coin_value = coin_data.price_usd * quantity
      total_portfolio_value += coin_data.coin_value
      updated_coin_data[coin] = coin_data
    })
    let return_value = total_portfolio_value - invested
    let performance = (invested) ? return_value / invested * 100 : 0

    //  Set: Portfolio changes per granularity level
    for( let granularity of ['minute', 'hour', 'day'] ) {
      let ts = moment.utc(cmc_snapshot.createdAt).startOf(granularity).toDate()

      let portfolio_snapshot_q = {
        userId: userId,
        ts,
        granularity
      }
      let portfolio_snapshot_modifier = {
        $inc: {
          invested: invested,
          total: total_portfolio_value,
          return: return_value,
          performance,
          samples: 1
        },
        $set: {}
      }

      _.each(updated_coin_data, (coin_data, coin) => {
        portfolio_snapshot_modifier.$set[`coins.${coin}.symbol`] = coin_data.name
        portfolio_snapshot_modifier.$inc[`coins.${coin}.samples`] = 1
        portfolio_snapshot_modifier.$inc[`coins.${coin}.total`] = coin_data.coin_value
      })

      if( !Object.keys(portfolio_snapshot_modifier.$set).length ) delete portfolio_snapshot_modifier.$set

      PortfolioSnapshots.update(
        portfolio_snapshot_q,
        portfolio_snapshot_modifier,
        {upsert: true}
      )
    }

    SyncStatus.update({
      userId: userId
    }, {
      $set: {
        last_synced: new Date()
      }
    }, {
      upsert: true
    })
  },

})
