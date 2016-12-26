/**
 * Created by reuvenp on 12/26/2016.
 */
var mosca = require('mosca');
var mqtt = require('mqtt');

var pubsubsettings = { // define mqtt server backend at MongoDB mqtt DB
    type: 'mongo',
    url: 'mongodb://localhost:27017/mqtt2?auto_reconnect=true',
    pubsubCollection: 'lab7Collection2',
    mongo: {}
};

var settings = {
    port: 1883,
    backend: pubsubsettings,
    persistence: {
        factory: mosca.persistence.Mongo,
        url: 'mongodb://localhost:27017/mqtt2'
    }
};

var server = new mosca.Server(settings);

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    var client = mqtt.connect('mqtt://localhost:1883',
        { // keepalive: 10 set to 0 to disable
            clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
            // protocolId: 'MQTT'
            // protocolVersion: 4
            clean: false
            // clean: true, set to false to receive QoS 1 and 2 messages while offline
            // reconnectPeriod: 1000 milliseconds, interval between two reconnections
            // connectTimeout: 30 * 1000 milliseconds, time to wait before a CONNACK is received
            // username: the username required by your broker, if any
            // password: the password required by your broker, if any
            // incomingStore: a Store for the incoming packets
            // outgoingStore: a Store for the outgoing packets
            // will: a message that will sent by the broker automatically when the client disconnect badly. The format is:
        });

    socket.on('subscribe', function(topic, qos){
        console.log('client ' + client.clientId + ' subscribe to ' + topic);
        client.subscribe(topic, {qos: qos});
    });
    socket.on('publish', function (topic, msg, qos, retain) {
        console.log('client ' + client.clientId + ' published ' + topic + ' ' + msg);
        client.publish(topic.toString(), msg.toString(), {qos: qos, retain: retain});
    });
    socket.on('unsubscribe', function (topic) {
        client.unsubscribe(topic.toString());
    });
    client.on('message', function (topic, msg) {
        console.log('msg received: topic: ' + topic + ', msg: ' + msg);
        socket.emit('mqtt', {topic: topic.toString(), msg: msg.toString()});
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
