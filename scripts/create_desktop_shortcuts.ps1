$desktop = [System.Environment]::GetFolderPath('Desktop')
$wsh = New-Object -ComObject WScript.Shell
$n8nDir = "C:\Users\Lenovo\Desktop\yusuf\n8n"

# 1. Shortcut: Buka Dashboard Sawit
$startLnk = Join-Path $desktop "Buka Dashboard Sawit.lnk"
$shortcut1 = $wsh.CreateShortcut($startLnk)
$shortcut1.TargetPath = "powershell.exe"
$shortcut1.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$n8nDir\scripts\start_dashboard_hidden.ps1`""
$shortcut1.WorkingDirectory = $n8nDir
$shortcut1.Description = "Buka Dashboard Visual Solusi Sawit Nusantara"
# Use Chrome icon if available, or shell32 icon (globe/app)
if (Test-Path "C:\Program Files\Google\Chrome\Application\chrome.exe") {
    $shortcut1.IconLocation = "C:\Program Files\Google\Chrome\Application\chrome.exe,0"
} else {
    $shortcut1.IconLocation = "shell32.dll,14"
}
$shortcut1.WindowStyle = 7 # Minimized
$shortcut1.Save()

# 2. Shortcut: Stop Dashboard Sawit
$stopLnk = Join-Path $desktop "Stop Dashboard Sawit.lnk"
$shortcut2 = $wsh.CreateShortcut($stopLnk)
$shortcut2.TargetPath = "powershell.exe"
$shortcut2.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$n8nDir\scripts\stop_dashboard_hidden.ps1`""
$shortcut2.WorkingDirectory = $n8nDir
$shortcut2.Description = "Hentikan Server Dashboard Solusi Sawit Nusantara"
$shortcut2.IconLocation = "shell32.dll,27" # Stop / Red X icon
$shortcut2.WindowStyle = 7 # Minimized
$shortcut2.Save()

Write-Output "Shortcuts created successfully on Desktop!"
