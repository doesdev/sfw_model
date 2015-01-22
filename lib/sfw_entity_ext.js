(function() {
  'use strict';
  var Event, NeDB, SfwEntity, SfwEntityExt, SfwEntityIExt, adapter, sfwExt,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  module.exports = {
    ext: function() {
      return new SfwEntityExt();
    },
    iExt: function() {
      return new SfwEntityIExt();
    }
  };

  adapter = require('./sfw_model_adapter');

  NeDB = adapter.NeDB;

  SfwEntity = require('./sfw_entity');

  Event = require('events').EventEmitter;

  SfwEntityExt = (function() {
    function SfwEntityExt() {
      this.emitResults = __bind(this.emitResults, this);
      this.emitError = __bind(this.emitError, this);
      this.nestRelatedInstances = __bind(this.nestRelatedInstances, this);
      this.validateData = __bind(this.validateData, this);
      this.validateKeyRelation = __bind(this.validateKeyRelation, this);
      this.validateKeyUniqueness = __bind(this.validateKeyUniqueness, this);
      this.validateUri = __bind(this.validateUri, this);
      this.validateEmail = __bind(this.validateEmail, this);
      this.validateKeyIsDefined = __bind(this.validateKeyIsDefined, this);
      this.getEntityByParentOrChild = __bind(this.getEntityByParentOrChild, this);
      this.getEntityByModel = __bind(this.getEntityByModel, this);
      this.relatedKeyNotEmpty = __bind(this.relatedKeyNotEmpty, this);
      this.isNeId = __bind(this.isNeId, this);
      this.isArray = __bind(this.isArray, this);
      this.isObject = __bind(this.isObject, this);
      this.now = __bind(this.now, this);
      this._create = __bind(this._create, this);
      this._findOrCreateBy = __bind(this._findOrCreateBy, this);
      this._findBy = __bind(this._findBy, this);
      this._find = __bind(this._find, this);
      this._hasKeys = __bind(this._hasKeys, this);
    }

    SfwEntityExt.prototype._hasKeys = function(entity, keys) {
      var key, keyError, mapDistantRelation, relatedModel, relationType, relationship, type, _i, _len;
      keyError = (function(_this) {
        return function(key, msg) {
          return _this.emitError({
            action: "" + entity.model + ".hasKeys()",
            params: {
              key: key
            }
          }, msg);
        };
      })(this);
      mapDistantRelation = (function(_this) {
        return function(key, type) {
          var familyTree, lastRelation, model, _i, _len;
          familyTree = type.slice(2).reverse();
          for (_i = 0, _len = familyTree.length; _i < _len; _i++) {
            model = familyTree[_i];
            if (!lastRelation) {
              lastRelation = _this.getEntityByParentOrChild(entity.parents, entity.children, model);
            } else {
              lastRelation = _this.getEntityByParentOrChild(lastRelation.parents, lastRelation.children, model);
            }
            if (!lastRelation) {
              return keyError(key, 'failed mapping distant relation');
            }
          }
          return lastRelation || null;
        };
      })(this);
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        if (key.keyType == null) {
          key.keyType = 'string';
        }
        type = key.keyType.split(':');
        if (type[0] === 'entity') {
          if (type[1]) {
            relationType = type[1];
          } else {
            return keyError(key, 'no relation set for entity');
          }
          if (type[2]) {
            relatedModel = type[2];
          } else {
            return keyError(key, 'no model set for entity');
          }
          relatedModel = type[2];
          switch (relationType) {
            case 'parent':
              relationship = entity.parents.filter(this.getEntityByModel(relatedModel))[0] || null;
              break;
            case 'child':
              relationship = entity.children.filter(this.getEntityByModel(relatedModel))[0] || null;
              break;
            case 'distant':
              relationship = mapDistantRelation(key, type);
          }
          if (!relationship) {
            return keyError(key, 'error establishing relationship for key');
          }
          key.relatedEntity = relationship;
        }
        if (key.primaryKey) {
          if (entity.primaryKey == null) {
            entity.primaryKey = key;
          }
        }
        entity.keys.push(key);
        entity.keyNames.push(key.keyName);
      }
      return true;
    };

    SfwEntityExt.prototype._find = function(entity, evt, val, cb, cbParams, aryMod) {
      var query;
      if (!evt._events.error) {
        evt.on('error', function(e) {
          return console.error(e);
        });
      }
      query = {};
      if (!(entity.primaryKey && entity.primaryKey.keyName)) {
        return this.emitError({
          action: "" + entity.model + ".find()",
          params: {
            val: val
          }
        }, 'model has no primary key', evt, cb);
      }
      query[entity.primaryKey.keyName] = val;
      query.model = entity.model;
      NeDB.find(query, (function(_this) {
        return function(err, results) {
          return _this.emitResults(err, results, entity, "" + entity.model + ".find()", {
            val: val
          }, aryMod, evt, cb, cbParams);
        };
      })(this));
      return true;
    };

    SfwEntityExt.prototype._findBy = function(entity, evt, hashOrKey, val, cb, cbParams, aryMod) {
      var query;
      if (!evt._events.error) {
        evt.on('error', function(e) {
          return console.error(e);
        });
      }
      if (this.isObject(hashOrKey)) {
        query = hashOrKey;
      } else if (val) {
        query = {};
        query[hashOrKey] = val;
      } else {
        return this.emitError({
          action: "" + entity.model + ".findBy()",
          params: {
            objectOrKey: hashOrKey,
            val: val
          }
        }, 'params should be (object) or (key, val)', evt, cb);
      }
      query.model = entity.model;
      NeDB.find(query, (function(_this) {
        return function(err, results) {
          return _this.emitResults(err, results, entity, "" + entity.model + ".findBy()", query, aryMod, evt, cb, cbParams);
        };
      })(this));
      return true;
    };

    SfwEntityExt.prototype._findOrCreateBy = function(entity, evt, hashOrKey, val, cb, cbParams) {
      if (val == null) {
        val = null;
      }
      if (cb == null) {
        cb = null;
      }
      if (cbParams == null) {
        cbParams = null;
      }
      if (!evt._events.error) {
        evt.on('error', function(e) {
          return console.error(e);
        });
      }
      entity.findBy(hashOrKey, val, null, null, 'first').on('error', function(findByErr) {
        evt.emit('error', findByErr);
        if (cb) {
          cb(findByErr, null, cbParams);
        }
      }).on('data', function(findByResults) {
        if (findByResults) {
          evt.emit('data', findByResults);
          if (cb) {
            cb(null, findByResults, cbParams);
          }
          return;
        }
        return entity.create(hashOrKey, val, null, null).on('error', function(createErr) {
          evt.emit('error', createErr);
          if (cb) {
            cb(createErr, null, cbParams);
          }
        }).on('data', function(createResults) {
          evt.emit('data', createResults);
          if (cb) {
            return cb(null, createResults, cbParams);
          }
        });
      });
      return true;
    };

    SfwEntityExt.prototype._create = function(entity, evt, hashOrKey, val, cb, cbParams, instance) {
      var doCreate, query;
      if (instance == null) {
        instance = null;
      }
      if (!evt._events.error) {
        evt.on('error', function(e) {
          return console.error(e);
        });
      }
      if (this.isObject(hashOrKey)) {
        query = hashOrKey;
      } else if (val) {
        query = {};
        query[hashOrKey] = val;
      } else {
        return this.emitError({
          action: "" + entity.model + ".create()",
          params: {
            objectOrKey: hashOrKey,
            val: val
          }
        }, 'params should be (object) or (key, val)', evt, cb);
      }
      doCreate = (function(_this) {
        return function(validKeys) {
          var rel, relEnt, related, relatedEntities, _i, _len;
          validKeys.model = entity.model;
          related = [];
          relatedEntities = entity.keys.filter(function(key) {
            return key.relatedEntity;
          });
          for (_i = 0, _len = relatedEntities.length; _i < _len; _i++) {
            relEnt = relatedEntities[_i];
            rel = {};
            rel[relEnt.keyName] = validKeys[relEnt.keyName];
            related.push(rel);
            validKeys[relEnt.keyName] = validKeys[relEnt.keyName]._id;
          }
          return NeDB.insert(validKeys, function(insertErr, insertResults) {
            return _this.emitResults(insertErr, insertResults, entity, "" + entity.model + ".create()", {
              object: query
            }, 'first', evt, cb, cbParams, instance, related);
          });
        };
      })(this);
      this.validateData(entity, query, true).on('error', (function(_this) {
        return function(vkError) {
          return _this.emitError({
            action: "" + entity.model + ".create()",
            params: {
              objectOrKey: hashOrKey,
              val: val
            }
          }, vkError, evt, cb);
        };
      })(this)).on('data', doCreate);
      return true;
    };

    SfwEntityExt.prototype.now = function() {
      var d;
      return "" + ((d = new Date()).toLocaleDateString()) + " " + (d.toLocaleTimeString());
    };

    SfwEntityExt.prototype.isObject = function(o) {
      return Object.prototype.toString.call(o) === '[object Object]';
    };

    SfwEntityExt.prototype.isArray = function(o) {
      return o instanceof Array;
    };

    SfwEntityExt.prototype.isNeId = function(val) {
      return val.length === 16 && !val.match(/\s/);
    };

    SfwEntityExt.prototype.relatedKeyNotEmpty = function(val) {
      return val && this.isNeId(val);
    };

    SfwEntityExt.prototype.getEntityByModel = function(model) {
      return function(entity) {
        return entity.model === model.toCamelCaseInitCap();
      };
    };

    SfwEntityExt.prototype.getEntityByParentOrChild = function(parents, children, model) {
      return parents.filter(this.getEntityByModel(model))[0] || children.filter(this.getEntityByModel(model))[0] || null;
    };

    SfwEntityExt.prototype.validateKeyIsDefined = function(keyName) {
      return function(key) {
        return key.keyName === keyName;
      };
    };

    SfwEntityExt.prototype.validateEmail = function(mKey, v) {
      return mKey.keyType !== 'email' || mKey.skipValidation || v.match(/.*@.*\..*/);
    };

    SfwEntityExt.prototype.validateUri = function(mKey, v) {
      return mKey.keyType !== 'url' || mKey.skipValidation || v.match(/.*\..*/);
    };

    SfwEntityExt.prototype.validateKeyUniqueness = function(results, params) {
      if (!results || results.isZeroLength() || (results.first()._id === params.id && results.length === 1)) {
        params.uniqAry.removeElementByValue(params.keyName);
        params.cb();
      } else {
        params.errCb("value must be unique for key => " + params.keyName);
      }
    };

    SfwEntityExt.prototype.validateKeyRelation = function(results, params) {
      if (results && results.length > 0) {
        params.validKeys[params.keyName] = results.first();
        params.relAry.removeElementByValue(params.keyName);
        params.cb();
      } else {
        params.errCb("relation could not be established for key => " + params.keyName);
      }
    };

    SfwEntityExt.prototype.validateData = function(entity, passedObj, validateRequired) {
      var emitWhenReady, evt, handleKeyError, includedKeys, k, modelKeys, mustBeUnique, processAllKeys, processKeys, processed, related, required, v, validKeys;
      if (validateRequired == null) {
        validateRequired = null;
      }
      evt = new Event();
      validKeys = {};
      includedKeys = [];
      processed = 0;
      modelKeys = entity.keys;
      for (k in passedObj) {
        v = passedObj[k];
        includedKeys.push(k);
      }
      required = modelKeys.filter(function(key) {
        return key.requireKey;
      }).map(function(key) {
        return key.keyName;
      });
      mustBeUnique = modelKeys.filter(function(key) {
        var _ref;
        if (_ref = key.keyName, __indexOf.call(includedKeys, _ref) >= 0) {
          return key.uniqueKey;
        }
      }).map(function(key) {
        return key.keyName;
      });
      related = modelKeys.filter(function(key) {
        var _ref;
        if (_ref = key.keyName, __indexOf.call(includedKeys, _ref) >= 0) {
          return key.relatedEntity;
        }
      }).map(function(key) {
        return key.keyName;
      });
      handleKeyError = function(msg) {
        evt.emit('error', msg);
      };
      emitWhenReady = function() {
        if (processed === includedKeys.length) {
          if (validateRequired && required.length > 0) {
            handleKeyError('required keys not included');
          }
          if (mustBeUnique.isZeroLength() && related.isZeroLength()) {
            return evt.emit('data', validKeys);
          }
        }
      };
      processKeys = (function(_this) {
        return function(k, v) {
          var modelKey, vkrParams, vkuParams;
          modelKey = (modelKeys.filter(_this.validateKeyIsDefined(k))[0]);
          if (modelKey) {
            validKeys[k] = v;
            required.removeElementByValue(k);
            if (!_this.validateEmail(modelKey, v)) {
              return handleKeyError('key type is email, but not in email format');
            }
            if (!_this.validateUri(modelKey, v)) {
              return handleKeyError('key type is url, but not in url format');
            }
            if (modelKey.uniqueKey) {
              vkuParams = {
                keyName: modelKey.keyName,
                id: passedObj.id,
                uniqAry: mustBeUnique,
                cb: emitWhenReady,
                errCb: handleKeyError
              };
              entity.findBy(modelKey.keyName, v, null, vkuParams).on('error', handleKeyError).on('data', _this.validateKeyUniqueness);
            }
            if (modelKey.relatedEntity) {
              if (_this.isNeId(v)) {
                vkrParams = {
                  validKeys: validKeys,
                  keyName: modelKey.keyName,
                  relAry: related,
                  cb: emitWhenReady,
                  errCb: handleKeyError
                };
                modelKey.relatedEntity.findBy('_id', v, null, vkrParams).on('error', handleKeyError).on('data', _this.validateKeyRelation);
              } else if (modelKey.relatedEntity.model === v.model) {
                related.removeElementByValue(modelKey.keyName);
                emitWhenReady();
              } else {
                return handleKeyError('relation could not be resolved');
              }
            }
          }
          processed += 1;
        };
      })(this);
      processAllKeys = function() {
        var _results;
        _results = [];
        for (k in passedObj) {
          v = passedObj[k];
          _results.push(processKeys(k, v));
        }
        return _results;
      };
      setTimeout(processAllKeys, 0);
      setTimeout(emitWhenReady, 0);
      return evt;
    };

    SfwEntityExt.prototype.nestRelatedInstances = function(instance, related) {
      var emitWhenReady, evt, getRelated, processRelations, relatedEntities, relatedKeys;
      if (related == null) {
        related = null;
      }
      evt = new Event();
      relatedEntities = instance.entity.keys.filter(function(key) {
        return key.relatedEntity;
      });
      relatedKeys = relatedEntities.map(function(key) {
        return key.keyName;
      });
      emitWhenReady = function() {
        if (relatedKeys.every(function(key) {
          return !instance[key] || instance.entity.isInstance(instance[key]);
        })) {
          evt.emit('success');
          return true;
        }
      };
      getRelated = function(relEnt, id, keyName) {
        return relEnt.findByFirst('_id', id).on('error', function(err) {
          return evt.emit('error', err);
        }).on('data', function(data) {
          instance[keyName] = data;
          return emitWhenReady();
        });
      };
      processRelations = (function(_this) {
        return function() {
          var keyName, rel, val, _i, _len;
          for (_i = 0, _len = relatedEntities.length; _i < _len; _i++) {
            rel = relatedEntities[_i];
            keyName = rel.keyName;
            val = instance[keyName];
            if (!_this.relatedKeyNotEmpty(val)) {
              return;
            }
            if (related && related[keyName]) {
              instance[keyName] = related[keyName];
              emitWhenReady();
            } else {
              getRelated(rel.relatedEntity, val, keyName);
            }
          }
        };
      })(this);
      setTimeout(processRelations, 0);
      return evt;
    };

    SfwEntityExt.prototype.emitError = function(env, msg, evt, cb) {
      var error;
      if (evt == null) {
        evt = null;
      }
      if (cb == null) {
        cb = null;
      }
      error = {
        error: {
          time: this.now(),
          action: env.action,
          params: env.params,
          msg: msg
        }
      };
      if (evt) {
        evt.emit('error', error);
      }
      if (cb) {
        cb(error, null);
      }
      return error;
    };

    SfwEntityExt.prototype.emitResults = function(err, results, entity, caller, params, aryMod, evt, cb, cbParams, instance, related) {
      var buildInstance, emitWhenReady, isAry, pushResultEmitIfReady, result, resultsOut, _i, _len;
      if (evt == null) {
        evt = null;
      }
      if (cb == null) {
        cb = null;
      }
      if (cbParams == null) {
        cbParams = null;
      }
      if (instance == null) {
        instance = null;
      }
      if (related == null) {
        related = null;
      }
      if (err) {
        return this.emitError({
          action: caller,
          params: params
        }, err, evt, cb);
      }
      resultsOut = [];
      emitWhenReady = function() {
        if (aryMod && (aryMod === 'first' || aryMod === 'last')) {
          resultsOut = resultsOut[aryMod]();
        }
        if (evt) {
          evt.emit('data', resultsOut, cbParams);
          evt.emit('success', true);
        }
        if (cb) {
          return cb(null, resultsOut, cbParams);
        }
      };
      if (!results || ((isAry = results instanceof Array) && results.isZeroLength())) {
        emitWhenReady();
      } else {
        buildInstance = (function(_this) {
          return function(result) {
            var bIEvt, k, processInstance, v;
            bIEvt = new Event();
            if (instance == null) {
              instance = new SfwEntity.entityInstance(entity);
            }
            for (k in result) {
              v = result[k];
              instance[k] = v;
            }
            instance.id = instance._id;
            related = entity.keys.filter(function(key) {
              if (_this.relatedKeyNotEmpty(instance[key.keyName])) {
                return key.relatedEntity;
              }
            });
            processInstance = function() {
              if (related.isZeroLength()) {
                return bIEvt.emit('data', instance);
              } else {
                return _this.nestRelatedInstances(instance, related).on('error', function(nestErr) {
                  _this.emitError({
                    action: caller,
                    params: params
                  }, nestErr, evt, cb);
                }).on('success', function() {
                  return bIEvt.emit('data', instance);
                });
              }
            };
            setTimeout(processInstance, 0);
            return bIEvt;
          };
        })(this);
        pushResultEmitIfReady = function(bInst) {
          resultsOut.push(bInst);
          if (!isAry || resultsOut.length === results.length) {
            return emitWhenReady();
          }
        };
        if (!isAry) {
          results = [results];
        }
        for (_i = 0, _len = results.length; _i < _len; _i++) {
          result = results[_i];
          buildInstance(result).on('data', pushResultEmitIfReady);
        }
      }
      return resultsOut;
    };

    return SfwEntityExt;

  })();

  sfwExt = new SfwEntityExt();

  SfwEntityIExt = (function() {
    function SfwEntityIExt() {
      this._destroy = __bind(this._destroy, this);
      this._update = __bind(this._update, this);
      this.updateInstance = __bind(this.updateInstance, this);
    }

    SfwEntityIExt.prototype.updateInstance = function(instance, updateObj) {
      var k, v;
      for (k in updateObj) {
        v = updateObj[k];
        if (__indexOf.call(instance.entity.keyNames, k) >= 0) {
          instance[k] = v;
        }
      }
    };

    SfwEntityIExt.prototype._update = function(instance, evt, hashOrKey, val, cb, cbParams) {
      var doUpdate, k, query, v, _ref;
      if (!evt._events.error) {
        evt.on('error', function(e) {
          return console.error(e);
        });
      }
      if (sfwExt.isObject(hashOrKey)) {
        query = hashOrKey;
      } else if (val) {
        query = {};
        query[hashOrKey] = val;
      } else {
        return sfwExt.emitError({
          action: "" + instance.model + ".instance.update()",
          params: {
            objectOrKey: hashOrKey,
            val: val
          }
        }, 'params should be (object) or (key, val)', evt, cb);
      }
      _ref = instance.attributes();
      for (k in _ref) {
        v = _ref[k];
        if (query[k] == null) {
          query[k] = v;
        }
      }
      doUpdate = (function(_this) {
        return function(validKeys) {
          var relEnt, related, _i, _len;
          validKeys.model = instance.model;
          related = instance.entity.keys.filter(function(key) {
            return key.relatedEntity;
          });
          for (_i = 0, _len = related.length; _i < _len; _i++) {
            relEnt = related[_i];
            validKeys[relEnt.keyName] = validKeys[relEnt.keyName]._id;
          }
          NeDB.update({
            _id: instance.id
          }, validKeys, {}, function(err, results) {
            _this.updateInstance(instance, validKeys);
            if (err) {
              evt.emit('error', err);
              if (cb) {
                cb(err, null, cbParams);
              }
            }
            if (results) {
              evt.emit('data', instance);
              evt.emit('success');
              if (cb) {
                return cb(null, true, cbParams);
              }
            }
          });
          return true;
        };
      })(this);
      sfwExt.validateData(instance.entity, query, false).on('error', function(vdErr) {
        return sfwExt.emitError({
          action: "" + instance.model + ".instance.update()",
          params: {
            objectOrKey: hashOrKey,
            val: val
          }
        }, vdErr, evt, cb);
      }).on('data', doUpdate);
    };

    SfwEntityIExt.prototype._destroy = function(instance) {
      var destroyEvt, doRemove;
      destroyEvt = new Event();
      doRemove = function() {
        return NeDB.remove({
          _id: instance.id
        }, {}, function(err, results) {
          if (err) {
            destroyEvt.emit('error', err);
            return;
          }
          if (results) {
            destroyEvt.emit('success', true);
          }
        });
      };
      setTimeout(doRemove, 0);
      return destroyEvt;
    };

    return SfwEntityIExt;

  })();

}).call(this);
