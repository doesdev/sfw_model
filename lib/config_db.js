(function() {
  'use strict';
  var SfwDB;

  SfwDB = {
    env: {
      dev: {},
      test: {},
      stage: {},
      prod: {}
    }
  };

  SfwDB.adapter = 'NeDB';

  SfwDB.env.dev = {
    path: 'db/dev.db',
    user: null,
    pass: null
  };

  SfwDB.env.test.path = 'test/test.db';

  SfwDB.env.prod.path = 'db/prod.db';

  module.exports = SfwDB;

}).call(this);
