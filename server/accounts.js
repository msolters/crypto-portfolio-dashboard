Accounts.onCreateUser( function(options, user) {
  if(!options || !user) {
    console.error('error creating user')
    return
  }

  Funds.insert({
    userId: user._id,
    invested: 0.0
  })

  return user;
})
