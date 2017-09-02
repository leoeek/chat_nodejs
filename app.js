var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var usuarios = {}

//Porta
server.listen(3000);

app.get('/', function(req, resp) {
    resp.sendFile(__dirname + '/publico/index.html');
});

io.sockets.on("connection", function(socket) {
    socket.on("novo usuario", function(nickname, callback) {
        if (nickname in usuarios) {
            callback({ retorno: false, msg: "NickName em uso!" });
        } else {
            console.log("novo usuario no chat " + nickname);
            callback({ retorno: true, msg: "" });
            socket.nickname = nickname;
            usuarios[socket.nickname] = socket;
            atualizarUsuarios();
        }
    });

    socket.on("enviar mensagem", function(data) {
        var mensagem = data.trim();

        var letra = mensagem.substring(0, 1);
        if (letra === "/") {
            var nome = mensagem.substr(1, mensagem.indexOf(" ")).trim();
            var msg = mensagem.substr(mensagem.indexOf(" ") + 1);

            if (nome in usuarios) {
                usuarios[nome].emit("nova mensagem", { msg: "(Mensagem privada de " + socket.nickname + "): <i>" + msg + "</i>", nick: usuarios[nome].nickname });
                socket.emit("nova mensagem", { msg: "(você enviou para " + nome + ") <i>" + msg + "</i>", nick: usuarios[nome].nickname });
            } else {
                socket.emit("nova mensagem", { msg: "O usuário " + nome + " não foi encontrado", nick: socket.nickname });
            }
        } else {
            io.sockets.emit("nova mensagem", { msg: mensagem, nick: socket.nickname });
        }
    });

    socket.on("disconnect", function() {
        if (!socket.nickname) {
            return;
        }
        delete usuarios[socket.nickname];
        atualizarUsuarios();
    });

    function atualizarUsuarios() {
        io.sockets.emit("atualiza usuarios", Object.keys(usuarios));
    };
});