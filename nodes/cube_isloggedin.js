
const { doesNotMatch } = require('assert');
const axios = require('axios')
const cookie = require('cookie');
var callback = require('../callback.js');

module.exports = function (RED) {

  function UsersIsLoggedInNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    node.token_aplicacao = n.token_aplicacao;
    node.uriAuth = n.uriAuth;
    node.uriApp = n.uriApp;
    node.uriWS = n.uriWS;
    node.tenant = n.tenant;
    node.session = n.session;
    node.status({});

    node.on('input', async function (msg) {

      var token_aplicacao = node.token_aplicacao ;
      var uriAuth = node.uriAuth
      var uriApp = node.uriApp;
      var uriWS = node.uriWS;
      var tenant = node.tenant;
      var session = node.session;

      var fullUrl = msg.req.protocol + 's://' + uriApp + msg.req.originalUrl;
      var baseUrl = msg.req.protocol + 's://' + uriApp;


      const redireciona = `https://${uriAuth}/auth-web/login?redirect_uri=${baseUrl}/auth-callback&token_aplicacao=${token_aplicacao}&requested_uri=${fullUrl}`

      //node.warn(redireciona)
      if(msg.req.cookies == null || msg.req.cookies._begin == undefined)
      {
        node.status({fill: "yellow", shape: "dot", text: "Unauthorized"});
        node.send([msg, null]);
        msg.res.status(303).redirect(redireciona)

      }
      else
      {
        msg.dataSession = msg.req.cookies._begin

        var idUser = msg.req.cookies._begin.split(":")[1]

        var value = await axios.get(`${session}/sessions?type=user&userId=${idUser}&tenant=${tenant}`,{headers:{"Content-Type": "application/json"}}
            ).then(response => {
             return response;
            })
            .catch((error) => {
             return error
            });
        
        var logado = value.data.filter(el => {
            return (el.id === msg.dataSession);
        }) || [];
        
        msg.logado = (logado.length >= 1)?true:false;
        
        if(msg.logado)
        {
          var perfil = await axios.get(`https://${uriWS}/seguranca-ws/tokens-acesso/${logado[0].token}/valida`,{headers:{"Content-Type": "application/json"}}
            ).then(response => {
             return response;
            })
            .catch((error) => {
             return error
            });
          node.status({fill: "green", shape: "dot", text: "Authenticated"});
          if(perfil)
          {
            msg.perfil = perfil.data
          }

          axios.patch(`${session}/sessions/${msg.dataSession}`
            ).then(response => {
             return response;
            })
            .catch((error) => {
             return error
            });

          msg.payload = "logado"
          node.send([null, msg]);
        }
        else
        {
          node.status({fill: "yellow", shape: "dot", text: "Unauthorized"});
          delete msg.payload;
          msg.res.status(303).redirect(redireciona)
          node.send([msg, null]);
        }
      }
    });

    callback.init(RED, node);
  }

  RED.nodes.registerType("cube_isloggedin", UsersIsLoggedInNode);
};

