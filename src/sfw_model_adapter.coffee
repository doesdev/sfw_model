'use strict'

# Setup
exports = {}
Datastore = require('nedb')
exports.NeDB = new Datastore({ filename: '../db/mcgauge.db', autoload: true })

# Exports
module.exports = exports
