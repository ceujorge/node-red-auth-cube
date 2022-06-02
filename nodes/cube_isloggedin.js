
const { doesNotMatch } = require('assert');
const axios = require('axios')
const cookie = require('cookie');
var callback = require('../callback.js');

module.exports = function (RED) {

  function UsersIsLoggedInNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.status({});

    node.on('input', async function (msg) {
      const redireciona = "https://comercial.metasix.solutions/auth-web/login?redirect_uri=http://127.0.0.1:1880/auth-callback&token_aplicacao=YEPSNdQbn3Y_2jUnq90W7Q&requested_uri=http://127.0.0.1:1880/teste"

      if(msg.req.cookies._begin == undefined)
      {
        node.status({fill: "yellow", shape: "dot", text: "Unauthorized"});
        node.send([msg, null]);
        msg.res.redirect(redireciona)

      }
      else
      {
        msg.dataSession = msg.req.cookies._begin

        var value = await axios.get(`http://10.7.100.166:8000/sessions?type=user&userId=143&tenant=comercial`
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
          node.status({fill: "green", shape: "dot", text: "Authenticated"});
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

