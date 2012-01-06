@echo off
@rem
@rem WebNode Starter version 1.4
@rem Licened under Creative Commons and MIT licences
@rem Trademark (tm) Jerom van der Sar
@rem
if not exist "web" md "web"
cls
node server.js
set "newtime=%time:~0,8%"
set "endline=[%newtime%][INFO] -- Console: Shutting down..."
echo %endline% >> log.txt
pause
exit