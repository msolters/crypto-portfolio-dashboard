Template.granularity.onCreated( function() {
  const tmpl = this
  tmpl.granularity = new ReactiveVar('minute')
  tmpl.timer = new ReactiveVar(new Date())
  setInterval( () => {
    tmpl.timer.set(new Date())
  }, 1000)
  tmpl.autorun( function() {
    tmpl.subscribe("PortfolioSnapshots", tmpl.granularity.get(), tmpl.timer.get())
  })
  tmpl.autorun( function() {
    tmpl.subscribe("LastMarketSnapshot", tmpl.granularity.get())
  })
})

Template.granularity.events({
  'click button[data-set-granularity-minute]'() {
    Template.instance().granularity.set('minute')
  },
  'click button[data-set-granularity-hour]'() {
    Template.instance().granularity.set('hour')
  },
  'click button[data-set-granularity-day]'() {
    Template.instance().granularity.set('day')
  },
})

Template.granularity.helpers({
  'granularityIs'(_granularity) {
    return Template.instance().granularity.get() === _granularity
  }
})
