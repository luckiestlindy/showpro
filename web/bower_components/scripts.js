
  //
  // nx.onload = function() {
  //
  //   matrix1.row = 2;
  //   matrix1.col = 2;
  //   matrix1.init();
  //
  //   beatmatrix.matrix = [ [1,0,0,0],[0,1,0,0],[0,0,1,0] ];
  //   beatmatrix.draw();
  //
  // };
$(function() {
  $('.vu').rangeslider({ polyfill: false });
});


var playOn = '#66bb6a',
  playOff = '#0f8534',
  stopOn =  '#fff176',
  stopOff = '#9e9d24',
  recordOn = '#f44336',
  recordOff = '#b71c1c',

  daw = 'Reaper',
  desk = "Digico SD10";

var debug = false;
function sendDawNone(adr, type) {
  port.send({
      address: adr,
      type: type,
      value: 1
  });
}
function sendDaw(adr, type, value) {
  // valid types are f - float32, s - string, i - int32,  b - blob
  port.send({
      address: adr,
      args: [
        {
        type: type,
        value: value
      }
    ]
  });
}
function sendDesk(adr) {
  port2.send({
      address: adr,
      args: [
        {
        type: 'f',
        value: 1
      }
    ]
  });
}

var port = new osc.WebSocketPort({
    url: "ws://localhost:8081",
    // metadata: true
});
var port2 = new osc.WebSocketPort({
    url: "ws://localhost:8082",
    // metadata: true
});


function transport(oscMessage) {
  if(oscMessage.address == '/transport/play' && oscMessage.args[0] == 1) {
    // console.log('playing');
    $('#play').css("background-color", playOn);
    $('#stop').css("background-color", stopOff);
  }
  if(oscMessage.address == '/transport/play' && oscMessage.args[0] === 0) {
    console.log('stopped');
    $('#play').css("background-color", playOff);
    $('#stop').css("background-color", stopOn);
    $('#record').css("background-color", recordOff);
    $('#record-spin').removeClass('fa-circle-o-notch');
    $('#record-spin').addClass('fa-dot-circle-o');
  }
  if(oscMessage.address == '/transport/record') {
    $('#record').css("background-color", recordOn);
    $('#record-spin').addClass('fa-circle-o-notch');
    $('#record-spin').removeClass('fa-dot-circle-o');
    // console.log('recording');
  }
}

function marker(oscMessage) {
  if (oscMessage.address == '/lastmarker/name') {
    document.getElementById(oscMessage.address).innerHTML = oscMessage.args[0];
  }
  if (oscMessage.address == '/lastmarker/number/str') {
    document.getElementById(oscMessage.address).innerHTML = oscMessage.args[0];
  }
}
function convertDBFS(float) {
  var dbfs = (20*(Math.log(float)/Math.LN10)).toFixed(1);
  var x = isFinite(dbfs);
  if(!x) { dbfs = '-∞'; }
  return dbfs;
}
function track(oscMessage) {
  var adr1 = oscMessage.address;
  var adr = adr1.split('/');
  if(adr[1] == 'track') {
    if(adr[3] == 'vu') {
      var currentLevel = oscMessage.args[0]*100;
      var meter = '#\\/track\\/' + adr[2] + '\\/vu';
      var label = meter + '-label';
      var dbfs = convertDBFS(oscMessage.args[0]);
      $(label).text(dbfs);
      $(meter).val(currentLevel).change();
    }

    if (adr[3] == 'name') {
      document.getElementById(oscMessage.address).innerHTML = oscMessage.args[0];
    }
    if (adr[3] == 'recarm' || 'mute' || 'solo' || 'monitor') {
      var onClass = adr[3] + '-on';
      if (oscMessage.args[0] == 1) {
        document.getElementById(oscMessage.address).classList.add(onClass);
      }
      else if (oscMessage.args[0] === 0) {
        document.getElementById(oscMessage.address).classList.remove(onClass);
      }
    }
  }
}
function printMsg(msg) {
  var adr = msg.address;
  var arg = msg.args[0];
  var tmp = ' ' + arg;
  var str = adr.concat(tmp);
  $("#message").text(str);
}
function master(oscMessage) {
  var adr = oscMessage.address;
  function populateMeter(id) {
    var currentLevel = oscMessage.args[0]*100;
    var meter = '#\\/master\\/vu\\/' + id;
    var label = meter + '-label';
    var dbfs = convertDBFS(oscMessage.args[0]);
    // var dbfs = (20*(Math.log(oscMessage.args[0])/Math.LN10)).toFixed(1);
    // var x = isFinite(dbfs);
    // if(!x) { dbfs = '-∞'; }
    // console.log(dbfs, 'dBFS');
    $(label).text(dbfs);
    $(meter).val(currentLevel).change();
  }
  meterID = adr[11];
  populateMeter(meterID);

}
function refresh () {
  $('.fa-refresh').addClass('refresh-rot');
}


port.on("message", function (oscMessage) {
  var adr = oscMessage.address;
  var arg = oscMessage.args[0];
  // if(debug=='true') { oscLog(oscMessage); }
    // $("#message").text(JSON.stringify(oscMessage, undefined, 2));
    // printMsg(oscMessage);
    // console.debug("OSC: ", adr, ' - ', arg);
    // var x = ;
    // if(adr.match('/time')) {console.log('test', arg); }
    if(adr == '/time') {
      // maybe JSON.stringify(arg)
      $("#time").text(arg);
      return;
    }
    if(adr.startsWith('/master/vu')) {
      master(oscMessage);
      return;
    }
    if(adr.startsWith('/lastmarker')) {
      marker(oscMessage);
      return;
     }
    if(adr.startsWith('/track')) {
      track(oscMessage);
      return;
    }
    if(adr.startsWith('/transport')) {
      transport(oscMessage);
      return;
    }
    if(adr == '/anysolo' && arg == 1) {
      $('#anysolo').css('background-color', 'yellow');
      return;
    }
    if(adr == '/anysolo' && arg === 0) {
      $('#anysolo').css('background-color', 'white');
      return;
    }
    console.log(daw, 'Unmatched OSC: ', adr, ' - ', arg);
});


port2.on("message", function (oscMessage) {
    console.log(desk, ' OSC: ', oscMessage.address, '-', oscMessage.args[0]);
    // var adr = oscMessage.address;
    // var arg = oscMessage.args[0];
    // var tmp = " " + arg;
    // var str = adr.concat(tmp);
    // // $("#message").text(str);
    // console.debug("OSC: ", adr, ' - ', arg);

});

port.open();
console.info(daw, ' port 1 open');
port2.open();
console.info(desk, ' port 2 open');




port.on("close", function() {
  console.log("Close");
});

port2.on("close", function() {
  console.log("Close");
});
