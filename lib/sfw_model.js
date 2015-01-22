(function() {
  'use strict';
  var SfwEntityCore, exports;

  exports = {};

  require('./sfw_std_extensions');

  SfwEntityCore = require('./sfw_entity');

  exports.entity = function(model) {
    return SfwEntityCore.entity(model);
  };

  module.exports = exports;

}).call(this);
