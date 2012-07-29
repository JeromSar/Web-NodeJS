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
var started = false;
var eventEmitter = event.EventEmitter;

var username;
var password;
var port;

// connections
var sockets = [];

module.exports = new eventEmitter();

module.exports.start = function(username, password, port){
  if(!started){
    this.username = username;
	this.password = password;
	this.port = port;
    telnetServer = net.createServer(telnetRequest);
	telnetServer.listen(this.port);
	started = true;
	return true;
  } else {
    return false;
  }
}

module.exports.broadcast = function(message){
  for(var i = 0; i<sockets.length; i++) {
    sockets[i].write(message + "\r\n");
	sockets[i].write("> ");
  }
}

module.exports.sendMessage = function(socket, message){
  socket.write(message + "\r\n");
}

module.exports.disconnectAll = function(disconnectMessage){
  for(var i = 0; i<sockets.length; i++) {
    sockets[i].end(disconnectMessage);
  }
}

function telnetRequest(socket) {
  socket.setEncoding('utf8');
  module.exports.emit("connection", socket);
  sockets.push(socket);
  socket.write("RCon session started!\r\n");
  socket.write("> ");
  socket.on('data', function(data) { receiveData(data); });
  socket.on('end', function() { closeSocket(socket); });
}
  
function closeSocket(socket) {
  var i = sockets.indexOf(socket);
  if (i != -1) { sockets.splice(i, 1); }
}
  
function receiveData(data) {
  data = data.toString().replace(/(\r\n|\n|\r)/gm, "");
  if(data.indexOf("/") === 0){
    module.exports.emit("command", data, socket); return;
  } else {
    if(data != "" && data != " ") {  module.exports.emit("message", data); return; }
  }
}