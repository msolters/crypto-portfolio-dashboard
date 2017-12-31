Template.displayAllocation.onRendered( function() {
  const self = this
    Meteor.setTimeout( function() {
    $('#coin-allocation-chart').highcharts({
      chart: {
          type: 'pie',
          backgroundColor: null,
          style: {
            color: "#ffffff"
          }
      },
      legend: {
        itemStyle: {
          color: '#fff'
        }
      },
      title: {
          text: null,
          style: {
            color: '#fff'
          }
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
              enabled: true,
              format: '<b>{point.name}</b>: {point.percentage:.1f} %',
              style: {
                  color: "#fff"
              }
          }
        }
      },
      series: [{
        name: 'USD'
      }]
    });

    self.autorun( () => {
      let portfolio = PortfolioSnapshots.findOne({}, {
        $sort: {
          ts: -1
        }
      })
      if( !portfolio ) return

      let chart = $("#coin-allocation-chart").highcharts()
      let serie_data = []
      for( let [coin, coin_data] of Object.entries(portfolio.coins) ) {
        serie_data.push({
          name: coin_data.symbol,
          y: coin_data.coin_value
        })
      }

      serie_data = _.sortBy(serie_data, s => s.name)

      chart.series[0].setData(serie_data)
      chart.redraw()
    })
  }, 100)
})
