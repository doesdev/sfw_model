(function() {
  'use strict';
  Array.prototype.removeElementByValue = function(val) {
    var pos;
    pos = this.indexOf(val);
    if (pos >= 0) {
      return this.splice(pos, 1);
    }
  };

  Array.prototype.isZeroLength = function() {
    return this.length === 0;
  };

  Array.prototype.first = function(num) {
    if (num == null) {
      num = null;
    }
    if ((!num || num === 1) && this.length > 0) {
      return this[0];
    }
    if ((num = parseInt(num)) > 0 && this.length >= num) {
      return this.slice(0, num);
    }
    return void 0;
  };

  Array.prototype.last = function(num) {
    if (num == null) {
      num = null;
    }
    if ((!num || num === 1) && this.length > 0) {
      return this[this.length - 1];
    }
    if ((num = parseInt(num)) > 0 && this.length >= num) {
      return this.slice(-num);
    }
    return void 0;
  };

  String.prototype.toLowerUnderscored = function() {
    var str;
    str = this.trim().replace(/([a-z]|\s+)[A-Z]|\s+./g, function(match) {
      var newStr;
      if (match.charAt(0).match(/[a-z]/)) {
        newStr = "" + (match.charAt(0)) + "_";
      }
      if (newStr == null) {
        newStr = '_';
      }
      newStr += match.charAt(match.length - 1).toLowerCase();
      return newStr;
    });
    return str.replace(/^./, function(match) {
      return match.toLowerCase();
    });
  };

  String.prototype.toCamelCaseInitCap = function() {
    var ccStr, newStr;
    newStr = this.toLowerUnderscored();
    ccStr = newStr.toLowerCase().replace(/\s+.|_./g, function(match) {
      return match.charAt(match.length - 1).toUpperCase();
    });
    return ccStr.replace(/^./, function(match) {
      return match.toUpperCase();
    });
  };

}).call(this);
