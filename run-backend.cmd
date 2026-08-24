@echo off
REM Carga las variables del archivo .env y arranca Spring Boot.
cd /d "%~dp0"
for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
  if not "%%a"=="" set "%%a=%%b"
)
call "%~dp0mvnw.cmd" spring-boot:run
