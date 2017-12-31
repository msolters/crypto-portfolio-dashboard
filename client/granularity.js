Template.granularity.onCreated( function() {
  const tmpl = this
  tmpl.granularity = new ReactiveVar('minute')
  this.autorun( function() {
    tmpl.subscribe("PortfolioSnapshots", tmpl.granularity.get())
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
