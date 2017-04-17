var express = require('express');
var app = express();
app.use(express.static(__dirname + '/web')); //__dir and not _dir
var port = 8000; // you can use any port
app.listen(process.env.PORT || port);
console.log('Node Server Online at port: ' + port);

//--------------------------------------------------
//  Bi-Directional OSC messaging Websocket <-> UDP
//--------------------------------------------------
var daw = 'Reaper';
var desk = "Digico SD10";

var osc = require("osc"),
    WebSocket = require("ws");

var getIPAddresses = function () {
    var os = require("os"),
    interfaces = os.networkInterfaces(),
    ipAddresses = [];

    for (var deviceName in interfaces){
        var addresses = interfaces[deviceName];

        for (var i = 0; i < addresses.length; i++) {
            var addressInfo = addresses[i];

            if (addressInfo.family === "IPv4" && !addressInfo.internal) {
                ipAddresses.push(addressInfo.address);
            }
        }
    }

    return ipAddresses;
};


// Define Connection 1
var udp = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 7400,
    remoteAddress: "10.0.0.8",
    remotePort: 7500,
    // metadata: true
});

udp.on("ready", function () {
    var ipAddresses = getIPAddresses();
    console.log(daw, " Listening for OSC over UDP.");
    ipAddresses.forEach(function (address) {
        console.log(" Host:", address + ", Port:", udp.options.localPort);
    });
    console.log(" Broadcasting OSC over UDP to", udp.options.remoteAddress + ", Port:", udp.options.remotePort);
});

udp.open();

var wss = new WebSocket.Server({
    port: 8081
});

wss.on("connection", function (socket) {
    console.log(daw, " Web Socket connection established!");
    var socketPort = new osc.WebSocketPort({
        socket: socket,
        // metadata: true
    });
    socketPort.on("message", function (oscMsg) {
           console.log(daw, " OSC Msg recvd:", oscMsg, ' - ', oscMsg.args[0]);
           //This is the line that crashes when trying option 2
          //  console.log("Trying to parse: ", JSON.parse(oscMsg.args[0]));
       });
    var relay = new osc.Relay(udp, socketPort, {
        raw: true
    });
});

// Define Connection 2:
var udp2 = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 8400,
    remoteAddress: "127.0.0.1",
    remotePort: 8500,
    // metadata: true
});

udp2.on("ready", function () {
    var ipAddresses2 = getIPAddresses();
    console.log(desk, " Listening for OSC over UDP.");
    ipAddresses2.forEach(function (address) {
        console.log(" Host:", address + ", Port:", udp2.options.localPort);
    });
    console.log(" Broadcasting OSC over UDP to", udp2.options.remoteAddress + ", Port:", udp2.options.remotePort);
});

udp2.open();

var wss2 = new WebSocket.Server({
    port: 8082
});

wss2.on("connection", function (socket) {
    console.log(desk, " Web Socket connection established!");
    var socketPort2 = new osc.WebSocketPort({
        socket: socket,
        // metadata: true
    });
    socketPort2.on("message", function (oscMsg) {
           console.log(desk, " OSC Msg recvd:", oscMsg);
           //This is the line that crashes when trying option 2
          //  console.log("Trying to parse: ", JSON.parse(oscMsg.args[0]));
       });
    var relay2 = new osc.Relay(udp2, socketPort2, {
        raw: true
    });
});
