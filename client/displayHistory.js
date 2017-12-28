Template.displayHistory.onCreated( function() {
  this.subscribe('LastDay')
})

Template.displayHistory.onRendered( function() {
  const self = this;
  Meteor.setTimeout( function() {
    $('#coin-performance-chart').highcharts({
      chart: {
          type: 'areaspline',
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
          text: 'Portfolio Performance',
          style: {
            color: '#fff'
          }
      },
      subtitle: {
          text: 'Last 24 Hours',
          style: {
            color: '#fff'
          }
      },
      xAxis: {
        type: 'datetime',
        title: {
          text: 'Time',
          style: {
            color: '#fff'
          }
        },
        labels: {
          style: {
            color: "#fff"
          }
        }
      },
      yAxis: {
        title: {
          text: 'USD',
          style: {
            color: '#fff'
          }
        },
        labels: {
          formatter: function () {
            return '$' + this.value.toFixed(2);
          },
          style: {
            color: '#fff'
          }
        }
      },
      tooltip: {
          pointFormat: '${point.y:,.0f} of {series.name}'
      },
      plotOptions: {
        series: {
          stacking: 'normal',
        },
      },
      series: []
    });

    self.autorun( () => {
      let chart = $("#coin-performance-chart").highcharts()

      // Get snapshots
      let snapshots_q = {}
      let snapshots = PortfolioSnapshots.find(snapshots_q, {sort: {
        ts: -1
      }, limit: 96}).fetch()

      // Generate new series data
      let now = new Date()
      let tzOffset = now.getTimezoneOffset() * 60000
      let series_data = {}
      for( let s of snapshots.reverse() ) {
        for( let [coin, c] of Object.entries(s.coins) ) {
          let new_point = [s.ts.valueOf()-tzOffset, c.value]
          if( !series_data[coin] ) {
            series_data[coin] = [ new_point ]
          } else {
            series_data[coin].push(new_point)
          }
        }
      }

      for( let [serie, data] of Object.entries(series_data) ) {
        let series_exist = _.find(chart.series, (s) => {
          return (s.name === serie)
        })
        if( series_exist ) {
          series_exist.setData(data)
        } else {
          chart.addSeries({
            name: serie,
            data: data
          })
        }
      }

      chart.redraw()
    })
  }, 100)
})
