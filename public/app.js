/**
 * Created by rw on 1/6/15.
 */
var app =  angular.module('app',['ngRoute']);
app.config(function($routeProvider) {
    $routeProvider
        .when('/', {
                        templateUrl: 'partials/home.html',
                        controller:  'HomeCtrl'
        })
        .when('/chat', {
                        templateUrl: 'partials/chat.html',
                        controller:  'ChatCtrl'
        })
        .otherwise({
                    redirectTo: '/'
        });
});
app.controller('ChatCtrl',function($scope, $localstorage, $http, $location, data) {
    var appendMessage, isTyping, lastPress, sendMessage, socket, status;
    angular.element('.chat').fadeIn();
    status = 'offline';
    $scope.messages = [];
    isTyping = false;
    lastPress = void 0;
    socket = io.connect('/')
    socket.on('log', function(data) {
        $('#status-message').text(data.print);
    })
    socket.on('connected',function(){
        status = 'online';
        $('#status-message').removeClass('typing');
        $('#status-message').text('Connected to someone');
        $scope.messages = [];
        $scope.$apply();

    })
    socket.on('disconnected', function() {
        status = 'offline';
        $('#status-message').removeClass('typing');
        $('#status-message').text('Stranger has disconnected');
    })
    socket.on('next', function(data) {
        status = 'nexted';
        $('#status-message').removeClass('typing');
        $('#status-message').text('Next initiated by the stranger');
    });
    socket.on('msg', function(data) {
        appendMessage('Stranger', data.body);
        $scope.$apply();
    });
    socket.on('typing', function() {
        $('#status-message').addClass('typing');
        $('#status-message').text('Stranger is typing');
    });
    socket.on('not typing', function() {
        $('#status-message').removeClass('typing');
        $('#status-message').text('');
    });
    appendMessage = function(from, message) {
        $scope.messages.push({
            author: from,
            text: message
        });
        $localstorage.setObject('text',$scope.messages);
        $('.messages').animate({
            scrollTop: $('.messages').prop('scrollHeight')
        }, {
            queue: false
        }, 1000);
    };
    sendMessage = function(message) {
        if (!(status === 'offline' || status === 'nexted')) {
            message = message.trim();
            if (message.length > 0) {
                socket.emit('msg', {
                    body: message
                });
            }
            $scope.enteredText = '';
            appendMessage('You', message);
            if (isTyping) {
                socket.emit('not typing');
                isTyping = false;
            }
        }
    };
    $('#chat-text-input').keypress(function(e) {
        if (e.which !== 13) {
            lastPress = new Date();
            if (!isTyping) {
                isTyping = true;
                socket.emit('typing');
            }
            setTimeout(function() {
                var now;
                now = new Date();
                if ((now - 1000) >= lastPress) {
                    socket.emit('not typing');
                     isTyping = false;
                }
            }, 1000);
        }
    });
    $scope.next = function() {
            socket.emit('next');
    };
    $scope.say = function() {
            sendMessage($scope.enteredText);
    };
    $scope.get = function(){
        $http.post('/createText',{'text':$localstorage.getObject('text')})
            .success(function(sec){
                console.log(sec);
                data.set(sec.fileName);
                $scope.file();
            })
            .error(function(err){
                console.log(err);
            })
    }
    $scope.file = function(){
        var fileName = data.get();
        document.getElementById('file').src = '/download/'+ fileName;
    }
});
app.controller('HomeCtrl',function($scope, $location) {
    angular.element('html').css({
        background: '#F3F3F3'
    });
    angular.element('.logo').animate({
        marginTop: '100px',
        opacity: '1'
    }, {
        duration: 750,
        complete: function() {
            angular.element('.find.btn').fadeIn(300);
        }
    });
     angular.element('.find.btn').on('click', function(e) {
        angular.element('.wave-left, .wave-right').css({
            display: 'block'
        });
        angular.element('.wave-left').animate({
            left: '0px',
            opacity: '0'
        }, {
            duration: 500
        });
        angular.element('.wave-right').animate({
            left: '235px',
            opacity: '0'
        }, {
            duration: 500
        });
         angular.element('.splash').animate({
            opacity: '0',
            background: '#E7E7E7'
        }, {
            duration: 1000,
            complete: function() {
             window.location = '#/chat';
            }
        });
    });
})
app.factory('$localstorage', ['$window', function($window) {
    return {
        set: function(key, value) {
            $window.localStorage[key] = value;
        },
        get: function(key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        setObject: function(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key) {
            return JSON.parse($window.localStorage[key] || '{}');
        }
    }
}])
app.factory('data',function(){
    var fileName = '';
    var setName = function(name){
        fileName = name;
        console.log(fileName);
    }
    var getName = function(){
        return fileName;
    };

    return{
        set : setName,
        get: getName
    }
})