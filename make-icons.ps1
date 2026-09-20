Add-Type -AssemblyName System.Drawing

function Save-NewTabIcon {
  param([int]$Size, [string]$Path)

  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(255, 11, 11, 13))

  $s = $Size / 128.0
  $page = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 200, 200, 200))
  $fold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 154, 154, 154))
  $line = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 90, 90, 90), [Math]::Max(1.0, 3 * $s))

  $pagePath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $pts = @(
    (New-Object System.Drawing.PointF ([float](36 * $s), [float](24 * $s))),
    (New-Object System.Drawing.PointF ([float](76 * $s), [float](24 * $s))),
    (New-Object System.Drawing.PointF ([float](92 * $s), [float](40 * $s))),
    (New-Object System.Drawing.PointF ([float](92 * $s), [float](104 * $s))),
    (New-Object System.Drawing.PointF ([float](36 * $s), [float](104 * $s)))
  )
  $pagePath.AddPolygon($pts)
  $g.FillPath($page, $pagePath)

  $foldPts = @(
    (New-Object System.Drawing.PointF ([float](76 * $s), [float](24 * $s))),
    (New-Object System.Drawing.PointF ([float](92 * $s), [float](40 * $s))),
    (New-Object System.Drawing.PointF ([float](76 * $s), [float](40 * $s)))
  )
  $g.FillPolygon($fold, $foldPts)

  if ($Size -ge 32) {
    $g.DrawLine($line, [float](52 * $s), [float](62 * $s), [float](76 * $s), [float](62 * $s))
    $g.DrawLine($line, [float](52 * $s), [float](76 * $s), [float](70 * $s), [float](76 * $s))
  }

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $page.Dispose()
  $fold.Dispose()
  $line.Dispose()
  $pagePath.Dispose()
  $g.Dispose()
  $bmp.Dispose()
}

$dir = Join-Path $PSScriptRoot "icons"
Save-NewTabIcon -Size 16 -Path (Join-Path $dir "icon16.png")
Save-NewTabIcon -Size 32 -Path (Join-Path $dir "icon32.png")
Save-NewTabIcon -Size 48 -Path (Join-Path $dir "icon48.png")
Save-NewTabIcon -Size 128 -Path (Join-Path $dir "icon128.png")
Write-Output "wrote icons"
