'use strict'

### ToDo: implement all of the below entity methods
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
###

# Export module
module.exports =
  entity: (model) -> new SfwEntity(model)
  entityInstance: (entity) -> new SfwEntityInstance(entity)

# Setup
sfwEntExt = require('./sfw_entity_ext')
sfwExt = sfwEntExt.ext()
sfwIExt = sfwEntExt.iExt()
Event = require('events').EventEmitter

# SfwEntity Class
class SfwEntity
  constructor: (model) ->
    unless (typeof model == "string" && model.trim() != '')
      return sfwExt.emitError(
        {action: "new SfwEntity()", params: {model: model}}, 'model param (string) not provider')
    @model = model.toCamelCaseInitCap()
    @parents = []
    @children = []
    @keys = []
    @keyNames = []

  belongsTo: (parent) =>
    @parents.push(parent)
    parent.registerChild(@)
    return true

  registerChild: (child) =>
    @children.push(child)
    return true

  hasKeys: (keys) =>
    return sfwExt._hasKeys(@, keys)

  relatedKeyNames: => return @keys.filter((key) -> key.relatedEntity).map((key) -> key.keyName)

  isInstance: (obj) => return obj instanceof SfwEntityInstance

  find: (val, cb = null, cbParams = null, aryMod = null) =>
    evt = new Event()
    _find = => sfwExt._find(@, evt, val, cb, cbParams, aryMod)
    setTimeout(_find, 0)
    return evt

  findFirst: (val, cb = null, cbParams = null) =>
    return @find(val, cb, cbParams, 'first')

  findLast: (val, cb = null, cbParams = null) =>
    return @find(val, cb, cbParams, 'last')

  findBy: (hashOrKey, val = null, cb = null, cbParams = null, aryMod = null) =>
    evt = new Event()
    if typeof val == 'function' then cbParams = cb; cb = val; val = null
    _findBy = => sfwExt._findBy(@, evt, hashOrKey, val, cb, cbParams, aryMod)
    setTimeout(_findBy, 0)
    return evt

  findByFirst: (hashOrKey, val = null, cb = null, cbParams = null) =>
    if typeof val == 'function' then cbParams = cb; cb = val; val = null
    return @findBy(hashOrKey, val, cb, cbParams, 'first')

  findByLast: (hashOrKey, val = null, cb = null, cbParams = null) =>
    if typeof val == 'function' then cbParams = cb; cb = val; val = null
    return @findBy(hashOrKey, val, cb, cbParams, 'last')

  findOrCreateBy: (hashOrKey, val = null, cb = null, cbParams = null) =>
    evt = new Event()
    if typeof val == 'function' then cbParams = cb; cb = val; val = null
    _findOrCreateBy = => sfwExt._findOrCreateBy(@, evt, hashOrKey, val, cb, cbParams)
    setTimeout(_findOrCreateBy, 0)
    return evt

  new: => return new SfwEntityInstance(@)

  create: (keyOrHash, val = null, cb = null, cbParams = null) =>
    evt = new Event()
    if typeof val == 'function' then cbParams = cb; cb = val; val = null
    _create = => sfwExt._create(@, evt, keyOrHash, val, cb, cbParams)
    setTimeout(_create, 0)
    return evt

# SfwEntityInstance Class
class SfwEntityInstance
  constructor: (@entity) ->
    @model = @entity.model

  save: (cb = null, cbParams = null) =>
    evt = new Event()
    if typeof val == 'function' then cbParams = cb; cb = val; val = null
    _create = => sfwExt._create(@entity, evt, @attributes(null, true), val, cb, cbParams, @)
    _update = => sfwIExt._update(@, evt, @attributes(null, true), val, cb, cbParams)
    if @id then setTimeout(_update, 0) else setTimeout(_create, 0)
    return evt

  update: (hashOrKey, val = null, cb = null, cbParams = null) =>
    evt = new Event()
    if typeof val == 'function' then cbParams = cb; cb = val; val = null
    _update = => sfwIExt._update(@, evt, hashOrKey, val, cb, cbParams)
    setTimeout(_update, 0)
    return evt

  attribute: (key = null) =>
    if typeof key != 'string'
      return sfwExt.emitError({action: "#{@model}.attribute()", params: {key: key}}, 'key must be a string')
    return @attributes(key)

  attributes: (keys = null, noId = null) =>
    attrs = {}
    for key in @entity.keys when !keys || key.keyName == keys || key.keyName in keys
      if key.keyName in @entity.relatedKeyNames() && @entity.isInstance(@[key.keyName])
        attrs[key.keyName] = @[key.keyName].attributes(null, noId)
      else
        attrs[key.keyName] = @[key.keyName]
      attrs.id = @id unless keys || noId
    return if typeof keys == 'string' then attrs[keys] else attrs

  toJSON: (keys = null, noId = null) => return JSON.stringify(@attributes(keys, noId))

  destroy: (cb = null, cbParams = null) =>
    evt = new Event()
    _destroy = =>
      sfwIExt._destroy(@)
      .on 'error', (dErr) -> evt.emit('error', dErr)
      .on 'success', =>
        for k, v of @
          @[k] = null; delete @[k]
        evt.emit('success', true); cb(null, true, cbParams) if cb
    setTimeout(_destroy, 0)
    return evt
