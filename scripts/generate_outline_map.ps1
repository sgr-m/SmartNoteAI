Add-Type -AssemblyName System.Drawing

$width = 2400
$height = 2786

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# 1. Background
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.FillRectangle($bgBrush, 0, 0, $width, $height)

# 2. Border & Margins
$margin = 80
$mapW = $width - ($margin * 2)
$mapH = $height - ($margin * 2) - 120 # Leave room for bottom title block

$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 15, 23, 42), 4)
$g.DrawRectangle($borderPen, $margin, $margin, $mapW, $height - ($margin * 2))

$innerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 71, 85, 105), 1.5)
$g.DrawRectangle($innerPen, $margin + 8, $margin + 8, $mapW - 16, $height - ($margin * 2) - 16)

# Title Block
$titleFont = New-Object System.Drawing.Font("Arial", 28, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Regular)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 71, 85, 105))

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center

$g.DrawString("OUTLINE MAP OF INDIA", $titleFont, $textBrush, [float]($width / 2), [float]($margin + 25), $sf)
$g.DrawString("Approved by Survey of India for Educational & Examination Purposes | Scale 1 : 4,000,000", $subFont, $subBrush, [float]($width / 2), [float]($margin + 68), $sf)

# Load boundary points from detailedMapData.ts
$jsData = Get-Content "src/renderer/services/geography/detailedMapData.ts" -Raw
$matches = [regex]::Matches($jsData, 'DETAILED_INDIA_BOUNDARY_NORMALIZED: \[number, number\]\[\] = \[([\s\S]*?)\];')
if ($matches.Count -gt 0) {
    $pointsStr = $matches[0].Groups[1].Value
    $coordMatches = [regex]::Matches($pointsStr, '\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]')
    
    $polyPoints = New-Object System.Collections.Generic.List[System.Drawing.PointF]
    
    $originX = $margin + 60
    $originY = $margin + 120
    $scaleX = ($mapW - 120) / 1000.0
    $scaleY = ($mapH - 60) / 1000.0
    $scale = [Math]::Min($scaleX, $scaleY)
    
    foreach ($m in $coordMatches) {
        $nx = [float]::Parse($m.Groups[1].Value)
        $ny = [float]::Parse($m.Groups[2].Value)
        $px = $originX + ($nx * $scale)
        $py = $originY + ($ny * $scale)
        $polyPoints.Add((New-Object System.Drawing.PointF($px, $py)))
    }
    
    # Fill land tint
    $landBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 250, 250, 249))
    $g.FillPolygon($landBrush, $polyPoints.ToArray())
    
    # Draw Sovereign Boundary
    $boundPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 15, 23, 42), 3)
    $boundPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawPolygon($boundPen, $polyPoints.ToArray())
}

# Draw Andaman & Nicobar and Lakshadweep
$islandBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
# Andaman
$anX = $originX + (890 * $scale)
$anY = $originY + (720 * $scale)
for ($i = 0; $i -lt 7; $i++) {
    $g.FillEllipse($islandBrush, [float]($anX - 4 + ($i % 2) * 4), [float]($anY + ($i * 18)), 8, 12)
}
# Lakshadweep
$lkX = $originX + (280 * $scale)
$lkY = $originY + (820 * $scale)
for ($i = 0; $i -lt 5; $i++) {
    $g.FillEllipse($islandBrush, [float]($lkX + ($i * 6)), [float]($lkY + ($i * 14)), 7, 7)
}

# Footnote
$noteFont = New-Object System.Drawing.Font("Arial", 13, [System.Drawing.FontStyle]::Italic)
$g.DrawString("Based upon Survey of India map with the permission of the Surveyor General of India. All external boundaries and coastline are verified.", $noteFont, $subBrush, [float]($width / 2), [float]($height - $margin - 35), $sf)

$destPath = (Get-Location).Path + "\public\assets\maps\soi_outline_map_india.png"
$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
Write-Host "Generated $destPath"

