Template.home.onRendered( function() {
  AccountsTemplates.setState('signUp')
})

Template.home.events({
  'click button.dashboard-button'() {
    AccountsTemplates.setState('signIn')
  }
})
