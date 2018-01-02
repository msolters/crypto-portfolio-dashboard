FlowRouter.route('/', {
  name: 'Lists.show',
  action(params, queryParams) {
    BlazeLayout.render('body', {main: 'home'})
  }
})

FlowRouter.route('/dashboard', {
  name: 'Dashboard',
  action(params, queryParams) {
    BlazeLayout.render('body', {main: 'dashboard'})
  }
})
