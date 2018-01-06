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

    const rechart = (snapshots) => {
      let chart = $("#performance-chart").highcharts()

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

      // Delete series that no longer exist
      _.each( _.map(chart.series, s => s.name), serie => {
        let series_exists = _.find(Object.keys(series_data), (s) => {
          return (s === serie)
        })
        if( !series_exists ) {
          chart.get(serie).remove()
        }
      })

      for( let [serie, data] of Object.entries(series_data) ) {
        let series_exist = _.find(chart.series, (s) => {
          return (s.name === serie)
        })
        if( series_exist ) {
          series_exist.setData(data)
        } else {
          chart.addSeries({
            name: serie,
            data: data,
            id: serie
          })
        }
      }

      chart.redraw()
    }
    self.rechart = _.debounce(rechart, 750)

    self.autorun( () => {
      // Get snapshots
      let snapshots_q = {}
      let snapshots = PortfolioSnapshots.find(snapshots_q, {
        sort: {
          ts: -1
        }
      }).fetch()

      self.rechart( snapshots )
    })
  }, 100)
})
