@echo off
:loop
echo "Starting Image Render RCC"
RCCService.exe -console -verbose -port 64989 -settingspath AppSettings.xml -settingskey Image
echo Restarting this RCC, Control+C to cancel restart!
timeout 10
echo (%time%) Restarting RCC!
goto loop