################################################################################
#  ________         __           _______            __           ____ _______  #
# |  |  |  |.-----.|  |--.______|    |  |.-----..--|  |.-----._  |   |     __| #
# |  |  |  ||  -__||  _  |______|       ||  _  ||  _  ||  -__| |_|   |__     | #
# |________||_____||_____|      |__|____||_____||_____||_____|_______|_______| #
################################################################################

Contents:
- Readme.txt
- start.bat
- server.js
- rcon.js
- COPYING.txt

This is Web-NodeJS, a project wich I've been working on for the last couple of
days. It's a NodeJS script. NodeJS, a work by Ryan Dahl is based on Google's V8 
javascript engine. In the last couple of days Web-NodeJS has gone though many
versions and has doubled its features. features including:
 - Port selection
 - Disallowing files
 - Logging
 - Remote console
 - Reload, Restart and Shutdown

Running Web-NodeJS: 

Now on to the good stuff. How does it work? How can I configure it. Is that hard?

These are all very good questions. Lets start with the first one. Operation is simple:
Drag all files out of this zipped folder and place them where you want your server.
Then, click on start.bat (for windows users) or type "node server.js" into console
(for linux or Mac users). Note that the file rcon.js is only required for remote
console. You can remove it if you aren't planning on using that.

Your Web-NodeJS console should pop up and a few files will generate including
config.ini and disallow.ini. If you are an advanced user, you will know what to do
from now. For the other users: In the console you see important information about the
web server. This information includes all request and response information (if debug is enabled).
If you have logging enabled in config.ini, all info will be written to log.txt exactly as
shown in the console. There is also a remote console utility. If you have this enabled in the 
config. You can connect to the server with telnet on port 23 (by default). There you can enter
commands. For a list of commands, use /help.

In the "web" directory, you put all your website files. These will automaticly be
available in the server. 

In config.ini you can configure your server. You can change the port, root directory,
toggle logging or timestamping, and setting the default index file.

In disallow.ini you type all files whom shoulnt be accesable though the web server. These
will automaticly be blocked if a client tries to access that file.

That's it for my part. Good luck with Web-NodeJS. For information on modifying or
redistributing, please see the copyright disclaimer file: COPYING.txt