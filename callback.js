var bodyParser = require('body-parser');
const axios = require('axios')
const cookie = require('cookie');

var appPath = '/auth-callback';

var session;

async function auth(req, res) {

  const requested = req.query.requested_uri;
  //const headers = {"Content-Type": "application/json"}

  //console.log(requested)

  const url = `${session}/sessions`
  var data = {
      "token": req.query.token,
      "host": req.headers.host,
      "ip": req.headers["x-real-ip"] || "127.0.0.1",
      "agent": req.headers["user-agent"]
  }
  
  //console.log(data)
  
  var value = await axios.post(url,data,{headers:{"Content-Type": "application/json"}}
              ).then(response => {
               return response;
              })
              .catch((error) => {
               return error
              });

  //console.log(value)
              
  var token = value.data["id"] 
  
  res.cookie("_begin", token, {encode: String, sameSite:'none', secure:true})
  
  res.redirect(requested)
  
}

function init(server, app, _log, redSettings,node) {
  var log = _log;


  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get(appPath, auth);

  log.info("Node /auth-callback CUBE started");
}

module.exports = {
  init: function (RED,node) {
    session = node.session;

    init(RED.server, RED.httpNode, RED.log, RED.settings);
  }
};

