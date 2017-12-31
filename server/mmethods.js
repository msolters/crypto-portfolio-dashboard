

Meteor.methods({
  'update_allocation_snapshot'() {
    let holdings = Holdings.find().fetch()
    let invested = Funds.findOne()
    let allocation_snapshot = {
      createdAt: new Date(),
      invested: invested.value,
      coins: {}
    }
    _.forEach(holdings, (h) => {
      allocation_snapshot.coins[h.symbol] = h.quantity
    })
    AllocationSnapshots.insert(allocation_snapshot)
  },

  'process_portfolios'() {
    //  Get all un-processed MarketSnapshots
    let market_snapshot_ids = MarketSnapshots.find({
      processed: false
    }, {
      fields: {
        _id: 1
      }
    }).fetch()
    market_snapshot_ids = market_snapshot_ids.map(m => m._id)

    for( let granularity of ['minute', 'hour', 'day'] ) {
      //  Get all un-processed market snapshots for this granularity
      let market_snapshots_q = {
        _id: {
          $in: market_snapshot_ids
        },
        granularity: granularity
      }
      let market_snapshots = MarketSnapshots
      .find(market_snapshots_q, {
        sort: {
          ts: 1
        }
      })
      .fetch()
      if( !market_snapshots || !market_snapshots.length ) continue
      // console.log(`Processing ${market_snapshots.length} market snapshots...`)

      //  Get the first allocation snapshot corresponding to this market data
      let first_allocation_snapshot_q = {
        createdAt: {
          $lte: market_snapshots[0].ts
        }
      }
      let first_allocation_snapshot_filter = {
        sort: {
          createdAt: -1
        }
      }
      let first_allocation_snapshot = AllocationSnapshots.findOne(first_allocation_snapshot_q, first_allocation_snapshot_filter)

      //  Get the remainder of any allocation snapshots corresponding to this
      //  market data
      let allocation_snapshot_q = {
        createdAt: {
          $gt: market_snapshots[0].ts
        }
      }
      allocation_snapshots = AllocationSnapshots
      .find(allocation_snapshot_q, {
        sort: {
          createdAt: 1
        }
      })
      .fetch()

      //  Combine allocation snapshots into single array
      if( first_allocation_snapshot ) allocation_snapshots.unshift(first_allocation_snapshot)
      if( !allocation_snapshots.length ) continue

      let a_idx = 0
      let m_idx = 0
      while( m_idx < market_snapshots.length && a_idx < allocation_snapshots.length ) {
        //  Skip market data we don't have allocations for
        while( market_snapshots[m_idx].ts < allocation_snapshots[a_idx].createdAt ) m_idx++
        if( m_idx === market_snapshots.length ) break

        //  Get a new market snapshot
        let m = market_snapshots[ m_idx ]

        //  Ensure we're using the latest possible allocation snapshot
        let a_idx_offset = 0
        while( (a_idx+a_idx_offset <= allocation_snapshots.length-1) && (allocation_snapshots[ a_idx + a_idx_offset ].createdAt <= m.ts) ) a_idx_offset++
        a_idx += Math.max((a_idx_offset-1), 0)

        //  Get a new allocation snapshot
        let a = allocation_snapshots[ a_idx ]

        //  Compute a new portfolio snapshot using the
        Meteor.call('compute_portfolio_snapshot', a, m)

        //  Get the next market snapshot
        m_idx++
      }
    }

    //  Mark un-processed MarketSnapshots as processed
    MarketSnapshots.update({
      _id: {
        $in: market_snapshot_ids
      }
    }, {
      $set: {
        processed: true
      }
    }, {
      multi: true
    })
  },

  'compute_portfolio_snapshot'(a, m) {
    let portfolio_snapshot = {
      ts: m.createdAt,
      invested: a.invested,
      coins: {}
    }

    let portfolio_snapshot_q = {
      ts: m.ts,
      granularity: m.granularity
    }
    let portfolio_snapshot_modifier = {
      $set: {
        invested: a.invested
      }
    }

    let total_portfolio_value = 0
    _.each(a.coins, (quantity, coin) => {
      let coin_data = _.findWhere(m.coins, {
        id: coin
      })
      coin_data.coin_value = coin_data.price_usd * quantity / coin_data.samples
      total_portfolio_value += coin_data.coin_value
      portfolio_snapshot_modifier.$set[`coins.${coin}`] = coin_data
    })

    let return_value = total_portfolio_value - a.invested
    portfolio_snapshot_modifier.$set.total = total_portfolio_value
    portfolio_snapshot_modifier.$set.return = return_value
    portfolio_snapshot_modifier.$set.performance = return_value / a.invested * 100
    portfolio_snapshot_modifier.$set.last_synced = new Date()

    PortfolioSnapshots.update( portfolio_snapshot_q, portfolio_snapshot_modifier, {upsert: true} )
  },

  /**
   * Find all un-processed CoinmarketcapSnapshots
   * Generate/update aggregated MarketSnapshots based on the new data.
   */
  'process_market_snapshots'() {
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
        return new Date(Date.UTC(ts.year, ts.month, ts.day, ts.hour, ts.minute))
      },
      'hour'(ts) {
        return new Date(Date.UTC(ts.year, ts.month, ts.day, ts.hour))
      },
      'day'(ts) {
        return new Date(Date.UTC(ts.year, ts.month, ts.day))
      }
    }

    //  Get all un-processed CoinmarketcapSnapshots
    let cmc_snapshot_ids = CoinmarketcapSnapshots.find({
      processed: false
    }, {
      fields: {
        _id: 1
      }
    }).fetch()
    cmc_snapshot_ids = cmc_snapshot_ids.map(cmc => cmc._id)

    for( let [granularity, aggregation_filter] of Object.entries(ts_aggregate_filters) ) {
      let pipeline = [
        //  Get all unprocessed CoinmarketcapSnapshots
        {
          $match: {
            _id: {
              $in: cmc_snapshot_ids
            }
          },
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
      // console.log(JSON.stringify(market_snapshots, null, 2))

      //  Update MarketSnapshots based on this data
      _.each(market_snapshots, (m) => {
        m.granularity = granularity
        m.ts = ts_date_constructors[granularity](m._id.ts)
        let market_snapshot_q = {
          granularity,
          ts: m.ts
        }
        let market_snapshot_modifier = {
          $inc: {},
          $set: {
            processed: false
          }
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
  }
})
