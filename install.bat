@echo off
TITLE AEGIS Installer
echo ========================================
echo Installing AEGIS Dependencies
echo ========================================

echo.
echo Installing Python Backend Requirements...
cd backend
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..

echo.
echo Installing React Frontend Requirements...
cd frontend
call npm install
cd ..

echo.
echo ========================================
echo Installation Complete!
echo You can now run start.bat to launch AEGIS.
echo ========================================
pause
