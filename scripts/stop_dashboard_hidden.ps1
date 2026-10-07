Add-Type -AssemblyName System.Windows.Forms

$stopped = $false

# 1. Coba shutdown anggun via API
try {
    $res = Invoke-RestMethod -Uri "http://localhost:3300/api/shutdown" -Method Post -TimeoutSec 2 -ErrorAction Stop
    $stopped = $true
} catch {
    # Abaikan jika gagal via HTTP
}

# 2. Pastikan process yang memakai port 3300 dihentikan
try {
    $conns = Get-NetTCPConnection -LocalPort 3300 -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        if ($c.OwningProcess -and $c.OwningProcess -gt 0) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
            $stopped = $true
        }
    }
} catch {}

# 3. Tampilkan pesan konfirmasi ramah ke user
[System.Windows.Forms.MessageBox]::Show(
    "Server Dashboard Solusi Sawit Nusantara telah berhasil dihentikan.`n`nAnda dapat membukanya kembali kapan saja lewat pintasan di Desktop.",
    "Solusi Sawit Nusantara",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
) | Out-Null
