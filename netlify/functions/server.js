const serverless = require('serverless-http');
const server = require('../../server_app'); 

module.exports.handler = serverless(server);
