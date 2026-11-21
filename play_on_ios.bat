@echo off
cd /d "%~dp0"
python serve_ios.py
if errorlevel 1 pause
