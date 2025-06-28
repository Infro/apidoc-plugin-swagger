const path = require('path')
const fs = require('fs')
const converter = require('./converters')

let app = {}
let swaggerObj = {}
/**
 * Hook overview: https://github.com/apidoc/apidoc-core/hooks.md
 */
module.exports = {

  init: function (_app) {
    app = _app;

    // Hooks
    app.addHook('parser-parsed-blocks', parserParsedBlocks)

    swaggerObj.info = {
      title: app.packageInfos.title || 'My API',
      version: app.packageInfos.version || '1.0.0',
      description: app.packageInfos.description || 'My REST API Documentation',
    }
    swaggerObj.basePath = app.packageInfos.url || '/'
    swaggerObj.swagger = '2.0'
    swaggerObj.paths = {}
    swaggerObj.definitions = {}
  }
}

let pushKey = null
let pushMethod = null

const ourKeys = Object.keys(converter.ConvertersMap)
function parserParsedBlocks(parsedBlocks) {
  parsedBlocks.forEach((endpoint) => {
    endpoint.local.type = endpoint.local.type.toLowerCase();
    swaggerObj.paths[endpoint.local.url] = swaggerObj.paths[endpoint.local.url] || {};
    if (swaggerObj.paths[endpoint.local.url][endpoint.local.type] !== undefined) {
      console.log(`Endpoint with url ${endpoint.local.url} with method ${endpoint.local.type} already exists in swaggerObj.paths. Please check your apidoc configuration.`);
    }
    var res = {};
    swaggerObj.paths[endpoint.local.url][endpoint.local.type] = res;

    res.description = endpoint.local.description || '';
    res.tags = (res.tags || [])
    res.tags.push(endpoint.local.group || 'default');
    if(endpoint.local.parameter && endpoint.local.parameter.fields && Array.isArray(endpoint.local.parameter.fields.Parameter)) {
      arr = endpoint.local.parameter.fields.Parameter;
      arr.forEach((field) => {
        (res.parameters || []).push({
          name: field.field,
          in: 'body',
          required: !field.optional,
          description: field.description,
          type: String(field.type).toLowerCase()
        })
      });
      // TODO Make rest of swagger object...
      // Added the code below after sanityCheck to appdoc/lib/core/parser.js:176
      // app.hook('parser-parsed-blocks', parsedBlocks, self.elements, filename);
    }
  });
}

process.on('exit', (code) => {
  // triggerd from apidoc when proccess finished successfully
  // TODO: provide callback when apidoc works finished (this event called only when we use cli)\

  let outFlagIndex = process.argv.indexOf('-o')
  if (outFlagIndex === -1) {
    outFlagIndex = process.argv.indexOf('--output')
  }
  if (outFlagIndex !== -1 && process.argv[outFlagIndex + 1]) {
    console.log(`[apidoc-plugin-swagger] parse and convert to swagger format`)

    function getOutputDir() {
      return process.argv[outFlagIndex + 1]
    }

    const destinationFilePath = path.join(process.cwd(), getOutputDir(), 'swagger.json')
    console.log(`[apidoc-plugin-swagger] going to save at path: ${destinationFilePath}`)

    fs.writeFileSync(destinationFilePath, JSON.stringify(swaggerObj, null, 2), 'utf8')

    console.log(`[apidoc-plugin-swagger] swagger.json spec file saved successfully`)
  }
})
