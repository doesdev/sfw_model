'use strict'

## Extension methods of built in classes (i.e. Array, String, etc...)

# Splice element from array
Array.prototype.removeElementByValue = (val) ->
  pos = @indexOf(val)
  @splice(pos, 1) if pos >= 0

# Boolean, is array length = 0
Array.prototype.isZeroLength = ->
  return @length == 0

# Return first (n) elements in array or undefined, return as array of elements if n > 1
Array.prototype.first = (num = null) ->
  return @[0] if (!num || num == 1) && @length > 0
  return @slice(0, num) if (num = parseInt(num)) > 0 && @length >= num
  return undefined

# Return last (n) elements in array or undefined, return as array of elements if n > 1
Array.prototype.last = (num = null) ->
  return @[@length - 1] if (!num || num == 1) && @length > 0
  return @slice(-num) if (num = parseInt(num)) > 0 && @length >= num
  return undefined

# String method that sets string all lowercase with whitespace underscored
String.prototype.toLowerUnderscored = ->
  str = @trim().replace /([a-z]|\s+)[A-Z]|\s+./g , (match) ->
    newStr = "#{match.charAt(0)}_" if match.charAt(0).match(/[a-z]/)
    newStr ?= '_'
    newStr += match.charAt(match.length - 1).toLowerCase()
    return newStr
  return str.replace /^./, (match) -> match.toLowerCase()

# String method that camelcases string with the initial character capitalized
String.prototype.toCamelCaseInitCap = ->
  newStr = @toLowerUnderscored()
  ccStr = newStr.toLowerCase().replace /\s+.|_./g , (match) ->
    return match.charAt(match.length - 1).toUpperCase()
  return ccStr.replace /^./, (match) -> match.toUpperCase()
