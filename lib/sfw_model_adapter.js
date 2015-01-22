(function() {
  'use strict';
  var Datastore, exports;

  exports = {};

  Datastore = require('nedb');

  exports.NeDB = new Datastore({
    filename: '../db/mcgauge.db',
    autoload: true
  });

  module.exports = exports;

}).call(this);
