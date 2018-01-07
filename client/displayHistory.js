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
        },
        layout: "vertical",
        align: "right",
        verticalAlign: "middle"
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
        shared: true,
        pointFormat: '${point.y:.0f} of {series.name}<br>'
      },
      plotOptions: {
        series: {
          stacking: 'normal',
          marker: {
            enabled: false
          }
        }
      },
      series: [],
      responsive: {
        rules: [{
          condition: {
            maxWidth: 1280
          },
          chartOptions: {
            legend: {
              itemStyle: {
                fontSize: '20px'
              }
            },
            title: {
                style: {
                  fontSize: '40px'
                }
            },
            subtitle: {
                style: {
                  fontSize: '30px'
                }
            },
            xAxis: {
              title: {
                style: {
                  fontSize: '30px'
                }
              },
              labels: {
                style: {
                  fontSize: '25px'
                }
              }
            },
            yAxis: {
              title: {
                style: {
                  fontSize: '30px'
                }
              },
              labels: {
                style: {
                  fontSize: '25px'
                }
              }
            },
            tooltip: {
              fontSize: '30px',
            },
          }
        }]
      }
    });

    const rechart = (snapshots) => {
      let chart = $("#coin-performance-chart").highcharts()

      // Generate new series data
      let now = new Date()
      let tzOffset = now.getTimezoneOffset() * 60000
      let series_data = {}
      for( let s of snapshots.reverse() ) {
        if( !s.coins ) continue
        for( let [coin, c] of Object.entries(s.coins) ) {
          let new_point = [s.ts.valueOf()-tzOffset, (c.total/c.samples)]
          if( !series_data[c.symbol] ) {
            series_data[c.symbol] = [ new_point ]
          } else {
            series_data[c.symbol].push(new_point)
          }
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

      let chart_width
      switch( Session.get('granularity') ) {
        case 'minute':
          chart_width = 'hour'
          break
        case 'hour':
          chart_width = 'day'
          break
        case 'day':
          chart_width = 'month'
          break
      }
      chart.xAxis[0].setExtremes(
        moment().subtract(1, chart_width).toDate().valueOf()-tzOffset,
        moment().toDate().valueOf()-tzOffset
      )

      chart.redraw()
    }
    self.rechart = rechart

    self.autorun( () => {
      // Get snapshots
      let snapshots_q = {}
      let snapshots = PortfolioSnapshots.find(snapshots_q, {sort: {
        ts: -1
      }}).fetch()

      self.rechart( snapshots )
    })
  }, 100)
})
