/**
 * Created by rw on 1
 * 6/15.
 */
/*all variables*/
 var __slice = [].slice;

express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
sanitize = require('validator').sanitize;
app.set('port', process.env.PORT || 4000);
app.set('views', "" + __dirname + "/views");
app.set('view engine', 'jade');
app.use(express["static"]("" + __dirname + "/public"));
app.get('/', function(req, res){
    res.render('index',{
        title:"Stranger Chat"

    });
});
io.sockets.on('connection', function(socket) {
    addToList(socket);
    socket.on('next', function(data) {
        return socket.get('partner', function(err, stranger) {
            if (err) {
                throw err;
            }
            if (stranger) {
                stranger.emit('next');
                removePartner(stranger);
                removePartner(socket);
                setTimeout(function() {
                    return addToList(stranger);
                }, 3000);
                return addToList(socket);
            } else {
                removePartner(socket);
                return socket.emit('log', {
                    print: 'You have no companion, please wait'
                });
            }
        });
    });
    socket.on('msg', function(data) {
        return socket.get('partner', function(err, stranger) {
            var message;
            if (err) {
                throw err;
            }
            message = sanitize(data.body).trim();
            message = sanitize(message).xss();
            if (message.length > 240) {
                message = message.slice(0, 240);
            }
            if (stranger && message.length > 0) {
                return stranger.emit('msg', {
                    body: message
                });
            }
        });
    });
    socket.on('typing', function(data) {
        return socket.get('partner', function(err, stranger) {
            if (err) {
                throw err;
            }
            if (stranger) {
                return stranger.emit('typing');
            }
        });
    });
    socket.on('not typing', function(data) {
        return socket.get('partner', function(err, stranger) {
            if (err) {
                throw err;
            }
            if (stranger) {
                return stranger.emit('not typing');
            }
        });
    });
    return socket.on('disconnect', function() {
        return socket.get('partner', function(err, stranger) {
            if (err) {
                throw err;
            }
            if (stranger) {
                stranger.emit('disconnected');
                removePartner(stranger);
                return addToList(stranger);
            } else {
                return deleteFromList(socket);
            }
        });
    });
});

/*
io.sockets.on('connection', function(socket) {
    socket.on('next', function (data) {
        socket.get('partner', function (err, stranger) {
            if (err) {
                throw err;
            }
            if (stranger) {
                stranger.emit('next');
                removePartner(stranger);
                removePartner(socket);
                setTimeout(function () {
                    addToList(stranger);
                }, 3000);
                return addToList(socket);
            } else {
                removePartner(socket);
                socket.emit('log', {
                    print: 'You have no companion, please wait'
                });
            }
        });
    });
    socket.on('msg', function (data) {
        socket.get('partner', function (err, stranger) {
            var message;
            if (err) {
                throw err;
            }
            message = sanitize(data.body).trim();
            message = sanitize(message).xss();
            if (message.length > 240) {
                message = message.slice(0, 240);
            }
            if (stranger && message.length > 0) {
                stranger.emit('msg', {
                    body: message
                });
            }
        });
    });
    socket.on('typing', function (data) {
        socket.get('partner', function (err, stranger) {
            if (err) {
                throw err;
            }
            if (stranger) {
                stranger.emit('typing');
            }
        });
    });
    socket.on('not typing', function (data) {
        socket.get('partner', function (err, stranger) {
            if (err) {
                throw err;
            }
            if (stranger) {
                stranger.emit('not typing');
            }
        });
    });
    socket.on('disconnect', function () {
        socket.get('partner', function (err, stranger) {
            if (err) {
                throw err;
            }
            if (stranger) {
                stranger.emit('disconnected');
                removePartner(stranger);
                addToList(stranger);
            } else {
                deleteFromList(socket);
            }
        })
    });
*/
    var seekingUsers = [];

    var findStranger = function (socket) {
        var len, stranger;
        if (seekingUsers.length > 1) {
            len = seekingUsers.length;
            stranger = seekingUsers[Math.floor(Math.random() * len)];
            if (socket === stranger) {
                 findStranger(socket);
            } else {
                return stranger;
            }
        }
    };

    var removePartner = function (user) {
         user.set('partner', void 0);
    };

    var initSearch = function (socket) {
        var stranger;
        stranger = findStranger(socket);
        if (stranger != null) {
            socket.set('partner', stranger);
            stranger.set('partner', socket);
            deleteFromList(socket, stranger);
            socket.emit('connected');
            stranger.emit('connected');
        } else {
            socket.emit('log', {
               print: 'Waiting for stranger...'
            });
        }
    };

    var addToList = function (user) {
        seekingUsers.push(user);
        return initSearch(user);
    };

    var deleteFromList = function () {
        var user, users, _i, _len, _results;
        users = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        _results = [];
        for (_i = 0, _len = users.length; _i < _len; _i++) {
            user = users[_i];
            _results.push(seekingUsers.splice(seekingUsers.indexOf(user), 1));
        }
        return _results;
    }
server.listen(app.get('port'), function() {
    return console.log("Express is listening on port " + (app.get('port')));
});