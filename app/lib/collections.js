Funds = new Meteor.Collection('Funds')
Holdings = new Meteor.Collection('Holdings')

//  Raw API output from Coinmarketcap
CoinmarketcapSnapshots = new Mongo.Collection('CoinmarketcapSnapshots')
//  API data aggregated by minute, hour, day
MarketSnapshots = new Mongo.Collection('MarketSnapshots')
//  A representation of user portfolio at a given point in time
AllocationSnapshots = new Meteor.Collection('AllocationSnapshots')
//  MarketSnapshots + AllocationSnapshots -> PortfolioSnapshots
//  This is what the dashboard template subscribes to
PortfolioSnapshots = new Meteor.Collection('PortfolioSnapshots')
//  Used to store information about the last sync state
SyncStatus = new Meteor.Collection('SyncStatus')
