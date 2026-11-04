Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param (
        [string]$InputPath,
        [string]$OutputPath,
        [int]$TargetWidth
    )

    $src = [System.Drawing.Image]::FromFile($InputPath)
    $ratio = $src.Height / $src.Width
    $targetHeight = [int]($TargetWidth * $ratio)

    $dest = New-Object System.Drawing.Bitmap($TargetWidth, $targetHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($dest)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.DrawImage($src, 0, 0, $TargetWidth, $targetHeight)

    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]92)

    $dest.Save($OutputPath, $encoder, $encoderParams)

    $graphics.Dispose()
    $dest.Dispose()
    $src.Dispose()
    Write-Host "Generated $OutputPath ($TargetWidth x $targetHeight)"
}

$base = (Get-Location).Path + "\public\assets\maps"
Resize-Image "$base\soi_political_map_india_en_official.jpg" "$base\soi_political_map_india_en.jpg" 2400
Resize-Image "$base\soi_physical_map_india_en_official.jpg" "$base\soi_physical_map_india_en.jpg" 2400
Resize-Image "$base\soi_world_map_en_official.jpg" "$base\soi_world_map_en.jpg" 2400

