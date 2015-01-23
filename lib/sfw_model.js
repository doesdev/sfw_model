(function() {
  'use strict';
  var SfwAdapters, SfwEntity, SfwEntityI, adapterPath, appConfigPath, appPath, configDB, configModel, dbBaseConfigPath, dbConfigPath, dbPath, env, envar, exports, fs, getAdapters, getConfigDB, getConfigModel, modelBaseConfigPath, modelRoot, path, setEnv, _i, _len, _ref;

  exports = {};

  fs = require('fs');

  path = require('path');

  modelRoot = __dirname;

  appPath = path.join(modelRoot, '../');

  dbPath = path.join(appPath, 'db');

  adapterPath = path.join(dbPath, 'adapter');

  appConfigPath = path.join(appPath, 'config', 'app');

  modelBaseConfigPath = path.join(modelRoot, 'config_model');

  dbConfigPath = path.join(dbPath, 'config');

  dbBaseConfigPath = path.join(modelRoot, 'config_db');

  require('./sfw_std_extensions');

  setEnv = function(appEnv) {
    exports.env = appEnv || env || 'dev';
  };

  getConfigModel = function(path) {
    try {
      return require(path).SfwModel;
    } catch (_error) {
      return null;
    }
  };

  getConfigDB = function(path) {
    try {
      return require(path);
    } catch (_error) {
      return null;
    }
  };

  getAdapters = function() {
    var adapterFiles;
    adapterFiles = function() {
      try {
        return fs.readdirSync(adapterPath).map(function(f) {
          return path.join(adapterPath, f);
        });
      } catch (_error) {
        try {
          return fs.readdirSync(modelRoot).filter(function(f) {
            return f.match(/^adapter/);
          }).map(function(f) {
            return path.join(modelRoot, f);
          });
        } catch (_error) {
          return [];
        }
      }
    };
    return adapterFiles().map(function(f) {
      try {
        return require(f);
      } catch (_error) {
        return null;
      }
    }).filter(function(a) {
      return a;
    });
  };

  env = process.argv[2] || 'dev';

  _ref = ['dev', 'prod', 'test', 'stage'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    envar = _ref[_i];
    if (env.match("" + envar)) {
      env = envar;
    }
  }

  if (exports.env == null) {
    exports.env = env;
  }

  configModel = getConfigModel(appConfigPath) || getConfigModel(modelBaseConfigPath);

  configDB = getConfigDB(dbConfigPath) || getConfigDB(dbBaseConfigPath);

  SfwAdapters = getAdapters();

  SfwEntity = require('./sfw_entity');

  SfwEntityI = require('./sfw_entity_i');

  exports.Entity = SfwEntity;

  exports.EntityI = SfwEntityI;

  module.exports = exports;

}).call(this);
