
const { doesNotMatch } = require('assert');
const axios = require('axios')
const cookie = require('cookie');
var callback = require('../callback.js');

module.exports = function (RED) {

  function UsersIsLoggedInNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    node.token_aplicacao = n.token_aplicacao;
    node.tenant = n.tenant;
    node.session = n.session;
    node.status({});

    node.on('input', async function (msg) {

      var token_aplicacao = node.token_aplicacao ;
      var tenant = node.tenant;
      var session = node.session;

      //node.warn(token_aplicacao);
      //node.warn(tenant);
      //node.warn(session);
      const redireciona = `https://${tenant}.metasix.solutions/auth-web/login?redirect_uri=http://127.0.0.1:1880/auth-callback&token_aplicacao=${token_aplicacao}&requested_uri=http://127.0.0.1:1880/teste`

      if(msg.req.cookies._begin == undefined)
      {
        node.status({fill: "yellow", shape: "dot", text: "Unauthorized"});
        node.send([msg, null]);
        msg.res.redirect(redireciona)

      }
      else
      {
        msg.dataSession = msg.req.cookies._begin

        var idUser = msg.req.cookies._begin.split(":")[1]

        var value = await axios.get(`${session}/sessions?type=user&userId=${idUser}&tenant=${tenant}`
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
          var perfil = await axios.get(`https://comercial.metasix.solutions/seguranca-ws/tokens-acesso/${logado[0].token}/valida`
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
          msg.payload = "logado"
          node.send([null, msg]);
        }
        else
        {
          node.status({fill: "yellow", shape: "dot", text: "Unauthorized"});
          delete msg.payload;
          msg.res.redirect(redireciona)
          node.send([msg, null]);
        }
      }
    });

    callback.init(RED, node);
  }

  RED.nodes.registerType("cube_isloggedin", UsersIsLoggedInNode);
};

