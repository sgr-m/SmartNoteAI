Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\sagar\.gemini\antigravity-ide\brain\7d74a841-d22a-4764-90b6-a448fbde06fd\.user_uploaded\media_1792945471736.png"
$destAssets = "c:\Users\sagar\OneDrive\Documents\Antigravity_SmartBoard App\smartboard-studio\assets"
$destIcons = "c:\Users\sagar\OneDrive\Documents\Antigravity_SmartBoard App\smartboard-studio\assets\icons"
$destPublic = "c:\Users\sagar\OneDrive\Documents\Antigravity_SmartBoard App\smartboard-studio\public\assets\icons"

New-Item -ItemType Directory -Force -Path $destAssets | Out-Null
New-Item -ItemType Directory -Force -Path $destIcons | Out-Null
New-Item -ItemType Directory -Force -Path $destPublic | Out-Null

# Copy original logo as logo.png
Copy-Item -Force $srcPath (Join-Path $destAssets "logo.png")
Copy-Item -Force $srcPath (Join-Path $destIcons "logo.png")
Copy-Item -Force $srcPath (Join-Path $destPublic "logo.png")

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Output "Source Dimensions: $($src.Width) x $($src.Height)"

# The emblem symbol is centered horizontally (x around 260) and occupies y from ~30 to ~270.
# The text 'SmartNoteAI' is from y ~ 290 to ~370.
# Let's crop the emblem symbol into a 256x256 square with dark background (#151722 / matching color)
$squareSize = 256
$cropBmp = New-Object System.Drawing.Bitmap($squareSize, $squareSize)
$g = [System.Drawing.Graphics]::FromImage($cropBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Background fill with the dark slate background color of the logo
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 18, 20, 29))
$g.FillRectangle($bgBrush, 0, 0, $squareSize, $squareSize)

# Emblem in original image is approximately from x=125 to x=395 (width ~270), y=20 to y=285 (height ~265).
# Center emblem inside the 256x256 square with small padding:
# Source rect for emblem: x=115, y=10, w=290, h=280
$srcEmblemRect = New-Object System.Drawing.Rectangle(115, 10, 290, 280)
# Destination rect: 12, 12, 232, 232
$dstEmblemRect = New-Object System.Drawing.Rectangle(12, 12, 232, 232)
$g.DrawImage($src, $dstEmblemRect, $srcEmblemRect, [System.Drawing.GraphicsUnit]::Pixel)

$cropBmp.Save((Join-Path $destIcons "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$cropBmp.Save((Join-Path $destPublic "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# Also create icon.ico using Windows Icon format
$hIcon = $cropBmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream((Join-Path $destIcons "icon.ico"), [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$icon.Dispose()

$g.Dispose()
$cropBmp.Dispose()
$src.Dispose()

Write-Output "Successfully generated logo.png, icon.png, and icon.ico in assets/ and public/!"
