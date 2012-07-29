@echo off
@rem
@rem WebNode Starter version 1.7
@rem Licened under the GNU GPL v3 licence
@rem Copyright (C) 2012 Jerom van der Sar
@rem

cls
:startup
node server.js
set level=%errorlevel%
if "%errorlevel%" == "0" goto exit
if "%errorlevel%" == "1" goto error
if "%errorlevel%" == "2" goto startup
if "%errorlevel%" == "3" goto restart10
exit

:exit
pause
exit 0

:error
pause
exit 1

:restart10
ping localhost -n 11 >nul
goto startup

@rem old code
:: set "newtime=%time:~0,8%"
:: set "endline=[%newtime%][INFO] -- Console: Shutting down..."
:: echo %endline%