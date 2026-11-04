Add-Type -AssemblyName System.Drawing

function Generate-Toposheet {
    param (
        [string]$SheetNumber,
        [string]$SheetTitle,
        [string]$RegionName,
        [string]$OutputPath,
        [hashtable]$SheetConfig
    )

    $width = 2800
    $height = 2400

    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # 1. Base Margins & Background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 253, 245))
    $g.FillRectangle($bgBrush, 0, 0, $width, $height)

    $marginL = 140
    $marginT = 180
    $marginR = 340 # Extra room on right for Conventional Signs legend
    $marginB = 220 # Room on bottom for Scale bar and Grid Reference instructions

    $mapW = $width - $marginL - $marginR
    $mapH = $height - $marginT - $marginB

    # Map Sheet Frame (Double Border)
    $framePenOuter = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 20, 20, 20), 4)
    $framePenInner = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 60, 60, 60), 1.5)
    $g.DrawRectangle($framePenOuter, $marginL, $marginT, $mapW, $mapH)
    $g.DrawRectangle($framePenInner, $marginL + 6, $marginT + 6, $mapW - 12, $mapH - 12)

    # 2. Header & Marginal Information
    $headerFont = New-Object System.Drawing.Font("Arial", 28, [System.Drawing.FontStyle]::Bold)
    $subHeaderFont = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)
    $metaFont = New-Object System.Drawing.Font("Arial", 13, [System.Drawing.FontStyle]::Regular)
    $smallFont = New-Object System.Drawing.Font("Arial", 10.5, [System.Drawing.FontStyle]::Regular)

    $blackBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
    $redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 185, 28, 28))
    $brownBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 120, 53, 15))
    $blueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 2, 132, 199))
    $greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 22, 101, 52))

    $sfCenter = New-Object System.Drawing.StringFormat
    $sfCenter.Alignment = [System.Drawing.StringAlignment]::Center

    # Top Titles
    $g.DrawString("INDIA AND ADJACENT COUNTRIES", $smallFont, $blackBrush, [float]($marginL + 12), [float]($marginT - 90))
    $g.DrawString($RegionName.ToUpper(), $subHeaderFont, $blackBrush, [float]($marginL + 12), [float]($marginT - 65))

    $g.DrawString("SURVEY OF INDIA", $headerFont, $blackBrush, [float]($marginL + $mapW / 2), [float]($marginT - 130), $sfCenter)
    $g.DrawString("OPEN SERIES MAP - 1 : 50,000", $subHeaderFont, $redBrush, [float]($marginL + $mapW / 2), [float]($marginT - 85), $sfCenter)
    $g.DrawString("SHEET NO. $SheetNumber ($SheetTitle)", $metaFont, $blackBrush, [float]($marginL + $mapW / 2), [float]($marginT - 50), $sfCenter)

    $sfRight = New-Object System.Drawing.StringFormat
    $sfRight.Alignment = [System.Drawing.StringAlignment]::Far
    $g.DrawString("SCALE 1 : 50,000", $subHeaderFont, $blackBrush, [float]($marginL + $mapW - 12), [float]($marginT - 80), $sfRight)
    $g.DrawString("2 Centimetres to 1 Kilometre", $metaFont, $blackBrush, [float]($marginL + $mapW - 12), [float]($marginT - 52), $sfRight)

    # 3. Inner Land Tint & Agricultural Yellow Wash
    $landBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 254, 252, 232)) # Light yellow wash
    $g.FillRectangle($landBrush, $marginL + 7, $marginT + 7, $mapW - 13, $mapH - 13)

    # Reserved Forest (Green Wash)
    $rfBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 187, 247, 208)) # Translucent green
    $rfPoly = New-Object System.Collections.Generic.List[System.Drawing.PointF]
    $rfPoints = $SheetConfig["ForestPolygon"]
    foreach ($pt in $rfPoints) {
        $px = $marginL + ($pt[0] * $mapW)
        $py = $marginT + ($pt[1] * $mapH)
        $rfPoly.Add((New-Object System.Drawing.PointF($px, $py)))
    }
    $g.FillPolygon($rfBrush, $rfPoly.ToArray())
    $g.DrawPolygon((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(160, 34, 197, 94), 2)), $rfPoly.ToArray())
    $g.DrawString("RESERVED FOREST (R.F.)", (New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Bold)), $greenBrush, [float]($marginL + $SheetConfig["RfLabel"][0] * $mapW), [float]($marginT + $SheetConfig["RfLabel"][1] * $mapH))

    # 4. Draw 1 km National Grid (Eastings & Northings)
    $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 239, 68, 68), 1) # Red grid lines

    $gridFont = New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Bold)

    $eStart = $SheetConfig["EastingsStart"]
    $eEnd = $SheetConfig["EastingsEnd"]
    $nStart = $SheetConfig["NorthingsStart"]
    $nEnd = $SheetConfig["NorthingsEnd"]

    $eCount = $eEnd - $eStart
    $nCount = $nEnd - $nStart

    # Vertical Easting Lines
    for ($i = 0; $i -le $eCount; $i++) {
        $gx = $marginL + ($i / $eCount) * $mapW
        $g.DrawLine($gridPen, [float]$gx, [float]$marginT, [float]$gx, [float]($marginT + $mapH))
        
        $eNum = ($eStart + $i).ToString("D2")
        # Top coordinate
        $g.DrawString($eNum, $gridFont, $redBrush, [float]$gx, [float]($marginT - 22), $sfCenter)
        # Bottom coordinate
        $g.DrawString($eNum, $gridFont, $redBrush, [float]$gx, [float]($marginT + $mapH + 6), $sfCenter)
    }

    # Horizontal Northing Lines
    for ($j = 0; $j -le $nCount; $j++) {
        $gy = $marginT + ($j / $nCount) * $mapH
        $g.DrawLine($gridPen, [float]$marginL, [float]$gy, [float]($marginL + $mapW), [float]$gy)
        
        $nNum = ($nEnd - $j).ToString("D2")
        # Left coordinate
        $g.DrawString($nNum, $gridFont, $redBrush, [float]($marginL - 8), [float]($gy - 8), $sfRight)
        # Right coordinate
        $g.DrawString($nNum, $gridFont, $redBrush, [float]($marginL + $mapW + 8), [float]($gy - 8))
    }

    # 5. Draw Brown Contour Lines (20m interval)
    $contourPenNormal = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 146, 64, 14), 1.5)
    $contourPenIndex = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 120, 53, 15), 3.0)
    $contourFont = New-Object System.Drawing.Font("Arial", 9.5, [System.Drawing.FontStyle]::Bold)

    $contours = $SheetConfig["Contours"]
    foreach ($c in $contours) {
        $pen = if ($c["isIndex"]) { $contourPenIndex } else { $contourPenNormal }
        $cPoints = New-Object System.Collections.Generic.List[System.Drawing.PointF]
        foreach ($p in $c["pts"]) {
            $cPoints.Add((New-Object System.Drawing.PointF($marginL + ($p[0] * $mapW), $marginT + ($p[1] * $mapH))))
        }
        if ($cPoints.Count -gt 2) {
            if ($c["isClosed"]) {
                $g.DrawPolygon($pen, $cPoints.ToArray())
            } else {
                $g.DrawCurve($pen, $cPoints.ToArray())
            }
            if ($c["isIndex"]) {
                $lp = $cPoints[0]
                $g.DrawString($c["elev"].ToString(), $contourFont, $brownBrush, $lp.X + 2, $lp.Y - 6)
            }
        }
    }

    # 6. Water Features (River / Lake)
    $waterPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 2, 132, 199), 2.5)
    $sandPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 217, 119, 6), 5)
    $sandPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash

    # Draw Rivers / Streams
    foreach ($river in $SheetConfig["Rivers"]) {
        $rPoints = New-Object System.Collections.Generic.List[System.Drawing.PointF]
        foreach ($p in $river["pts"]) {
            $rPoints.Add((New-Object System.Drawing.PointF($marginL + ($p[0] * $mapW), $marginT + ($p[1] * $mapH))))
        }
        if ($rPoints.Count -gt 1) {
            if ($river["hasSandBed"]) {
                $g.DrawCurve($sandPen, $rPoints.ToArray())
            }
            $g.DrawCurve($waterPen, $rPoints.ToArray())
            $mid = $rPoints[[int]($rPoints.Count / 2)]
            $g.DrawString($river["name"], (New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Italic)), $blueBrush, $mid.X + 6, $mid.Y - 14)
        }
    }

    # Draw Lake if present
    if ($SheetConfig["Lake"]) {
        $lake = $SheetConfig["Lake"]
        $lakeX = $marginL + ($lake["x"] * $mapW)
        $lakeY = $marginT + ($lake["y"] * $mapH)
        $lakeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 14, 165, 233))
        $g.FillEllipse($lakeBrush, [float]($lakeX - $lake["w"]/2), [float]($lakeY - $lake["h"]/2), [float]$lake["w"], [float]$lake["h"])
        $g.DrawEllipse($waterPen, [float]($lakeX - $lake["w"]/2), [float]($lakeY - $lake["h"]/2), [float]$lake["w"], [float]$lake["h"])
        $g.DrawString($lake["name"], (New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Bold)), $blueBrush, [float]($lakeX + 18), [float]($lakeY - 8))
    }

    # 7. Roads, Tracks & Settlements
    $roadPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 220, 38, 38), 3)
    $unmetalledPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 220, 38, 38), 1.5)
    $unmetalledPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash

    foreach ($road in $SheetConfig["Roads"]) {
        $rdPoints = New-Object System.Collections.Generic.List[System.Drawing.PointF]
        foreach ($p in $road["pts"]) {
            $rdPoints.Add((New-Object System.Drawing.PointF($marginL + ($p[0] * $mapW), $marginT + ($p[1] * $mapH))))
        }
        $rPen = if ($road["isMetalled"]) { $roadPen } else { $unmetalledPen }
        $g.DrawCurve($rPen, $rdPoints.ToArray())
    }

    # Settlements (Red Dwelling Blocks)
    $settlementBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 220, 38, 38))
    $setNameFont = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)

    foreach ($town in $SheetConfig["Towns"]) {
        $tx = $marginL + ($town["x"] * $mapW)
        $ty = $marginT + ($town["y"] * $mapH)
        for ($bx = 0; $bx -lt 3; $bx++) {
            for ($by = 0; $by -lt 2; $by++) {
                $g.FillRectangle($settlementBrush, [float]($tx + ($bx * 10)), [float]($ty + ($by * 9)), 7, 6)
            }
        }
        $g.DrawString($town["name"].ToUpper(), $setNameFont, $blackBrush, [float]($tx - 4), [float]($ty + 22))
        if ($town["po"]) {
            $g.DrawString("PO", (New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)), $redBrush, [float]($tx + 36), [float]($ty - 3))
        }
    }

    # 8. Spot Heights & Triangulation Points
    $spotFont = New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Regular)
    $triFont = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)

    foreach ($spot in $SheetConfig["SpotHeights"]) {
        $sx = $marginL + ($spot["x"] * $mapW)
        $sy = $marginT + ($spot["y"] * $mapH)
        if ($spot["isTriangulated"]) {
            $g.DrawPolygon((New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 2)), @(
                (New-Object System.Drawing.PointF($sx, $sy - 9)),
                (New-Object System.Drawing.PointF($sx - 8, $sy + 7)),
                (New-Object System.Drawing.PointF($sx + 8, $sy + 7))
            ))
            $g.DrawString("TRIANGULATED " + $spot["elev"], $triFont, $blackBrush, [float]($sx + 12), [float]($sy - 9))
            if ($spot["name"]) {
                $g.DrawString($spot["name"], (New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Bold)), $brownBrush, [float]($sx + 12), [float]($sy + 8))
            }
        } else {
            $g.FillEllipse($blackBrush, [float]($sx - 2), [float]($sy - 2), 4, 4)
            $g.DrawString("." + $spot["elev"], $spotFont, $blackBrush, [float]($sx + 4), [float]($sy - 8))
        }
    }

    # 9. Right Legend Panel: Conventional Signs Box
    $legX = $marginL + $mapW + 30
    $legY = $marginT + 10
    $legW = $marginR - 45
    $legH = $mapH - 20

    $g.DrawRectangle($framePenInner, $legX, $legY, $legW, $legH)
    $g.DrawString("CONVENTIONAL SIGNS", (New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)), $blackBrush, [float]($legX + $legW/2), [float]($legY + 12), $sfCenter)

    $signs = @(
        @{ Label = "Contour (20m)"; Pen = $contourPenNormal },
        @{ Label = "Index Contour (100m)"; Pen = $contourPenIndex },
        @{ Label = "National Highway"; Pen = $roadPen },
        @{ Label = "Unmetalled Road / Track"; Pen = $unmetalledPen },
        @{ Label = "Perennial Stream"; Pen = $waterPen },
        @{ Label = "Sandy Stream Bed"; Pen = $sandPen }
    )
    $curY = $legY + 45
    foreach ($s in $signs) {
        $g.DrawLine($s["Pen"], [float]($legX + 15), [float]($curY + 8), [float]($legX + 65), [float]($curY + 8))
        $g.DrawString($s["Label"], $smallFont, $blackBrush, [float]($legX + 75), [float]$curY)
        $curY += 32
    }

    # 10. Bottom Margin: Scale Bar & Grid Instructions
    $botY = $marginT + $mapH + 35
    $g.DrawString("CONTOUR INTERVAL 20 METRES | HEIGHTS ARE IN METRES", (New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)), $brownBrush, [float]($marginL + $mapW/2), [float]$botY, $sfCenter)

    # Scale bar: 0..5 km
    $sbY = $botY + 30
    $sbStartX = $marginL + ($mapW/2) - 200
    $kmWidth = 80
    for ($k = 0; $k -lt 5; $k++) {
        $kx = $sbStartX + ($k * $kmWidth)
        $brush = if ($k % 2 -eq 0) { $blackBrush } else { (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)) }
        $g.FillRectangle($brush, [float]$kx, [float]$sbY, [float]$kmWidth, 10)
        $g.DrawRectangle((New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 1)), [float]$kx, [float]$sbY, [float]$kmWidth, 10)
        $g.DrawString($k.ToString(), $smallFont, $blackBrush, [float]$kx, [float]($sbY + 14), $sfCenter)
    }
    $g.DrawString("5 km", $smallFont, $blackBrush, [float]($sbStartX + 5 * $kmWidth), [float]($sbY + 14), $sfCenter)

    $g.DrawString("Published under the direction of the Surveyor General of India. Verified Educational Topographical Sheet.", $smallFont, $blackBrush, [float]($marginL + $mapW/2), [float]($sbY + 45), $sfCenter)

    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated toposheet $OutputPath"
}

# Configuration for Sheet 45 D/7
$config45D7 = @{
    EastingsStart = 80
    EastingsEnd = 95
    NorthingsStart = 85
    NorthingsEnd = 102
    ForestPolygon = @(
        @(0.18, 0.25), @(0.40, 0.18), @(0.70, 0.22), @(0.78, 0.50),
        @(0.72, 0.75), @(0.55, 0.82), @(0.35, 0.78), @(0.20, 0.60)
    )
    RfLabel = @(0.28, 0.32)
    Lake = @{
        name = "Nakki Lake (1195m)"
        x = 0.38
        y = 0.52
        w = 55
        h = 32
    }
    Rivers = @(
        @{
            name = "Sipu Nadi"
            hasSandBed = $true
            pts = @( @(0.05, 0.20), @(0.18, 0.35), @(0.30, 0.55), @(0.25, 0.75), @(0.15, 0.95) )
        },
        @{
            name = "Banas River"
            hasSandBed = $true
            pts = @( @(0.92, 0.15), @(0.82, 0.40), @(0.78, 0.65), @(0.85, 0.85), @(0.90, 0.95) )
        }
    )
    Roads = @(
        @{
            isMetalled = $true
            pts = @( @(0.08, 0.12), @(0.25, 0.35), @(0.38, 0.50), @(0.60, 0.68), @(0.88, 0.88) )
        },
        @{
            isMetalled = $false
            pts = @( @(0.38, 0.50), @(0.50, 0.35), @(0.68, 0.25) )
        }
    )
    Towns = @(
        @{ name = "Mount Abu"; x = 0.42; y = 0.54; po = $true },
        @{ name = "Anadra"; x = 0.15; y = 0.45; po = $true },
        @{ name = "Abu Road"; x = 0.82; y = 0.84; po = $true },
        @{ name = "Sirohi"; x = 0.25; y = 0.14; po = $true }
    )
    SpotHeights = @(
        @{ x = 0.55; y = 0.30; elev = "1722"; isTriangulated = $true; name = "Guru Shikhar (1722m)" },
        @{ x = 0.36; y = 0.50; elev = "1195"; isTriangulated = $false },
        @{ x = 0.75; y = 0.45; elev = "542"; isTriangulated = $false },
        @{ x = 0.18; y = 0.80; elev = "348"; isTriangulated = $false }
    )
    Contours = @(
        @{ elev = 400; isIndex = $false; isClosed = $true; pts = @( @(0.15, 0.20), @(0.45, 0.12), @(0.78, 0.18), @(0.85, 0.55), @(0.75, 0.85), @(0.45, 0.88), @(0.18, 0.70) ) },
        @{ elev = 500; isIndex = $true; isClosed = $true; pts = @( @(0.20, 0.25), @(0.45, 0.16), @(0.72, 0.22), @(0.80, 0.52), @(0.70, 0.80), @(0.42, 0.82), @(0.22, 0.65) ) },
        @{ elev = 600; isIndex = $false; isClosed = $true; pts = @( @(0.24, 0.28), @(0.46, 0.20), @(0.68, 0.26), @(0.75, 0.50), @(0.66, 0.75), @(0.40, 0.78), @(0.26, 0.60) ) },
        @{ elev = 800; isIndex = $false; isClosed = $true; pts = @( @(0.28, 0.32), @(0.48, 0.24), @(0.64, 0.30), @(0.70, 0.48), @(0.62, 0.70), @(0.38, 0.72), @(0.30, 0.55) ) },
        @{ elev = 1000; isIndex = $true; isClosed = $true; pts = @( @(0.32, 0.36), @(0.50, 0.28), @(0.60, 0.34), @(0.65, 0.46), @(0.58, 0.65), @(0.36, 0.66), @(0.34, 0.50) ) },
        @{ elev = 1200; isIndex = $false; isClosed = $true; pts = @( @(0.36, 0.40), @(0.52, 0.32), @(0.58, 0.38), @(0.60, 0.44), @(0.54, 0.60), @(0.38, 0.60), @(0.36, 0.46) ) },
        @{ elev = 1400; isIndex = $false; isClosed = $true; pts = @( @(0.42, 0.36), @(0.55, 0.30), @(0.60, 0.36), @(0.56, 0.46), @(0.46, 0.48) ) },
        @{ elev = 1600; isIndex = $true; isClosed = $true; pts = @( @(0.50, 0.32), @(0.56, 0.28), @(0.58, 0.34), @(0.54, 0.38) ) },
        @{ elev = 1700; isIndex = $false; isClosed = $true; pts = @( @(0.53, 0.31), @(0.56, 0.29), @(0.57, 0.32), @(0.54, 0.33) ) }
    )
}

# Configuration for Sheet 45 D/10
$config45D10 = @{
    EastingsStart = 10
    EastingsEnd = 25
    NorthingsStart = 15
    NorthingsEnd = 32
    ForestPolygon = @(
        @(0.45, 0.15), @(0.85, 0.18), @(0.88, 0.65), @(0.60, 0.75), @(0.42, 0.45)
    )
    RfLabel = @(0.55, 0.28)
    Lake = $null
    Rivers = @(
        @{
            name = "Balaram Nadi"
            hasSandBed = $true
            pts = @( @(0.85, 0.12), @(0.65, 0.35), @(0.45, 0.58), @(0.25, 0.72), @(0.08, 0.88) )
        }
    )
    Roads = @(
        @{
            isMetalled = $true
            pts = @( @(0.05, 0.75), @(0.32, 0.62), @(0.55, 0.50), @(0.92, 0.35) )
        }
    )
    Towns = @(
        @{ name = "Palanpur"; x = 0.28; y = 0.65; po = $true },
        @{ name = "Kanpura"; x = 0.65; y = 0.48; po = $false }
    )
    SpotHeights = @(
        @{ x = 0.72; y = 0.25; elev = "890"; isTriangulated = $true; name = "▲ 890m" },
        @{ x = 0.35; y = 0.58; elev = "252"; isTriangulated = $false }
    )
    Contours = @(
        @{ elev = 300; isIndex = $false; isClosed = $false; pts = @( @(0.35, 0.85), @(0.45, 0.65), @(0.55, 0.45), @(0.65, 0.25), @(0.75, 0.10) ) },
        @{ elev = 400; isIndex = $false; isClosed = $false; pts = @( @(0.42, 0.85), @(0.50, 0.65), @(0.60, 0.45), @(0.70, 0.25), @(0.80, 0.10) ) },
        @{ elev = 500; isIndex = $true; isClosed = $false; pts = @( @(0.48, 0.85), @(0.56, 0.65), @(0.65, 0.45), @(0.75, 0.25), @(0.85, 0.10) ) },
        @{ elev = 600; isIndex = $false; isClosed = $true; pts = @( @(0.58, 0.35), @(0.75, 0.20), @(0.82, 0.35), @(0.68, 0.48) ) },
        @{ elev = 800; isIndex = $false; isClosed = $true; pts = @( @(0.65, 0.28), @(0.78, 0.22), @(0.78, 0.30), @(0.68, 0.34) ) }
    )
}

# Configuration for Sheet 53 E/4
$config53E4 = @{
    EastingsStart = 40
    EastingsEnd = 55
    NorthingsStart = 60
    NorthingsEnd = 77
    ForestPolygon = @(
        @(0.15, 0.15), @(0.55, 0.10), @(0.85, 0.25), @(0.78, 0.70), @(0.35, 0.85), @(0.12, 0.55)
    )
    RfLabel = @(0.25, 0.25)
    Lake = $null
    Rivers = @(
        @{
            name = "Sutlej River Gorge"
            hasSandBed = $false
            pts = @( @(0.10, 0.85), @(0.30, 0.65), @(0.50, 0.55), @(0.70, 0.45), @(0.92, 0.28) )
        }
    )
    Roads = @(
        @{
            isMetalled = $true
            pts = @( @(0.12, 0.90), @(0.32, 0.70), @(0.52, 0.50), @(0.72, 0.32), @(0.90, 0.15) )
        }
    )
    Towns = @(
        @{ name = "Shimla Ridge"; x = 0.68; y = 0.24; po = $true },
        @{ name = "Kalka Valley"; x = 0.18; y = 0.82; po = $true }
    )
    SpotHeights = @(
        @{ x = 0.72; y = 0.20; elev = "2205"; isTriangulated = $true; name = "Jakhoo Hill (2205m)" },
        @{ x = 0.40; y = 0.55; elev = "1450"; isTriangulated = $false }
    )
    Contours = @(
        @{ elev = 1000; isIndex = $true; isClosed = $false; pts = @( @(0.12, 0.75), @(0.28, 0.60), @(0.45, 0.50), @(0.65, 0.40), @(0.85, 0.25) ) },
        @{ elev = 1200; isIndex = $false; isClosed = $false; pts = @( @(0.16, 0.72), @(0.32, 0.58), @(0.48, 0.46), @(0.68, 0.36), @(0.88, 0.22) ) },
        @{ elev = 1400; isIndex = $false; isClosed = $false; pts = @( @(0.20, 0.68), @(0.36, 0.54), @(0.52, 0.42), @(0.72, 0.32), @(0.90, 0.18) ) },
        @{ elev = 1600; isIndex = $false; isClosed = $true; pts = @( @(0.45, 0.40), @(0.75, 0.25), @(0.82, 0.35), @(0.55, 0.50) ) },
        @{ elev = 1800; isIndex = $false; isClosed = $true; pts = @( @(0.52, 0.34), @(0.74, 0.24), @(0.78, 0.30), @(0.58, 0.42) ) },
        @{ elev = 2000; isIndex = $true; isClosed = $true; pts = @( @(0.60, 0.28), @(0.74, 0.22), @(0.76, 0.26), @(0.64, 0.34) ) },
        @{ elev = 2200; isIndex = $false; isClosed = $true; pts = @( @(0.68, 0.22), @(0.73, 0.20), @(0.74, 0.22), @(0.70, 0.24) ) }
    )
}

$base = (Get-Location).Path + "\public\assets\maps"
Generate-Toposheet "45 D/7" "Mount Abu and Sirohi Region" "Rajasthan and Gujarat" "$base\soi_topo_sheet_45d7.png" $config45D7
Generate-Toposheet "45 D/10" "Palanpur and Aravalli Foothills" "Gujarat and Rajasthan" "$base\soi_topo_sheet_45d10.png" $config45D10
Generate-Toposheet "53 E/4" "Shiwalik Hills and Sutlej Basin" "Himachal Pradesh and Punjab" "$base\soi_topo_sheet_53e4.png" $config53E4
