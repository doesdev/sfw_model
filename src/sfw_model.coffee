'use strict'

# Setup
exports = {}
require('./sfw_std_extensions')
SfwEntityCore = require('./sfw_entity')
#SfwEntityHelpers = require('./sfw_entity_helpers')

# Exports
exports.entity = (model) -> SfwEntityCore.entity(model)
#exports[k] = v for k, v of SfwEntityHelpers
module.exports = exports
