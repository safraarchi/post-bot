$n8nDir = "C:\Users\Lenovo\Desktop\yusuf\n8n"
Set-Location -Path $n8nDir

# Cek apakah port 3300 sudah aktif
$isRunning = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 3300)
    $isRunning = $true
    $tcp.Close()
} catch {
    $isRunning = $false
}

if (-not $isRunning) {
    $nodeExe = (Get-Command node).Source
    Start-Process -FilePath $nodeExe -ArgumentList "scripts/dashboard_server.js" -WorkingDirectory $n8nDir -WindowStyle Hidden
    Start-Sleep -Milliseconds 1500
}

# Buka dashboard di browser
Start-Process "http://localhost:3300"
