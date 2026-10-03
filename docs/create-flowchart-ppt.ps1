$ErrorActionPreference = 'Stop'
$outputDir = $PSScriptRoot
$scale = 0.54

function Add-FlowchartSlide($presentation, $svgFile) {
    [xml]$svg = Get-Content -LiteralPath $svgFile -Raw -Encoding UTF8
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
    $slide.FollowMasterBackground = 0
    $slide.Background.Fill.ForeColor.RGB = 16777215
    foreach ($node in $svg.DocumentElement.ChildNodes) {
        $shape = $null
        if ($node.LocalName -eq 'rect' -and $node.GetAttribute('class') -eq 'box') {
            $kind = if ([double]$node.GetAttribute('rx') -gt 0) { 5 } else { 1 }
            $shape = $slide.Shapes.AddShape($kind, [double]$node.x*$scale, [double]$node.y*$scale, [double]$node.width*$scale, [double]$node.height*$scale)
        } elseif ($node.LocalName -eq 'polygon') {
            $coords = [regex]::Matches($node.points, '[\d.]+') | ForEach-Object { [double]$_.Value }
            $xs = @(0,2,4,6 | ForEach-Object { $coords[$_] })
            $ys = @(1,3,5,7 | ForEach-Object { $coords[$_] })
            $left = ($xs | Measure-Object -Minimum).Minimum
            $top = ($ys | Measure-Object -Minimum).Minimum
            $width = ($xs | Measure-Object -Maximum).Maximum - $left
            $height = ($ys | Measure-Object -Maximum).Maximum - $top
            $shape = $slide.Shapes.AddShape(4, $left*$scale, $top*$scale, $width*$scale, $height*$scale)
        } elseif ($node.LocalName -eq 'path' -and $node.GetAttribute('class') -eq 'edge') {
            $tokens = [regex]::Matches($node.d, '[MHVL]|-?[\d.]+') | ForEach-Object { $_.Value }
            $segments = @()
            $x = 0.0; $y = 0.0; $i = 0
            while ($i -lt $tokens.Count) {
                $op = $tokens[$i]; $i++
                $nextX = $x; $nextY = $y
                switch ($op) {
                    'M' { $x = [double]$tokens[$i]; $y = [double]$tokens[$i+1]; $i += 2; continue }
                    'H' { $nextX = [double]$tokens[$i]; $i++ }
                    'V' { $nextY = [double]$tokens[$i]; $i++ }
                    'L' { $nextX = [double]$tokens[$i]; $nextY = [double]$tokens[$i+1]; $i += 2 }
                    default { throw "Unsupported SVG path command: $op" }
                }
                $line = $slide.Shapes.AddLine($x*$scale, $y*$scale, $nextX*$scale, $nextY*$scale)
                $line.Line.ForeColor.RGB = 0
                $line.Line.Weight = 1.1
                $segments += $line
                $x = $nextX; $y = $nextY
            }
            if ($segments.Count -gt 0) { $segments[-1].Line.EndArrowheadStyle = 3 }
        } elseif ($node.LocalName -eq 'text') {
            $fontSize = [double]$node.GetAttribute('font-size')*$scale
            $x = [double]$node.x*$scale
            $y = [double]$node.y*$scale
            $centered = $node.GetAttribute('text-anchor') -eq 'middle'
            $width = if ($centered) { 450 } else { [Math]::Max(40, $node.InnerText.Length*$fontSize*0.65) }
            $left = if ($centered) { $x - $width/2 } else { $x }
            $shapeText = $slide.Shapes.AddTextbox(1, $left, $y-$fontSize*1.05, $width, $fontSize*1.8)
            $shapeText.TextFrame.MarginLeft = 0
            $shapeText.TextFrame.MarginRight = 0
            $shapeText.TextFrame.MarginTop = 0
            $shapeText.TextFrame.MarginBottom = 0
            $shapeText.TextFrame.TextRange.Text = $node.InnerText
            $shapeText.TextFrame.TextRange.Font.Name = 'Arial'
            $shapeText.TextFrame.TextRange.Font.Size = $fontSize
            $shapeText.TextFrame.TextRange.Font.Color.RGB = 0
            if ($node.GetAttribute('font-weight') -eq 'bold') { $shapeText.TextFrame.TextRange.Font.Bold = -1 }
            $shapeText.TextFrame.TextRange.ParagraphFormat.Alignment = if ($centered) { 2 } else { 1 }
            if (-not $centered) { $shapeText.Fill.Visible = -1; $shapeText.Fill.ForeColor.RGB = 16777215 }
        }
        if ($null -ne $shape) {
            $shape.Fill.ForeColor.RGB = 16777215
            $shape.Line.ForeColor.RGB = 0
            $shape.Line.Weight = 1.1
        }
    }
    return $slide
}

$app = New-Object -ComObject PowerPoint.Application
try {
    $decks = @(
        @{ Name = 'system-flowchart-bw.ppt'; Files = @('system-flowchart-bw.svg') },
        @{ Name = 'user-flowchart-bw.ppt'; Files = @('user-flowchart-bw.svg') },
        @{ Name = 'flowcharts-bw.ppt'; Files = @('system-flowchart-bw.svg', 'user-flowchart-bw.svg') }
    )
    foreach ($deck in $decks) {
        $presentation = $app.Presentations.Add(0)
        try {
            $presentation.PageSetup.SlideWidth = 486
            $presentation.PageSetup.SlideHeight = 675
            foreach ($file in $deck.Files) { $null = Add-FlowchartSlide $presentation (Join-Path $outputDir $file) }
            $target = Join-Path $outputDir $deck.Name
            $presentation.SaveAs($target, 1)
            Write-Output "Created $target ($($presentation.Slides.Count) slides)"
        } finally { $presentation.Close() }
    }
    foreach ($deck in $decks) {
        $check = $app.Presentations.Open((Join-Path $outputDir $deck.Name), -1, 0, 0)
        try { Write-Output "Verified $($deck.Name): $($check.Slides.Count) slides, $($check.Slides.Item(1).Shapes.Count) editable shapes on first slide" }
        finally { $check.Close() }
    }
} finally {
    $app.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}
