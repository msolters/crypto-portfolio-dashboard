const update_invested = _.debounce( (tmpl) => {
  Meteor.call('update_funds', (tmpl.find('input[data-edit-invested]').value || 0))
}, 1000 )

Template.displayPerformance.events({
  'input input[data-edit-invested]'(event, tmpl) {
    update_invested(tmpl)
  }
})
