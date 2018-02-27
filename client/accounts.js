AccountsTemplates.configure({
  onSubmitHook: (error, state) => {
    if (!error) {
      if (state === "signIn") {
        // Successfully logged in
        FlowRouter.go('/dashboard')
      }
      if (state === "signUp") {
        // Successfully registered
        FlowRouter.go('/dashboard')
      }
    }
  },
  focusFirstInput: false
})
