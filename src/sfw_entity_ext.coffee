'use strict'

# Export module
module.exports =
  ext: -> new SfwEntityExt()
  iExt: -> new SfwEntityIExt()

# Setup
adapter = require('./sfw_model_adapter')
NeDB = adapter.NeDB
SfwEntity = require('./sfw_entity')
Event = require('events').EventEmitter

# NeEntity Class extensions
class SfwEntityExt
  constructor: ->

  _hasKeys: (entity, keys) =>
    # helpers
    keyError = (key, msg) => return @emitError({action: "#{entity.model}.hasKeys()", params: {key: key}}, msg)
    mapDistantRelation = (key, type) =>
      familyTree = type.slice(2).reverse()
      for model in familyTree
        if !lastRelation then lastRelation = @getEntityByParentOrChild(entity.parents, entity.children, model)
        else lastRelation = @getEntityByParentOrChild(lastRelation.parents, lastRelation.children, model)
        return keyError(key, 'failed mapping distant relation') unless lastRelation
      return lastRelation || null
    # process keys
    for key in keys
      key.keyType ?= 'string'
      type = key.keyType.split(':')
      if type[0] == 'entity'
        if type[1] then relationType = type[1] else return keyError(key, 'no relation set for entity')
        if type[2] then relatedModel = type[2] else return keyError(key, 'no model set for entity')
        relatedModel = type[2]
        switch relationType
          when 'parent' then relationship = entity.parents.filter(@getEntityByModel(relatedModel))[0] || null
          when 'child' then relationship = entity.children.filter(@getEntityByModel(relatedModel))[0] || null
          when 'distant' then relationship = mapDistantRelation(key, type)
        return keyError(key, 'error establishing relationship for key') unless relationship
        key.relatedEntity = relationship
      entity.primaryKey ?= key if key.primaryKey
      entity.keys.push(key)
      entity.keyNames.push(key.keyName)
    return true

  ## SfwEntity Class extensions
  _find: (entity, evt, val, cb, cbParams, aryMod) =>
    evt.on('error', (e) -> console.error(e)) unless evt._events.error
    query = {}
    unless entity.primaryKey && entity.primaryKey.keyName
      return @emitError({action: "#{entity.model}.find()", params: {val: val}}, 'model has no primary key', evt, cb)
    query[entity.primaryKey.keyName] = val
    query.model = entity.model
    NeDB.find query, (err, results) =>
      @emitResults(err, results, entity, "#{entity.model}.find()", {val: val}, aryMod, evt, cb, cbParams)
    return true

  _findBy: (entity, evt, hashOrKey, val, cb , cbParams, aryMod) =>
    evt.on('error', (e) -> console.error(e)) unless evt._events.error
    if @isObject(hashOrKey)
      query = hashOrKey
    else if val
      query = {}
      query[hashOrKey] = val
    else return @emitError({action: "#{entity.model}.findBy()", params: {objectOrKey: hashOrKey, val: val}},
      'params should be (object) or (key, val)', evt, cb)
    query.model = entity.model
    NeDB.find query, (err, results) =>
      @emitResults(err, results, entity, "#{entity.model}.findBy()", query, aryMod, evt, cb, cbParams)
    return true

  _findOrCreateBy: (entity, evt, hashOrKey, val = null, cb = null, cbParams = null) =>
    evt.on('error', (e) -> console.error(e)) unless evt._events.error
    entity.findBy(hashOrKey, val, null, null, 'first')
    .on 'error', (findByErr) ->
      evt.emit('error', findByErr)
      if cb then cb(findByErr, null, cbParams)
      return
    .on 'data', (findByResults) ->
      if findByResults
        evt.emit('data', findByResults)
        if cb then cb(null, findByResults, cbParams)
        return
      entity.create(hashOrKey, val, null, null)
      .on 'error', (createErr) ->
        evt.emit('error', createErr)
        if cb then cb(createErr, null, cbParams)
        return
      .on 'data', (createResults) ->
        evt.emit('data', createResults)
        if cb then cb(null, createResults, cbParams)
    return true

  _create: (entity, evt, hashOrKey, val, cb, cbParams, instance = null) =>
    evt.on('error', (e) -> console.error(e)) unless evt._events.error
    if @isObject(hashOrKey)
      query = hashOrKey
    else if val
      query = {}
      query[hashOrKey] = val
    else return @emitError({action: "#{entity.model}.create()", params: {objectOrKey: hashOrKey, val: val}},
      'params should be (object) or (key, val)', evt, cb)
    doCreate = (validKeys) =>
      validKeys.model = entity.model
      related = []
      relatedEntities = entity.keys.filter (key) -> key.relatedEntity
      for relEnt in relatedEntities
        rel = {}
        rel[relEnt.keyName] = validKeys[relEnt.keyName]
        related.push(rel)
        validKeys[relEnt.keyName] = validKeys[relEnt.keyName]._id
      NeDB.insert validKeys, (insertErr, insertResults) =>
        @emitResults(
          insertErr, insertResults, entity, "#{entity.model}.create()",
          {object: query}, 'first', evt, cb, cbParams, instance, related)
    @validateData(entity, query, true)
    .on 'error', (vkError) => return @emitError(
      {action: "#{entity.model}.create()", params: {objectOrKey: hashOrKey, val: val}}, vkError, evt, cb)
    .on 'data', doCreate
    return true

  ## Helpers
  # Get time and date in a nice string
  now: => return "#{(d = new Date()).toLocaleDateString()} #{d.toLocaleTimeString()}"

  # Check if parameter is a non-Array Object
  isObject: (o) => Object.prototype.toString.call(o) == '[object Object]'

  # Check if parameter is an Array
  isArray: (o) => o instanceof Array

  # Check if value matches _id format (NeDB)
  isNeId: (val) => return (val.length == 16 && !val.match(/\s/))

  # For related entity, check if key has value and if so is it in _id format
  relatedKeyNotEmpty: (val) => return (val && @isNeId(val))

  # Callback function used with an Array.filter to get the matching entity based on the model name
  getEntityByModel: (model) => return (entity) -> return entity.model == model.toCamelCaseInitCap()

  # Initiate the above helper for parent or child entities
  getEntityByParentOrChild: (parents, children, model) =>
    return parents.filter(@getEntityByModel(model))[0] || children.filter(@getEntityByModel(model))[0] || null

  # Callback function used with an Array.filter to validate that the passed key is defined in the model's schema
  validateKeyIsDefined: (keyName) => return (key) -> return key.keyName == keyName

  # Validate email likeness (very loose definition of email validation)
  validateEmail: (mKey, v) => return (mKey.keyType != 'email' || mKey.skipValidation || v.match(/.*@.*\..*/))

  # Validate uri likeness (very loose definition of uri validation)
  validateUri: (mKey, v) => return (mKey.keyType != 'url' || mKey.skipValidation || v.match(/.*\..*/))

  # Callback that validates uniqueness of key
  validateKeyUniqueness: (results, params) =>
    if !results || results.isZeroLength() || (results.first()._id == params.id && results.length == 1)
      params.uniqAry.removeElementByValue(params.keyName)
      params.cb()
    else
      params.errCb("value must be unique for key => #{params.keyName}")
    return

  # Callback that validates relations are met and sets related entity as value
  validateKeyRelation: (results, params) =>
    if results && results.length > 0
      params.validKeys[params.keyName] = results.first()
      params.relAry.removeElementByValue(params.keyName)
      params.cb()
    else params.errCb("relation could not be established for key => #{params.keyName}")
    return

  # Validate key / value data for schema definition, required, unique, etc...
  validateData: (entity, passedObj, validateRequired = null) =>
    evt = new Event()
    validKeys = {}
    includedKeys = []
    processed = 0
    modelKeys = entity.keys
    includedKeys.push(k) for k, v of passedObj
    required = modelKeys.filter((key) -> key.requireKey).map((key) -> key.keyName)
    mustBeUnique = modelKeys.filter((key) -> key.uniqueKey if key.keyName in includedKeys).map((key) -> key.keyName)
    related = modelKeys.filter((key) -> key.relatedEntity if key.keyName in includedKeys).map((key) -> key.keyName)
    handleKeyError = (msg) -> evt.emit 'error', msg; return
    emitWhenReady = ->
      if processed == includedKeys.length
        handleKeyError('required keys not included') if validateRequired && required.length > 0
        evt.emit 'data', validKeys if mustBeUnique.isZeroLength() && related.isZeroLength()
    # validate key type constraints, uniqueness, and relation of each key value pair
    processKeys = (k, v) =>
      modelKey = (modelKeys.filter(@validateKeyIsDefined(k))[0])
      if modelKey
        validKeys[k] = v
        required.removeElementByValue(k)
        return handleKeyError('key type is email, but not in email format') unless @validateEmail(modelKey, v)
        return handleKeyError('key type is url, but not in url format') unless @validateUri(modelKey, v)
        if modelKey.uniqueKey
          vkuParams = {
            keyName: modelKey.keyName, id: passedObj.id, uniqAry: mustBeUnique, cb: emitWhenReady, errCb: handleKeyError
          }
          entity.findBy(modelKey.keyName, v, null, vkuParams)
          .on 'error', handleKeyError
          .on 'data', @validateKeyUniqueness
        if modelKey.relatedEntity
          if @isNeId(v)
            vkrParams = {
              validKeys: validKeys, keyName: modelKey.keyName, relAry: related, cb: emitWhenReady, errCb: handleKeyError
            }
            modelKey.relatedEntity.findBy('_id', v, null, vkrParams)
            .on 'error', handleKeyError
            .on 'data', @validateKeyRelation
          else if modelKey.relatedEntity.model == v.model
            related.removeElementByValue(modelKey.keyName)
            emitWhenReady()
          else return handleKeyError('relation could not be resolved')
      processed += 1
      return
    processAllKeys = -> processKeys(k, v) for k, v of passedObj
    setTimeout(processAllKeys, 0)
    setTimeout(emitWhenReady, 0)
    return evt

  # Return related instances
  nestRelatedInstances: (instance, related = null) =>
    evt = new Event()
    relatedEntities = instance.entity.keys.filter (key) -> key.relatedEntity
    relatedKeys = relatedEntities.map((key) -> key.keyName)
    emitWhenReady = ->
      if (relatedKeys.every (key) -> !instance[key] || instance.entity.isInstance(instance[key]))
        evt.emit('success'); return true
    getRelated = (relEnt, id, keyName) ->
      relEnt.findByFirst('_id', id)
      .on 'error', (err) -> evt.emit 'error', err
      .on 'data', (data) -> instance[keyName] = data; emitWhenReady()
    processRelations = =>
      for rel in relatedEntities
        keyName = rel.keyName
        val = instance[keyName]
        return unless @relatedKeyNotEmpty(val)
        if related && related[keyName] then instance[keyName] = related[keyName]; emitWhenReady()
        else getRelated(rel.relatedEntity, val, keyName)
    setTimeout(processRelations, 0)
    return evt

  # Log the hell out of errors
  emitError: (env, msg, evt = null, cb = null) =>
    error = {error: {time: @now(), action: env.action, params: env.params, msg: msg}}
    #console.error(error)
    if evt then evt.emit('error', error)
    if cb then cb(error, null)
    return error

  # Result handler that emits data event and initializes callback with results
  emitResults: (err, results, entity, caller, params, aryMod, evt = null,
                cb = null, cbParams = null, instance = null, related = null) =>
    return @emitError({action: caller, params: params}, err, evt, cb) if err
    resultsOut = []
    emitWhenReady = ->
      resultsOut = resultsOut[aryMod]() if aryMod && aryMod in ['first', 'last']
      if evt then evt.emit('data', resultsOut, cbParams); evt.emit('success', true)
      if cb then cb(null, resultsOut, cbParams)
    if !results || ( (isAry = results instanceof Array) && results.isZeroLength() )
      emitWhenReady()
    else
      buildInstance = (result) =>
        bIEvt = new Event()
        instance ?= new SfwEntity.entityInstance(entity)
        instance[k] = v for k, v of result
        instance.id = instance._id
        related = entity.keys.filter((key) => key.relatedEntity if @relatedKeyNotEmpty(instance[key.keyName]))
        processInstance = =>
          if related.isZeroLength()
            bIEvt.emit('data', instance)
          else
            @nestRelatedInstances(instance, related)
            .on 'error', (nestErr) => @emitError({action: caller, params: params}, nestErr, evt, cb); return
            .on 'success', ->
              bIEvt.emit 'data', instance
        setTimeout(processInstance, 0)
        return bIEvt
      pushResultEmitIfReady = (bInst) ->
        resultsOut.push(bInst); emitWhenReady() if !isAry || resultsOut.length == results.length
      results = [results] unless isAry
      buildInstance(result).on('data', pushResultEmitIfReady) for result in results
    return resultsOut


sfwExt = new SfwEntityExt()

# NeEntity instance extensions
class SfwEntityIExt
  constructor: ->

  updateInstance: (instance, updateObj) =>
    instance[k] = v for k, v of updateObj when k in instance.entity.keyNames
    return

  _update: (instance, evt, hashOrKey, val, cb , cbParams) =>
    evt.on('error', (e) -> console.error(e)) unless evt._events.error
    if sfwExt.isObject(hashOrKey)
      query = hashOrKey
    else if val
      query = {}
      query[hashOrKey] = val
    else return sfwExt.emitError(
      {action: "#{instance.model}.instance.update()", params: {objectOrKey: hashOrKey, val: val}},
      'params should be (object) or (key, val)', evt, cb)
    query[k] ?= v for k, v of instance.attributes()
    doUpdate = (validKeys) =>
      validKeys.model = instance.model
      related = instance.entity.keys.filter (key) -> key.relatedEntity
      for relEnt in related
        validKeys[relEnt.keyName] = validKeys[relEnt.keyName]._id
      NeDB.update {_id: instance.id}, validKeys, {}, (err, results) =>
        @updateInstance(instance, validKeys)
        if err then evt.emit('error', err); cb(err, null, cbParams) if cb
        if results then evt.emit('data', instance); evt.emit('success'); cb(null, true, cbParams) if cb
      return true
    sfwExt.validateData(instance.entity, query, false)
    .on 'error', (vdErr) -> sfwExt.emitError(
      {action: "#{instance.model}.instance.update()", params: {objectOrKey: hashOrKey, val: val}}, vdErr, evt, cb)
    .on 'data', doUpdate
    return

  _destroy: (instance) =>
    destroyEvt = new Event()
    doRemove = ->
      NeDB.remove {_id: instance.id}, {}, (err, results) ->
        if err then destroyEvt.emit('error', err); return
        if results then destroyEvt.emit('success', true); return
    setTimeout(doRemove, 0)
    return destroyEvt
