$targetFiles = @(
    'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/index.html',
    'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/about.html',
    'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/fund.html',
    'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/service.html',
    'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/process.html',
    'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/marketing.html',
    'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/post.html',
    'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/privacy.html',
    'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/policy.html'
)

$totalChanges = 0

foreach ($f in $targetFiles) {
    $content = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
    $orig = $content

    # Background solid black
    $content = $content.Replace('background: #000000', 'background: #0F1B2D')
    $content = $content.Replace('background-color: #000000', 'background-color: #0F1B2D')
    $content = $content.Replace('background:#000000', 'background:#0F1B2D')
    $content = $content.Replace('background: #000;', 'background: #0F1B2D;')

    # Gradient blacks
    $content = $content.Replace('#000000 0%', '#0F1B2D 0%')
    $content = $content.Replace('#000000 50%', '#142240 50%')
    $content = $content.Replace('#000000 100%', '#1C2D4F 100%')

    # Glass white -> blue glass
    $content = $content.Replace('rgba(255, 255, 255, 0.05)', 'rgba(42, 64, 102, 0.25)')
    $content = $content.Replace('rgba(255, 255, 255, 0.08)', 'rgba(42, 64, 102, 0.35)')
    $content = $content.Replace('rgba(255, 255, 255, 0.1)', 'rgba(74, 137, 181, 0.15)')
    $content = $content.Replace('rgba(255, 255, 255, 0.15)', 'rgba(168, 212, 232, 0.15)')
    $content = $content.Replace('rgba(255, 255, 255, 0.25)', 'rgba(168, 212, 232, 0.3)')
    $content = $content.Replace('rgba(255, 255, 255, 0.2)', 'rgba(168, 212, 232, 0.2)')
    $content = $content.Replace('rgba(255, 255, 255, 0.3)', 'rgba(168, 212, 232, 0.35)')

    # Color property blacks
    $content = $content.Replace('color: #000000', 'color: #1C2D4F')
    $content = $content.Replace('color: #000;', 'color: #1C2D4F;')
    $content = $content.Replace('border-color: #000', 'border-color: #1C2D4F')

    # Save
    [System.IO.File]::WriteAllText($f, $content, (New-Object System.Text.UTF8Encoding $false))

    $basename = [System.IO.Path]::GetFileName($f)
    if ($content -ne $orig) {
        $totalChanges++
        Write-Host "Changed: $basename"
    } else {
        Write-Host "No change: $basename"
    }
}

Write-Host "`nTotal files changed: $totalChanges"
