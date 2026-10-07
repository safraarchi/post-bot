param (
    [string]$ImagePath,
    [string]$Category = "INFO SAWIT",
    [string]$Headline = "Judul Berita Sawit",
    [string]$Summary = "Ringkasan informasi praktis kebun",
    [string]$OutputPath
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $ImagePath)) {
    Write-Error "Image not found: $ImagePath"
    exit 1
}

# Load original image
$srcImg = [System.Drawing.Image]::FromFile($ImagePath)
$width = 1080
$height = 1080

$bmp = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Center-crop source to 1:1 (No stretching)
$minDim = [Math]::Min($srcImg.Width, $srcImg.Height)
$cropX = [int](($srcImg.Width - $minDim) / 2)
$cropY = [int](($srcImg.Height - $minDim) / 2)
$srcRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $minDim, $minDim
$dstRect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
$g.DrawImage($srcImg, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# Draw dark gradient at the bottom for crystal-clear readability
$gradRect = New-Object System.Drawing.Rectangle 0, 420, 1080, 660
$gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $gradRect,
    [System.Drawing.Color]::FromArgb(0, 0, 0, 0),
    [System.Drawing.Color]::FromArgb(245, 11, 15, 25),
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
)
$g.FillRectangle($gradBrush, $gradRect)

# Category Badge Color based on topic
$badgeR = 220; $badgeG = 38; $badgeB = 38 # Red default
if ($Category -match "SOLUSI|KOMBO|HEMAT") {
    $badgeR = 5; $badgeG = 150; $badgeB = 105 # Emerald Green
} elseif ($Category -match "BERITA|INFO|TBS") {
    $badgeR = 37; $badgeG = 99; $badgeB = 235 # Royal Blue
} elseif ($Category -match "TIPS|SOP|CARA") {
    $badgeR = 217; $badgeG = 119; $badgeB = 6 # Amber Orange
}

$badgeWidth = [Math]::Max(200, [int]($Category.Length * 13 + 36))
$badgeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($badgeR, $badgeG, $badgeB))
$badgeRect = New-Object System.Drawing.Rectangle 50, 50, $badgeWidth, 48
$g.FillRectangle($badgeBrush, $badgeRect)

$badgeFont = New-Object System.Drawing.Font("Arial", [float]13, [System.Drawing.FontStyle]::Bold)
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$g.DrawString($Category, $badgeFont, $whiteBrush, [float]64, [float]63)

# Top Brand Tag
$brandBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(210, 15, 23, 42))
$brandRect = New-Object System.Drawing.Rectangle 720, 50, 310, 48
$g.FillRectangle($brandBrush, $brandRect)
$brandFont = New-Object System.Drawing.Font("Arial", [float]12, [System.Drawing.FontStyle]::Bold)
$g.DrawString("Solusi Sawit Nusantara", $brandFont, $whiteBrush, [float]745, [float]64)

# Headline (Bright Yellow / White)
$headFont = New-Object System.Drawing.Font("Arial", [float]30, [System.Drawing.FontStyle]::Bold)
$yellowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(250, 204, 21))
$headRect = New-Object System.Drawing.RectangleF 50, 700, 980, 200
$g.DrawString($Headline, $headFont, $yellowBrush, $headRect)

# Summary Subtitle (Off-white / Slate)
$sumFont = New-Object System.Drawing.Font("Arial", [float]18, [System.Drawing.FontStyle]::Regular)
$grayBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(226, 232, 240))
$sumRect = New-Object System.Drawing.RectangleF 50, 915, 980, 100
$g.DrawString($Summary, $sumFont, $grayBrush, $sumRect)

# Save output
$bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)

$g.Dispose()
$bmp.Dispose()
$srcImg.Dispose()

Write-Output "Successfully generated: $OutputPath"
