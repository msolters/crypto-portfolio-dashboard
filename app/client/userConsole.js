Template.userConsole.onCreated( function() {
  const tmpl = this
  tmpl.subscribe("Funds")
  tmpl.subscribe("Holdings")
  tmpl.subscribe("SyncStatus")
})
