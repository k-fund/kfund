# === 1. JS 파일 IBN 브랜드 치환 ===
$jsFiles = Get-ChildItem -Path 'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/js' -Filter '*.js'

foreach ($file in $jsFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $orig = $content

    $content = $content.Replace('IBN 관리자', 'K-자금컴퍼니 관리자')
    $content = $content.Replace('IBN 컴포넌트', 'K-자금컴퍼니 컴포넌트')
    $content = $content.Replace('IBN 방문통계', 'K-자금컴퍼니 방문통계')
    $content = $content.Replace('IBN 대시보드', 'K-자금컴퍼니 대시보드')
    $content = $content.Replace('IBN 접수내역', 'K-자금컴퍼니 접수내역')
    $content = $content.Replace('IBN_접수내역_', 'K자금컴퍼니_접수내역_')
    $content = $content.Replace('IBN 설정', 'K-자금컴퍼니 설정')
    $content = $content.Replace('IBN 인증', 'K-자금컴퍼니 인증')
    $content = $content.Replace("'IBN'", "'K-자금컴퍼니'")
    $content = $content.Replace('"IBN"', '"K-자금컴퍼니"')
    # Generic IBN replacement (last)
    $content = $content.Replace('IBN', 'K-자금컴퍼니')

    # Logo URL
    $content = $content.Replace('https://pub-5adc3ecd20c347cfb03e96cae9ceb623.r2.dev/images/logo-light.png', 'images/logo-light.png')
    $content = $content.Replace('https://pub-5adc3ecd20c347cfb03e96cae9ceb623.r2.dev/images/logo-dark.png', 'images/logo-dark.png')

    # Contact info
    $content = $content.Replace('1522-7494', '1844-0239')
    $content = $content.Replace('hj.kim@urbane-gp.com', 'ni5720@daum.net')

    [System.IO.File]::WriteAllText($file.FullName, $content, (New-Object System.Text.UTF8Encoding $false))

    if ($content -ne $orig) {
        Write-Host "JS Changed: $($file.Name)"
    }
}

# === 2. R2 CDN URL - 로고만 로컬로 (블로그 썸네일은 유지) ===
$htmlFiles = Get-ChildItem -Path 'F:/pola_homepage/15.26_1th_kimeunhee_kmoney' -Filter '*.html' -Recurse |
    Where-Object { $_.FullName -notmatch 'node_modules|wireframe|color-guide|docs\\' }

foreach ($file in $htmlFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $orig = $content

    # R2 로고 URL만 로컬로 (이미지 board 것은 유지)
    $content = $content.Replace('https://pub-5adc3ecd20c347cfb03e96cae9ceb623.r2.dev/images/logo-light.png', 'images/logo-light.png')
    $content = $content.Replace('https://pub-5adc3ecd20c347cfb03e96cae9ceb623.r2.dev/images/logo-dark.png', 'images/logo-dark.png')
    $content = $content.Replace('https://pub-5adc3ecd20c347cfb03e96cae9ceb623.r2.dev/logo_dark.png', 'images/logo-dark.png')

    # JJK 파트너십 로고 URL 제거 (다른 회사 로고)
    $content = $content.Replace('https://pub-1872e954c9da49929650d78642a05e08.r2.dev/images/jjk-logo.png', '')

    [System.IO.File]::WriteAllText($file.FullName, $content, (New-Object System.Text.UTF8Encoding $false))

    if ($content -ne $orig) {
        $rel = $file.FullName -replace '.*15.26_1th_kimeunhee_kmoney\\', ''
        Write-Host "R2 Fixed: $rel"
    }
}

# === 3. package.json ===
$pkg = [System.IO.File]::ReadAllText('F:/pola_homepage/15.26_1th_kimeunhee_kmoney/package.json', [System.Text.Encoding]::UTF8)
$pkg = $pkg.Replace('"IBN 홈페이지"', '"K-자금컴퍼니 홈페이지"')
$pkg = $pkg.Replace('"IBN"', '"K-자금컴퍼니"')
$pkg = $pkg.Replace('IBN', 'K-자금컴퍼니')
[System.IO.File]::WriteAllText('F:/pola_homepage/15.26_1th_kimeunhee_kmoney/package.json', $pkg, (New-Object System.Text.UTF8Encoding $false))
Write-Host "package.json updated"

# === 4. .env.example ===
$env = [System.IO.File]::ReadAllText('F:/pola_homepage/15.26_1th_kimeunhee_kmoney/.env.example', [System.Text.Encoding]::UTF8)
$env = $env.Replace('IBN (고파도) - 김현준 대표', 'K-자금컴퍼니 (케이(k)-자금 컴퍼니) - 김은희 대표')
$env = $env.Replace('IBN', 'K-자금컴퍼니')
$env = $env.Replace('1522-7494', '1844-0239')
[System.IO.File]::WriteAllText('F:/pola_homepage/15.26_1th_kimeunhee_kmoney/.env.example', $env, (New-Object System.Text.UTF8Encoding $false))
Write-Host ".env.example updated"

# === 5. OG 파일 Green → Blue ===
$ogFiles = Get-ChildItem -Path 'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/og' -Filter '*.html'
foreach ($file in $ogFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $orig = $content

    $content = $content.Replace('rgba(107,168,141', 'rgba(74,137,181')
    $content = $content.Replace('rgba(107, 168, 141', 'rgba(74, 137, 181')
    $content = $content.Replace('rgba(143,191,168', 'rgba(123,186,214')
    $content = $content.Replace('rgba(143, 191, 168', 'rgba(123, 186, 214')
    $content = $content.Replace('#6BA88D', '#4A89B5')
    $content = $content.Replace('#4E8A6F', '#3A7099')
    $content = $content.Replace('#124330', '#142240')
    $content = $content.Replace('#000000', '#1C2D4F')
    $content = $content.Replace('IBN', 'K-자금컴퍼니')
    $content = $content.Replace('1522-7494', '1844-0239')

    [System.IO.File]::WriteAllText($file.FullName, $content, (New-Object System.Text.UTF8Encoding $false))

    if ($content -ne $orig) {
        Write-Host "OG Fixed: $($file.Name)"
    }
}

Write-Host "`n=== All fixes complete ==="
