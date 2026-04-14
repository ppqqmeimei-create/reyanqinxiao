# 生成占位 tabbar 图标 PNG（1-bit 透明背景 + 图形）
# 在 PowerShell 5+ 下运行，创建单色透明 PNG
Add-Type -AssemblyName System.Drawing

$iconDir = "c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\static\tabbar"
if (!(Test-Path $iconDir)) { New-Item -ItemType Directory -Path $iconDir -Force | Out-Null }

function New-PlaceholderPng {
    param([string]$Path, [string]$Color, [string]$Shape, [int]$Size = 81)
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $col = [System.Drawing.ColorTranslator]::FromHtml($Color)
    $brush = New-Object System.Drawing.SolidBrush($col)

    $pad = [int]($Size * 0.15)
    $s = $Size - 2 * $pad

    switch ($Shape) {
        "map" {
            # 地图/多边形
            $pts = @(
                (New-Object System.Drawing.PointF(($Size/2), $pad)),
                (New-Object System.Drawing.PointF(($Size-$pad), ($Size*0.65))),
                (New-Object System.Drawing.PointF($pad, ($Size*0.65)))
            )
            $g.FillPolygon($brush, $pts)
            # 定位点
            $innerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 0, 212, 255))
            $cx = $Size / 2; $cy = $Size * 0.55; $r = $Size * 0.08
            $g.FillEllipse($innerBrush, ($cx-$r), ($cy-$r), ($r*2), ($r*2))
            $innerBrush.Dispose()
        }
        "alert" {
            # 警告三角形
            $pts = @(
                (New-Object System.Drawing.PointF(($Size/2), $pad)),
                (New-Object System.Drawing.PointF(($Size-$pad), ($Size-$pad))),
                (New-Object System.Drawing.PointF($pad, ($Size-$pad)))
            )
            $g.FillPolygon($brush, $pts)
            # 感叹号
            $ex = $Size / 2; $ey1 = $Size * 0.38; $ey2 = $Size * 0.68
            $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [int]($Size*0.06))
            $g.DrawLine($pen, $ex, $ey1, $ex, $ey2)
            $dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
            $g.FillEllipse($dotBrush, ($ex-$Size*0.04), ($Size*0.72), ($Size*0.08), ($Size*0.08))
            $pen.Dispose(); $dotBrush.Dispose()
        }
        "task" {
            # 任务/勾选框
            $rx = $pad; $ry = $pad; $rw = $s; $rh = $s
            $g.DrawRectangle((New-Object System.Drawing.Pen($col, [int]($Size*0.06))), $rx, $ry, $rw, $rh)
            # 对勾
            $pen2 = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [int]($Size*0.08))
            $pen2.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
            $pen2.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
            $g.DrawLine($pen2, ($Size*0.25), ($Size*0.52), ($Size*0.42), ($Size*0.70))
            $g.DrawLine($pen2, ($Size*0.42), ($Size*0.70), ($Size*0.78), ($Size*0.30))
            $pen2.Dispose()
        }
        "device" {
            # 设备/传感器圆点网格
            $r = $Size * 0.12
            $positions = @(
                @($Size*0.25, $Size*0.25),
                @($Size*0.75, $Size*0.25),
                @($Size*0.50, $Size*0.50),
                @($Size*0.25, $Size*0.75),
                @($Size*0.75, $Size*0.75)
            )
            foreach ($pos in $positions) {
                $g.FillEllipse($brush, ($pos[0]-$r), ($pos[1]-$r), ($r*2), ($r*2))
            }
        }
        "profile" {
            # 用户头像
            $cx = $Size / 2; $cy = $Size * 0.38; $r = $Size * 0.22
            $g.FillEllipse($brush, ($cx-$r), ($cy-$r), ($r*2), ($r*2))
            # 身体
            $cy2 = $Size * 0.78
            $rb = $Size * 0.30
            $g.FillEllipse($brush, ($cx-$rb), ($cy2-$rb*0.6), ($rb*2), ($rb*1.2))
        }
    }

    $g.Dispose(); $brush.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $Path"
}

# 活跃状态用青色 #00D4FF，未选中用灰色 #8c8c8c
New-PlaceholderPng -Path "$iconDir\map.png"           -Color "#8c8c8c" -Shape "map"
New-PlaceholderPng -Path "$iconDir\map-active.png"    -Color "#00D4FF" -Shape "map"
New-PlaceholderPng -Path "$iconDir\alert.png"         -Color "#8c8c8c" -Shape "alert"
New-PlaceholderPng -Path "$iconDir\alert-active.png"   -Color "#00D4FF" -Shape "alert"
New-PlaceholderPng -Path "$iconDir\task.png"          -Color "#8c8c8c" -Shape "task"
New-PlaceholderPng -Path "$iconDir\task-active.png"   -Color "#00D4FF" -Shape "task"
New-PlaceholderPng -Path "$iconDir\device.png"         -Color "#8c8c8c" -Shape "device"
New-PlaceholderPng -Path "$iconDir\device-active.png"  -Color "#00D4FF" -Shape "device"
New-PlaceholderPng -Path "$iconDir\profile.png"        -Color "#8c8c8c" -Shape "profile"
New-PlaceholderPng -Path "$iconDir\profile-active.png" -Color "#00D4FF" -Shape "profile"

Write-Host "`nAll tabbar icons created successfully!"
