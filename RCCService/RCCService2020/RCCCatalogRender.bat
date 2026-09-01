@echo off
:loop
echo "Starting Catalog Render RCC"
RCCService.exe -console -verbose -port 64989 -settingspath AppSettings.xml -settingskey Catalog
echo Restarting this RCC, Control+C to cancel restart!
timeout 10
echo (%time%) Restarting RCC!
goto loop