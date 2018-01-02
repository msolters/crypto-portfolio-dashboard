AccountsTemplates.configure({
  onSubmitHook: (error, state) => {
    if (!error) {
      if (state === "signIn") {
        // Successfully logged in
      }
      if (state === "signUp") {
        // Successfully registered
        FlowRouter.go('/dashboard')
      }
    }
  },
  focusFirstInput: false
})
