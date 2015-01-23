'use strict'

# Setup
SfwDB = {env:{dev:{},test:{},stage:{},prod:{}}}

# What adapter will we be using at the app level?
SfwDB.adapter = 'NeDB'

# Development environment
SfwDB.env.dev =
  # What is the path or db:uri of the database? If file path keep in mind it is relative to app root.
  path: 'db/dev.db'
  # User and pass we'll use to connect to db
  user: null
  pass: null
  # You can also add any other params required by the adapter here, these are just the basics.

SfwDB.env.test.path = 'test/test.db'
SfwDB.env.prod.path = 'db/prod.db'

# Exports
module.exports = SfwDB
