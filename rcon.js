/*
  Copyright (C) 2012 Jerom van der Sar
  Licened under the GNU GPL v3 licence
  
  Disclaimer:
  THIS SOFTWARE IS PROVIDED BY Jerom van der Sar ''AS IS'' AND ANY
  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL Jerom van der Sar BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var net = require('net');
var event = require('events')

var telnetServer;
var running = false;
var eventEmitter = event.EventEmitter;

var username;
var password;
var port;

// connections
var sockets = [];

// EXPORTS

module.exports.event = new eventEmitter();

module.exports.start = function(username, password, port){
  if(!running){
    this.username = username;
	this.password = password;
	this.port = port;
    telnetServer = net.createServer(function(socket) {
      socket.setEncoding('utf8');
      sockets.push(socket);
      module.exports.event.emit("connection", socket);
      socket.write("RCon session running!\r\n");
      socket.on('data', function(data) { socketData(data, socket); });
      socket.on('end', function() { socketEnd(socket); });
    });
	telnetServer.listen(this.port);
	running = true;
	return true;
  } else {
    return false;
  }
}

module.exports.sendMessage = function(socket, message) {
  socket.write(message + "\r\n");
}

module.exports.broadcast = function(message) {
  for(var i = 0; i<sockets.length; i++) {
    sockets[i].write(message + "\r\n");
  }
}

module.exports.disconnect = function(socket, disconnectMessage) {
  module.exports.event.emit("end", socket.remoteAddress);
  socket.end(disconnectMessage);
}

module.exports.disconnectAll = function(disconnectMessage) {
  for(var i = 0; i<sockets.length; i++) {
    module.exports.event.emit("end", sockets[i].remoteAddress);
    sockets[i].end(disconnectMessage);
  }
}

// FUNCTIONS

function socketEnd(socket) {
  var i = sockets.indexOf(socket);
  if (i != -1) { sockets.splice(i, 1); }
}
  
function socketData(data, socket) {
  data = data.toString().replace(/(\r\n|\n|\r)/gm, "");
  if(data.indexOf("/") === 0){
    module.exports.event.emit("command", data, socket); return;
  } else {
    if(data != "" && data != " ") {  module.exports.event.emit("message", data); return; }
  }
}