$targetFiles = Get-ChildItem -Path 'F:/pola_homepage/15.26_1th_kimeunhee_kmoney' -Filter '*.html' -Recurse |
    Where-Object { $_.FullName -notmatch 'node_modules|wireframe|color-guide|employee-card|mobile-card|og-image\.html|docs\\|og\\' }

$totalChanges = 0

foreach ($file in $targetFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $orig = $content

    # === Solid #000000 in all contexts ===
    # gradient endpoints
    $content = $content.Replace(', #000000)', ', #0F1B2D)')
    $content = $content.Replace(', #000000 ', ', #0F1B2D ')
    $content = $content.Replace('#000000;', '#1C2D4F;')
    $content = $content.Replace('#000000,', '#1C2D4F,')
    # remaining #000000
    $content = $content.Replace('#000000', '#1C2D4F')

    # #333333 (dark gray used with black) -> navy light
    $content = $content.Replace('#333333', '#2A4066')
    $content = $content.Replace('#333;', '#2A4066;')

    # #1A1A1A (near-black text) -> navy dark
    $content = $content.Replace('#1A1A1A', '#1C2D4F')
    $content = $content.Replace('#1a1a1a', '#1C2D4F')

    # Custom properties that were set to black
    $content = $content.Replace('--ibn-navy: #1C2D4F', '--ibn-navy: #1C2D4F')
    $content = $content.Replace('--footer-navy: #1C2D4F', '--footer-navy: #1C2D4F')

    # #F5F5F5 (light gray bg on dark sections) -> light blue
    # Only in form/contact areas - keep as-is for now (it's a light bg)

    # Remaining rgba white glass patterns
    $content = $content.Replace('rgba(255, 255, 255, 0.04)', 'rgba(42, 64, 102, 0.2)')
    $content = $content.Replace('rgba(255, 255, 255, 0.06)', 'rgba(42, 64, 102, 0.25)')
    $content = $content.Replace('rgba(255, 255, 255, 0.12)', 'rgba(74, 137, 181, 0.15)')
    $content = $content.Replace('rgba(255, 255, 255, 0.35)', 'rgba(168, 212, 232, 0.4)')

    # Save
    [System.IO.File]::WriteAllText($file.FullName, $content, (New-Object System.Text.UTF8Encoding $false))

    $basename = $file.Name
    if ($content -ne $orig) {
        $totalChanges++
        Write-Host "Changed: $($file.FullName -replace '.*15.26_1th_kimeunhee_kmoney\\', '')"
    }
}

Write-Host "`nTotal files changed: $totalChanges"

# Verify remaining
Write-Host "`n=== Remaining #000000 check ==="
foreach ($file in $targetFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $matches = [regex]::Matches($content, '#000000|#000[^0-9a-fA-F]')
    if ($matches.Count -gt 0) {
        $basename = $file.Name
        Write-Host "$basename : $($matches.Count) remaining"
    }
}
Write-Host "=== Done ==="
