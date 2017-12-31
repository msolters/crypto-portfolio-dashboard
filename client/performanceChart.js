Template.performanceChart.onCreated( function() {
  //this.subscribe('LastDay')
})

Template.performanceChart.onRendered( function() {
  const self = this;
  Meteor.setTimeout( function() {
    $('#performance-chart').highcharts({
      chart: {
          type: 'spline',
          backgroundColor: null,
          style: {
            color: "#ffffff"
          }
      },
      legend: {
        enabled: false
      },
      title: {
          text: null,
          style: {
            color: '#fff'
          }
      },
      xAxis: {
        type: 'datetime',
        crosshair: true,
        title: {
          text: null,
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
          text: null,
          style: {
            color: '#fff'
          }
        },
        labels: {
          formatter: function () {
            return this.value.toFixed(2) + '%';
          },
          style: {
            color: '#fff'
          }
        }
      },
      tooltip: {
        pointFormat: '{point.y:.2f}%<br>'
      },
      plotOptions: {
        series: {
          marker: {
            enabled: false
          }
        },
        line: {
          fillColor: '#228B22',
          lineColor: '#228B22'
        }
      },
      series: []
    });

    self.autorun( () => {
      let chart = $("#performance-chart").highcharts()

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
        let new_point = [s.ts.valueOf()-tzOffset, s.performance]
        if( series_data['performance'] ) {
          series_data['performance'].push( new_point )
        } else {
          series_data['performance'] = [ new_point ]
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
