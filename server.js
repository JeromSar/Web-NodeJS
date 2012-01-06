/*
  Copyright (C) 2012 Jerome van der Sar
  Licened under the GNU GPL v3 licence
  
  Disclaimer:
  THIS SOFTWARE IS PROVIDED BY Jerome van der Sar ''AS IS'' AND ANY
  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL Jerome van der Sar BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var http = require('http');
var fs = require('fs');
var util = require('util');
var path = require('path');
var url = require('url');

name = "Web-NodeJS";
version = "1.9.3";
logging = true;
timestamp = true;
running = 0;

function startUp(){
  show(name + " version " + version);
  show("Copyright (c) 2011, Jerom van der Sar");
  show("Licened under the GNU GPL v3 licence");
  show("Starting up...");
  setTimeout(function(){readConfig()},500);
  setTimeout(function(){readDisallow()},1000);
  setTimeout(function(){serverStart()},1500);
  setInterval(function(){running = running + 10;show("Server runnning for: " + running + " minutes");},600000);
}

function readConfig(){
  fs.readFile('./config.ini', function(error, content) {
    if (error) {
      show("Configuration file not found","WARNING");
      show("Generating new config file");
      var data = fs.createWriteStream('./config.ini', {flags: "w", encoding: "utf-8", mode: 0666});
	  data.write("port:80\n");
	  data.write("timestamp:true\n");
	  data.write("logging:true\n");
      data.write("index:index.html\n");
      data.write("webpath:web\\");
      index = "index.html"
      timestamp = true;
      logging = true;
      port = 80;
      webpath = "\web\\";
    } else {
	  line = split(content,"\n");
      for(i = 0; i < line.length; i++){
	    var part = split(line[i],":");
	    if (i == 0){
          port = part[1];
          show("Port set to: " + port);
        }
	    if (part[0] == "timestamp"){
          timestamp = part[1];
          show("Timestamp set to: " + timestamp);
        }
	    if (part[0] == "logging") {
          logging = part[1];
          show("Logging set to: " + logging);
        }
        if (part[0] == "index") {
          index = part[1];
          show("Index file set to: " + index);
        }
        if (part[0] == "webpath") {
          webpath = part[1];
          show("Web directory set to: " + webpath);
        }
      }
    }
    if (!dirExists(webpath)) {
      show("Web directory does not exist!","FATAL");
      show("Please make a directory called: " + webpath,"FATAL");
      show("Exiting...","FATAL");
      process.exit(1);
    }
  });
}

function readDisallow(){
  fs.readFile('./disallow.ini', function(error, content) {
   if (error) {
      show("Disallow file not found","WARNING");
      show("Generating new disallow file");
      var data = fs.createWriteStream('./disallow.ini', {flags: "w", encoding: "utf-8", mode: 0666});
      data.write("/notaccessable.html\n");
      data.write("/donotgo/tothispage.js\n");
    } else {
	  dissline = split(content,"\n")
      disallow = [];
      for(i = 0; i < dissline.length; i++) {
        disallow[i] = dissline[i];
      }
    }
  });
}

function serverStart(){
  show("Attempting to start listening...");
  server.listen(port);
  show("Server listening on port: " + port);
  show("Press CTRL + C to stop the server");
}

function show(data,error){
  // set the time
  var currentTime = new Date();
  var hours = currentTime.getHours()
  var minutes = currentTime.getMinutes()
  var seconds = currentTime.getSeconds()
  if (minutes < 10){
    var minutes = "0" + minutes
  }
  if (seconds < 10){
    var seconds = "0" + seconds
  }
  var time = hours + ":" + minutes + ":" + seconds;
  if (!error) {
    // fallback if undefined
    var error = "INFO"
  }
  if (timestamp) {
    util.puts("[" + time + "][" + error + "] -- " + data);
  } else {
    util.puts("[" + error + "] -- " + data);
  }
  if (logging){
    path.exists("./log.txt", function(exists) {
      if (!exists) {
        var newlog = fs.createWriteStream('./log.txt', {flags: "w", encoding: "utf-8", mode: 0666});
        newlog.write("[INFO] -- Log started at: " + currentTime + "\n");
        var newlog = undefined;
      }
      var log = fs.createWriteStream('./log.txt', {flags: "a", encoding: "utf-8", mode: 0666});
      if (timestamp) {
        log.write("[" + time + "][" + error + "] -- " + data + "\n");
      } else {
        log.write("[" + error + "] -- " + data + "\n");
      }
    });
  }
}

function split(content,delimiter){
  return content.toString().split(delimiter);
}

function dirExists(d) { 
  try { fs.statSync(d); return true } 
  catch (er) { return false } 
} 

var server = http.createServer(function(req, res) {
  allow = true;
  var ip_address = null;
  try {
    ip_address = req.headers['x-forwarded-for'];
  } catch (error) {
    ip_address = req.connection.remoteAddress;
  }
  var uri = url.parse(req.url).pathname;
  if (uri == "/") {
    var fulluri = uri + index;
  } else {
    var fulluri = uri;
  }
  var uri = webpath + uri;
  var filename = path.join(process.cwd(), uri);
  show("Request recieved for: " + fulluri + " from: " + ip_address,"REQ");
  
  path.exists(filename, function(exists) {
    if(!exists) {
      show("Responding: Not found " + fulluri + " (404, Not found)","RES");
      res.writeHead(404, {"Content-Type": "text/html"});
      res.write("<html><head><center><h1>404 Not Found</h1></center><hr /><i>" + name + " version " + version + "</i></head></html>");
      res.end();
      return;
    }

	if (fs.statSync(filename).isDirectory()) filename += '/' + index;

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        show("Internal server error! (500)","ERROR");
        show(err,"ERROR");
        show("Responding: Internal server error (500 Internal server error)","RES");
        res.writeHead(500, {"Content-Type": "text/html"});
        res.write("<html><head><center><h1>500 Internal Server Error</h1></center><hr /><i>" + name + " version " + version + "</i></head></html>");
        res.end();
        return;
      }
      for(i = 0; i < disallow.length; i++){
        if (disallow[i] == fulluri) {
          allow = false;
        }
      }
      if (allow) {
        show("Responding: " + fulluri + " (200, Ok)" ,"RES");
        res.writeHead(200);
        res.write(file, "binary");
        res.end();
      } else {
        show("Responding: Forbidden (403, Forbidden)" ,"RES");
        res.writeHead(403);
        res.write("<html><head><center><h1>403 Forbidden</h1></center><hr /><i>" + name + " version " + version + "</i></head></html>");
        res.end();
      }
    });
  });
});

startUp();