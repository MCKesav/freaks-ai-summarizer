@echo off

REM Set JAVA_HOME for this project
set JAVA_HOME=%~dp0jvm
set PATH=%JAVA_HOME%\bin;%PATH%

echo Java environment configured:
echo JAVA_HOME: %JAVA_HOME%
java -version