var bodyParser = require('body-parser');
const axios = require('axios')
const cookie = require('cookie');

var appPath = '/auth-callback';

async function auth(req, res) {

  const requested = req.query.requested_uri;

  const url = "http://10.7.100.166:8000/sessions"
  var data = {
      "token": req.query.token,
      "host": req.headers.host,
      "ip": req.headers["x-real-ip"] || "127.0.0.1",
      "agent": req.headers["user-agent"]
  }
  
  //console.log(data)
  
  var value = await axios.post(url,data
              ).then(response => {
               return response;
              })
              .catch((error) => {
               return error
              });
              
  var token = value.data["id"] 
  
  res.cookie("_begin", token, {encode:String})
  
  res.redirect(requested)
  
}

function init(server, app, _log, redSettings) {
  var log = _log;

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get(appPath, auth);

  log.info("Node /auth-callback CUBE started");
}

module.exports = {
  init: function (RED) {

    init(RED.server, RED.httpNode, RED.log, RED.settings);
  }
};

