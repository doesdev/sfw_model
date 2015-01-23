'use strict'

# Setup
exports = {}
fs = require('fs')
path = require('path')
modelRoot = __dirname
appPath = path.join(modelRoot, '../')
dbPath = path.join(appPath, 'db')
adapterPath = path.join(dbPath, 'adapter')
appConfigPath = path.join(appPath, 'config', 'app')
modelBaseConfigPath = path.join(modelRoot, 'config_model')
dbConfigPath = path.join(dbPath, 'config')
dbBaseConfigPath = path.join(modelRoot, 'config_db')
# Helpers
require('./sfw_std_extensions')
setEnv = (appEnv) -> exports.env = appEnv || env || 'dev'; return
getConfigModel = (path) -> return try require(path).SfwModel catch then return null
getConfigDB = (path) -> return try require(path) catch then return null
getAdapters = ->
  adapterFiles = -> return try fs.readdirSync(adapterPath).map (f) -> path.join(adapterPath, f)
  catch then (try fs.readdirSync(modelRoot).filter((f) -> f.match(/^adapter/)).map (f) -> path.join(modelRoot, f)
  catch then [])
  return adapterFiles().map((f) -> try return require(f) catch then return null).filter (a) -> a
# Environment and Configuration
env = process.argv[2] || 'dev'
env = envar for envar in ['dev', 'prod', 'test', 'stage'] when env.match("#{envar}")
exports.env ?= env
configModel = getConfigModel(appConfigPath) || getConfigModel(modelBaseConfigPath)
configDB = getConfigDB(dbConfigPath) || getConfigDB(dbBaseConfigPath)
SfwAdapters = getAdapters()
SfwEntity = require('./sfw_entity')
SfwEntityI = require('./sfw_entity_i')

# Exports
exports.Entity = SfwEntity
exports.EntityI = SfwEntityI
module.exports = exports
