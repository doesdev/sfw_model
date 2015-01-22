(function() {
  'use strict';

  /* ToDo: implement all of the below entity methods
    Entity Class methods:
      [✓] new (new record)
      [✓] create (create and save record with any supplied attributes)
      [✓] findOrCreateBy (find or create record by / with any supplied attributes)
      [✓] find (find by primary key)
      [✓] findFirst (find by primary key, return first result)
      [✓] findLast (find by primary key, return last result)
      [✓] findBy (find by supplied key / value hash)
      [✓] findByFirst (find by supplied key / value hash, return first result)
      [✓] findByLast (find by supplied key / value hash, return last result)
      [ ] where (SQL like query)
    Entity Instance methods:
      [✓] save (save record)
      [✓] update (update record with supplied key / value hash)
      [✓] attribute (returns specified record attribute)
      [✓] attributes (returns hash of filterable record attributes)
      [✓] toJSON (return JSON object of filterable record attributes)
      [✓] destroy (delete record)
  
    ToDo: [everywhere] harden logging, ensure it always passes error type and if applicable failed object
      i.e. if key failed validation that key should be specified
    ToDo: [everywhere] validate inputs for safeness and type matching
    ToDo: [class.create] allow creation of nested records as well
    ToDo: [class.create] protect attributes / nested attributes, allow for controller level permission
    ToDo: [instance.save && instance.update] protect attributes / nested attributes, allow for controller level permission
    ToDo: [instance.save && instance.update] allow saving nested attributes, if permitted
   */
  var Event, SfwEntity, SfwEntityInstance, sfwEntExt, sfwExt, sfwIExt,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  module.exports = {
    entity: function(model) {
      return new SfwEntity(model);
    },
    entityInstance: function(entity) {
      return new SfwEntityInstance(entity);
    }
  };

  sfwEntExt = require('./sfw_entity_ext');

  sfwExt = sfwEntExt.ext();

  sfwIExt = sfwEntExt.iExt();

  Event = require('events').EventEmitter;

  SfwEntity = (function() {
    function SfwEntity(model) {
      this.create = __bind(this.create, this);
      this["new"] = __bind(this["new"], this);
      this.findOrCreateBy = __bind(this.findOrCreateBy, this);
      this.findByLast = __bind(this.findByLast, this);
      this.findByFirst = __bind(this.findByFirst, this);
      this.findBy = __bind(this.findBy, this);
      this.findLast = __bind(this.findLast, this);
      this.findFirst = __bind(this.findFirst, this);
      this.find = __bind(this.find, this);
      this.isInstance = __bind(this.isInstance, this);
      this.relatedKeyNames = __bind(this.relatedKeyNames, this);
      this.hasKeys = __bind(this.hasKeys, this);
      this.registerChild = __bind(this.registerChild, this);
      this.belongsTo = __bind(this.belongsTo, this);
      if (!(typeof model === "string" && model.trim() !== '')) {
        return sfwExt.emitError({
          action: "new SfwEntity()",
          params: {
            model: model
          }
        }, 'model param (string) not provider');
      }
      this.model = model.toCamelCaseInitCap();
      this.parents = [];
      this.children = [];
      this.keys = [];
      this.keyNames = [];
    }

    SfwEntity.prototype.belongsTo = function(parent) {
      this.parents.push(parent);
      parent.registerChild(this);
      return true;
    };

    SfwEntity.prototype.registerChild = function(child) {
      this.children.push(child);
      return true;
    };

    SfwEntity.prototype.hasKeys = function(keys) {
      return sfwExt._hasKeys(this, keys);
    };

    SfwEntity.prototype.relatedKeyNames = function() {
      return this.keys.filter(function(key) {
        return key.relatedEntity;
      }).map(function(key) {
        return key.keyName;
      });
    };

    SfwEntity.prototype.isInstance = function(obj) {
      return obj instanceof SfwEntityInstance;
    };

    SfwEntity.prototype.find = function(val, cb, cbParams, aryMod) {
      var evt, _find;
      if (cb == null) {
        cb = null;
      }
      if (cbParams == null) {
        cbParams = null;
      }
      if (aryMod == null) {
        aryMod = null;
      }
      evt = new Event();
      _find = (function(_this) {
        return function() {
          return sfwExt._find(_this, evt, val, cb, cbParams, aryMod);
        };
      })(this);
      setTimeout(_find, 0);
      return evt;
    };

    SfwEntity.prototype.findFirst = function(val, cb, cbParams) {
      if (cb == null) {
        cb = null;
      }
      if (cbParams == null) {
        cbParams = null;
      }
      return this.find(val, cb, cbParams, 'first');
    };

    SfwEntity.prototype.findLast = function(val, cb, cbParams) {
      if (cb == null) {
        cb = null;
      }
      if (cbParams == null) {
        cbParams = null;
      }
      return this.find(val, cb, cbParams, 'last');
    };

    SfwEntity.prototype.findBy = function(hashOrKey, val, cb, cbParams, aryMod) {
      var evt, _findBy;
      if (val == null) {
        val = null;
      }
      if (cb == null) {
        cb = null;
      }
      if (cbParams == null) {
        cbParams = null;
      }
      if (aryMod == null) {
        aryMod = null;
      }
      evt = new Event();
      if (typeof val === 'function') {
        cbParams = cb;
        cb = val;
        val = null;
      }
      _findBy = (function(_this) {
        return function() {
          return sfwExt._findBy(_this, evt, hashOrKey, val, cb, cbParams, aryMod);
        };
      })(this);
      setTimeout(_findBy, 0);
      return evt;
    };

    SfwEntity.prototype.findByFirst = function(hashOrKey, val, cb, cbParams) {
      if (val == null) {
        val = null;
      }
      if (cb == null) {
        cb = null;
      }
      if (cbParams == null) {
        cbParams = null;
      }
      if (typeof val === 'function') {
        cbParams = cb;
        cb = val;
        val = null;
      }
      return this.findBy(hashOrKey, val, cb, cbParams, 'first');
    };

    SfwEntity.prototype.findByLast = function(hashOrKey, val, cb, cbParams) {
      if (val == null) {
        val = null;
      }
      if (cb == null) {
        cb = null;
      }
      if (cbParams == null) {
        cbParams = null;
      }
      if (typeof val === 'function') {
        cbParams = cb;
        cb = val;
        val = null;
      }
      return this.findBy(hashOrKey, val, cb, cbParams, 'last');
    };

    SfwEntity.prototype.findOrCreateBy = function(hashOrKey, val, cb, cbParams) {
      var evt, _findOrCreateBy;
      if (val == null) {
        val = null;
      }
      if (cb == null) {
        cb = null;
      }
      if (cbParams == null) {
        cbParams = null;
      }
      evt = new Event();
      if (typeof val === 'function') {
        cbParams = cb;
        cb = val;
        val = null;
      }
      _findOrCreateBy = (function(_this) {
        return function() {
          return sfwExt._findOrCreateBy(_this, evt, hashOrKey, val, cb, cbParams);
        };
      })(this);
      setTimeout(_findOrCreateBy, 0);
      return evt;
    };

    SfwEntity.prototype["new"] = function() {
      return new SfwEntityInstance(this);
    };

    SfwEntity.prototype.create = function(keyOrHash, val, cb, cbParams) {
      var evt, _create;
      if (val == null) {
        val = null;
      }
      if (cb == null) {
        cb = null;
      }
      if (cbParams == null) {
        cbParams = null;
      }
      evt = new Event();
      if (typeof val === 'function') {
        cbParams = cb;
        cb = val;
        val = null;
      }
      _create = (function(_this) {
        return function() {
          return sfwExt._create(_this, evt, keyOrHash, val, cb, cbParams);
        };
      })(this);
      setTimeout(_create, 0);
      return evt;
    };

    return SfwEntity;

  })();

  SfwEntityInstance = (function() {
    function SfwEntityInstance(entity) {
      this.entity = entity;
      this.destroy = __bind(this.destroy, this);
      this.toJSON = __bind(this.toJSON, this);
      this.attributes = __bind(this.attributes, this);
      this.attribute = __bind(this.attribute, this);
      this.update = __bind(this.update, this);
      this.save = __bind(this.save, this);
      this.model = this.entity.model;
    }

    SfwEntityInstance.prototype.save = function(cb, cbParams) {
      var evt, val, _create, _update;
      if (cb == null) {
        cb = null;
      }
      if (cbParams == null) {
        cbParams = null;
      }
      evt = new Event();
      if (typeof val === 'function') {
        cbParams = cb;
        cb = val;
        val = null;
      }
      _create = (function(_this) {
        return function() {
          return sfwExt._create(_this.entity, evt, _this.attributes(null, true), val, cb, cbParams, _this);
        };
      })(this);
      _update = (function(_this) {
        return function() {
          return sfwIExt._update(_this, evt, _this.attributes(null, true), val, cb, cbParams);
        };
      })(this);
      if (this.id) {
        setTimeout(_update, 0);
      } else {
        setTimeout(_create, 0);
      }
      return evt;
    };

    SfwEntityInstance.prototype.update = function(hashOrKey, val, cb, cbParams) {
      var evt, _update;
      if (val == null) {
        val = null;
      }
      if (cb == null) {
        cb = null;
      }
      if (cbParams == null) {
        cbParams = null;
      }
      evt = new Event();
      if (typeof val === 'function') {
        cbParams = cb;
        cb = val;
        val = null;
      }
      _update = (function(_this) {
        return function() {
          return sfwIExt._update(_this, evt, hashOrKey, val, cb, cbParams);
        };
      })(this);
      setTimeout(_update, 0);
      return evt;
    };

    SfwEntityInstance.prototype.attribute = function(key) {
      if (key == null) {
        key = null;
      }
      if (typeof key !== 'string') {
        return sfwExt.emitError({
          action: "" + this.model + ".attribute()",
          params: {
            key: key
          }
        }, 'key must be a string');
      }
      return this.attributes(key);
    };

    SfwEntityInstance.prototype.attributes = function(keys, noId) {
      var attrs, key, _i, _len, _ref, _ref1, _ref2;
      if (keys == null) {
        keys = null;
      }
      if (noId == null) {
        noId = null;
      }
      attrs = {};
      _ref = this.entity.keys;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        if (!(!keys || key.keyName === keys || (_ref1 = key.keyName, __indexOf.call(keys, _ref1) >= 0))) {
          continue;
        }
        if ((_ref2 = key.keyName, __indexOf.call(this.entity.relatedKeyNames(), _ref2) >= 0) && this.entity.isInstance(this[key.keyName])) {
          attrs[key.keyName] = this[key.keyName].attributes(null, noId);
        } else {
          attrs[key.keyName] = this[key.keyName];
        }
        if (!(keys || noId)) {
          attrs.id = this.id;
        }
      }
      if (typeof keys === 'string') {
        return attrs[keys];
      } else {
        return attrs;
      }
    };

    SfwEntityInstance.prototype.toJSON = function(keys, noId) {
      if (keys == null) {
        keys = null;
      }
      if (noId == null) {
        noId = null;
      }
      return JSON.stringify(this.attributes(keys, noId));
    };

    SfwEntityInstance.prototype.destroy = function(cb, cbParams) {
      var evt, _destroy;
      if (cb == null) {
        cb = null;
      }
      if (cbParams == null) {
        cbParams = null;
      }
      evt = new Event();
      _destroy = (function(_this) {
        return function() {
          return sfwIExt._destroy(_this).on('error', function(dErr) {
            return evt.emit('error', dErr);
          }).on('success', function() {
            var k, v;
            for (k in _this) {
              v = _this[k];
              _this[k] = null;
              delete _this[k];
            }
            evt.emit('success', true);
            if (cb) {
              return cb(null, true, cbParams);
            }
          });
        };
      })(this);
      setTimeout(_destroy, 0);
      return evt;
    };

    return SfwEntityInstance;

  })();

}).call(this);
