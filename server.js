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

// define name, version and author
var name = "Web-NodeJS";
var version = "2.0.0";
var author = "Jerom van der Sar";

// grab NodeJS libaries
var http = require('http');
var fs = require('fs');
var path = require('path');
var util = require('util');
var url = require('url');

// attempt to grab rcon
var rconDisabled = false;
try {
  var rconServer = require('./rcon');
} catch(error) { rconDisabled = true; }

// the server object
var httpServer;
var running = false;
var runningFor = 0;

// set defaults, these will be overridden later
var disallow = [];
var logging = true;
var debug = false;
var port = 80;
var webpath = "web";
var index = "index.html"
var rcon = false
var rconUser = "admin";
var rconPass = "superuser"

// setting stdin values; this is for the key interface;
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.setRawMode(true);

// the log variable; to be defined later
var logger = null;

// define if the config has been loaded yet; used for logging
var configLoaded = false;
var showEntries = [];

// start the server up
startUp();

function startUp(){
  show(name + " version " + version);
  show("Copyright (c) 2011, Jerom van der Sar");
  show("Licened under the GNU GPL v3 licence");
  show("Starting up...");
  
  // old code: starting the parts every 500 milliseconds
  /*
  setTimeout(function(){readConfig()},500);
  setTimeout(function(){readDisallow()},1000);
  setTimeout(function(){serverStart()},1500);
  */
  // start an interval displaying how long the server has been running for
  setInterval(function(){ 
    runningFor += 1;
	if(runningFor == 600){ show("Server runnning for: " + runningFor + " minutes"); } 
  }, 1000);
  
  // continue to part two: read the config
  readConfig();
}

function readConfig(){

  fs.readFile('./config.ini', function(error, content) {
    if(error) {
      show("Configuration file not found", "WARNING");
      show("Generating new config file");
      var data = fs.createWriteStream('./config.ini', {flags: "w", encoding: "utf-8", mode: 0666});
	  data.write("debug:false\n");
	  data.write("port:80\n");
	  data.write("logging:true\n");
      data.write("index:index.html\n");
      data.write("webpath:web/\n");
	  data.write("rcon:false\n");
	  data.write("rconuser:admin\n");
	  data.write("rconpass:superuser");
    } else {
	  line = split(content, "\n");
      for(i = 0; i < line.length; i++){
	    var part = split(line[i],":");
		if(part[0] == "debug"){
          debug = Boolean(part[1].match(/^true$/i));
          if(debug) show("Debugging set to: " + debug);
        }
	    if(part[0] == "port"){
          port = part[1];
          if(debug) show("Port set to: " + port);
        }
	    if(part[0] == "logging") {
          logging = Boolean(part[1].match(/^true$/i));
          if(debug) show("Logging set to: " + logging);
        }
        if(part[0] == "index") {
          index = part[1];
          if(debug) show("Index file set to: " + index);
        }
		if(part[0] == "webpath") {
          webpath = part[1];
          if(debug) show("Web directory set to: " + webpath);
        }
        if(part[0] == "rcon"){
		  if(!rconDisabled){
            rcon = Boolean(part[1].match(/^true$/i));
            if(debug) show("Remote Console set to: " + rcon);
		  } else { show("Remote Console not found, Rcon is disabled", "WARNING");  rcon = false;}
        }
		if(part[0] == "rconuser") {
          rconuser = part[1];
          if(debug) show("Remote Console user set to: " + rconuser);
        }
		if(part[0] == "rconpass") {
          rconpass = part[1];
          if(debug) show("Remote Console password set to: " + rconpass);
        }
      }
	  
    }
	// check if the web directory exists
    if (!dirExists(webpath)) {
	  show("Web directory not found", "WARNING");
	  show("Making a new web directory");
	  
	  fs.mkdir(webpath , function(error) {
	    if(error != null){
	      show(error, "FATAL");
          show("Web directory cannot be created!", "FATAL");
		  stop("Exiting...", 1, "FATAL");
		}
      });
    }
	
	// continue to part three: read the disallow file
    readDisallow();
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
      for(i = 0; i < dissline.length; i++) {
        disallow[i] = dissline[i];
      }
    }
	// finally, start the server
	if(!running){ startServer(); } else { show("Rcon: Reload complete!"); }
  });
}

function startServer() {
  httpServer = http.createServer(httpRequest);
  if(rcon){
    show("Attempting to start Remote Console...");
    rconServer.start(rconUser, rconPass, 23);
	show("Remote Console server listening on port 23");
  }
  show("Attempting to start listening...");
  httpServer.listen(port);
  running = true;
  show("Server listening on port: " + port);
  show("Press CTRL + C to stop the server");
  // the server has been started; excute function
  configLoaded = true;
  afterServerStart();
}

// remote console listeners
if(rcon){
  rconServer.on("connection", function(){ show("Rcon connection received!") });
  rconServer.on("message", function(message){ show("Rcon: " + message) });
  rconServer.on("command", function(command){
    if(command == "/restart"){ stop("Rcon: Restarting...", 2); }
    if(command == "/restart 10"){ stop("Rcon: Restarting...", 3); }
    if(command == "/shutdown"){ stop("Rcon: Shutting down...", 0); }
    if(command == "/reload"){ show("Rcon: Reloading all configs..."); readConfig(); }
	if(command == "/status"){
	  rconServer.sendMessage(socket, "Server status: Good");
	  rconServer.sendMessage(socket, "Server has been running for: " + runningFor + " seconds");
	}
  });
}

// listen for Exception
process.on('uncaughtException', function (error) {
  if(error == "Error: listen EADDRINUSE"){
    show("Failed to bind to port!", "FATAL");
    show(error, "FATAL");
    show("Maybe a server is already running on that port.", "FATAL");
  } else {
    show(name + " has encountered an unknown exeption!", "FATAL");
	show(error.stack, "FATAL");
  }
  stop("Exitting...", 1, "FATAL");
});

// handeling shutdown
process.stdin.on('data', function(key) {
// listen for Ctrl + C
  if(key == '\3') {
    stop();
  }

});

/*
 * ----- SERVER -----
*/

function httpRequest(req, res) {
  allow = true;
  var headerFields = {};
  var mtime;
  
  // parse url and set up
  var uri = url.parse(req.url).pathname;
  if (uri == "/") { uri = uri + index; }
  var uri = webpath + uri;
  var file = path.join(process.cwd(), uri); 
  
  fs.stat(path, function(stats, error){ this.mtime = stats.mtime; });
  
  // try to get ip adress
  var ip = null;
  try { ip = req.headers['x-forwarded-for']; } catch (e) { ip = req.connection.remoteAddress; }
  
  var extension = uri.split('.').pop();
  var contentType = contentTypes[extension] || 'application/octet-stream';
  charset = charsets[contentType];
  contentType = contentType + '; charset=' + charset;
  headerFields['Content-Type'] = contentType;
  headerFields['Last-Modified'] = new Date(mtime);
  
  
  
  if(debug) show("Request recieved for: " + uri + " from: " + ip, "REQ");
  
  fs.exists(file, function(exists) {
    if(!exists) {
      if(debug) show("Responding: Not found " + uri + " (404, Not found)", "RES");
      res.writeHead(404, headerFields);
      res.write("<html><head><title>404 Not Found</title></head><center><h1>404 Not Found</h1></center><hr /><i>" + name + " version " + version + "</i></html>");
      res.end();
      return;
    }

	if (fs.statSync(file).isDirectory()) { file += '/' + index; }

    fs.readFile(file, "binary", function(err, file) {
      if(err) {
        show("Internal server error! (500)","ERROR");
        show(err, "ERROR");
        if(debug) show("Responding: Internal server error (500 Internal server error)","RES");
        res.writeHead(500, headerFields);
        res.write("<html><head><title>500 Internal Server Error</title></head><center><h1>500 Internal Server Error</h1></center><hr /><i>" + name + " version " + version + "</i></html>");
        res.end();
        return;
      }
      for(i = 0; i < disallow.length; i++){
        if (disallow[i] == uri) {
          allow = false;
        }
      }
      if (allow) {
        if(debug) show("Responding: " + uri + " (200, Ok)" ,"RES");
        res.writeHead(200, headerFields);
        res.write(file, "binary");
        res.end();
      } else {
        if(debug) show("Responding: Forbidden (403, Forbidden)" ,"RES");
        res.writeHead(403, headerFields);
        res.write("<html><head><title>403 Forbidden</title</head><center><h1>403 Forbidden</h1></center><hr /><i>" + name + " version " + version + "</i></html>");
        res.end();
      }
    });
	
  });
}

/*
 * ----- FUNCTIONS -----
*/

function show(data, error) {
  
  if(!error) {
    // fallback if undefined
    var error = "INFO"
  }
  // set the time
  var currentTime = new Date();
  var hours = currentTime.getHours()
  var minutes = currentTime.getMinutes()
  var seconds = currentTime.getSeconds() 
  if (minutes < 10){ var minutes = "0" + minutes }
  if (seconds < 10){ var seconds = "0" + seconds }
  var time = hours + ":" + minutes + ":" + seconds;
  util.puts("[" + time + "][" + error + "] -- " + data);
  if(rcon){ rconServer.broadcast("> [" + time + "][" + error + "] -- " + data); }
  log(data, error, time);
}

function log(data, error, time) {
  if(configLoaded) {
    if(logging) {
	  if(!logger) {
        fs.exists("./server.log", function(exists){ if (!exists) {
          var currentTime = new Date();
          logger = fs.createWriteStream('./server.log', {flags: "w", encoding: "utf-8", mode: 0666});
		  logger.write("[" + time + "][INFO] -- Log started at: " + currentTime.toString() + "\r\n");
		  logger.end();
	    }});
        logger = fs.createWriteStream('./server.log', {flags: "a", encoding: "utf-8", mode: 0666});
		logger.write("[" + time + "][" + error + "] -- " + data + "\r\n");
      } else {
	    logger.write("[" + time + "][" + error + "] -- " + data + "\r\n");
	  }
	}
  } else {
    showEntries[showEntries.length] = data + "&" + error + "&" + time;
  }
}

function afterServerStart() {
  if(logging){
    var delims;
    for(i=0; i < showEntries.length; i++){
      delims = split(showEntries[i], "&");
	  log(delims[0].replace("\r\n",""), delims[1].replace("\r\n",""), delims[2].replace("\r\n",""));
    }
  }
  showEntries = undefined;
}

function stop(message, errorlevel, errortype){
  
  // fallbacks
  if(!message) { var message = "Console: Shutting down..."; }
  if(!errorlevel) { var errorlevel = 0; }
  if(!errortype) { var errortype = "INFO"; }
  
  show(message, errortype);
  if(rcon) { rconServer.disconnectAll("Disconnected."); }
  setTimeout(function(){ process.exit(errorlevel); },500);
}

function split(content, delimiter){
  return content.toString().split(delimiter);
}

function dirExists(d) {
  try { fs.statSync(d); return true; } 
  catch(error) { return false; } 
}

var contentTypes = {
  "aiff": "audio/x-aiff",
  "arj": "application/x-arj-compressed",
  "asf": "video/x-ms-asf",
  "asx": "video/x-ms-asx",
  "au": "audio/ulaw",
  "avi": "video/x-msvideo",
  "bcpio": "application/x-bcpio",
  "ccad": "application/clariscad",
  "cod": "application/vnd.rim.cod",
  "com": "application/x-msdos-program",
  "cpio": "application/x-cpio",
  "cpt": "application/mac-compactpro",
  "csh": "application/x-csh",
  "css": "text/css",
  "cur": "image/vnd.microsoft.icon",
  "deb": "application/x-debian-package",
  "dl": "video/dl",
  "doc": "application/msword",
  "drw": "application/drafting",
  "dvi": "application/x-dvi",
  "dwg": "application/acad",
  "dxf": "application/dxf",
  "dxr": "application/x-director",
  "etx": "text/x-setext",
  "ez": "application/andrew-inset",
  "fli": "video/x-fli",
  "flv": "video/x-flv",
  "gif": "image/gif",
  "gl": "video/gl",
  "gtar": "application/x-gtar",
  "gz": "application/x-gzip",
  "hdf": "application/x-hdf",
  "hqx": "application/mac-binhex40",
  "htm": "text/html",
  "html": "text/html",
  "ice": "x-conference/x-cooltalk",
  "ico": "image/x-icon",
  "ief": "image/ief",
  "igs": "model/iges",
  "ips": "application/x-ipscript",
  "ipx": "application/x-ipix",
  "jad": "text/vnd.sun.j2me.app-descriptor",
  "jar": "application/java-archive",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "js": "text/javascript",
  "json": "application/json",
  "latex": "application/x-latex",
  "lsp": "application/x-lisp",
  "lzh": "application/octet-stream",
  "m": "text/plain",
  "m3u": "audio/x-mpegurl",
  "man": "application/x-troff-man",
  "manifest": "text/cache-manifest",
  "me": "application/x-troff-me",
  "midi": "audio/midi",
  "mif": "application/x-mif",
  "mime": "www/mime",
  "movie": "video/x-sgi-movie",
  "mp4": "video/mp4",
  "mpg": "video/mpeg",
  "mpga": "audio/mpeg",
  "ms": "application/x-troff-ms",
  "nc": "application/x-netcdf",
  "oda": "application/oda",
  "ogm": "application/ogg",
  "pbm": "image/x-portable-bitmap",
  "pdf": "application/pdf",
  "pgm": "image/x-portable-graymap",
  "pgn": "application/x-chess-pgn",
  "pgp": "application/pgp",
  "pm": "application/x-perl",
  "png": "image/png",
  "pnm": "image/x-portable-anymap",
  "ppm": "image/x-portable-pixmap",
  "ppz": "application/vnd.ms-powerpoint",
  "pre": "application/x-freelance",
  "prt": "application/pro_eng",
  "ps": "application/postscript",
  "qt": "video/quicktime",
  "ra": "audio/x-realaudio",
  "rar": "application/x-rar-compressed",
  "ras": "image/x-cmu-raster",
  "rgb": "image/x-rgb",
  "rm": "audio/x-pn-realaudio",
  "rpm": "audio/x-pn-realaudio-plugin",
  "rtf": "text/rtf",
  "rtx": "text/richtext",
  "scm": "application/x-lotusscreencam",
  "set": "application/set",
  "sgml": "text/sgml",
  "sh": "application/x-sh",
  "shar": "application/x-shar",
  "silo": "model/mesh",
  "sit": "application/x-stuffit",
  "skt": "application/x-koan",
  "smil": "application/smil",
  "snd": "audio/basic",
  "sol": "application/solids",
  "spl": "application/x-futuresplash",
  "src": "application/x-wais-source",
  "stl": "application/SLA",
  "stp": "application/STEP",
  "sv4cpio": "application/x-sv4cpio",
  "sv4crc": "application/x-sv4crc",
  "svg": "image/svg+xml",
  "swf": "application/x-shockwave-flash",
  "tar": "application/x-tar",
  "tcl": "application/x-tcl",
  "tex": "application/x-tex",
  "texinfo": "application/x-texinfo",
  "tgz": "application/x-tar-gz",
  "tiff": "image/tiff",
  "tr": "application/x-troff",
  "tsi": "audio/TSP-audio",
  "tsp": "application/dsptype",
  "tsv": "text/tab-separated-values",
  "txt": "text/plain",
  "unv": "application/i-deas",
  "ustar": "application/x-ustar",
  "vcd": "application/x-cdlink",
  "vda": "application/vda",
  "vivo": "video/vnd.vivo",
  "vrm": "x-world/x-vrml",
  "wav": "audio/x-wav",
  "wax": "audio/x-ms-wax",
  "wma": "audio/x-ms-wma",
  "wmv": "video/x-ms-wmv",
  "wmx": "video/x-ms-wmx",
  "wrl": "model/vrml",
  "wvx": "video/x-ms-wvx",
  "xbm": "image/x-xbitmap",
  "xlw": "application/vnd.ms-excel",
  "xml": "text/xml",
  "xpm": "image/x-xpixmap",
  "xwd": "image/x-xwindowdump",
  "xyz": "chemical/x-pdb",
  "zip": "application/zip"
};

var charsets = {
  'text/javascript': 'UTF-8',
  'text/html': 'UTF-8'
};