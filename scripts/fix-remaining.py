# -*- coding: utf-8 -*-
import os
import glob

BASE = r'F:\pola_homepage\15.26_1th_kimeunhee_kmoney'

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != original:
        with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)
        rel = os.path.relpath(filepath, BASE)
        print(f'Changed: {rel}')
        return True
    return False

# === 1. JS files ===
print('=== JS Files ===')
js_replacements = [
    ('https://pub-5adc3ecd20c347cfb03e96cae9ceb623.r2.dev/images/logo-light.png', 'images/logo-light.png'),
    ('https://pub-5adc3ecd20c347cfb03e96cae9ceb623.r2.dev/images/logo-dark.png', 'images/logo-dark.png'),
    ('1522-7494', '1844-0239'),
    ('hj.kim@urbane-gp.com', 'ni5720@daum.net'),
    ('IBN', 'K-\uc790\uae08\ucef4\ud37c\ub2c8'),  # K-자금컴퍼니
]
for f in glob.glob(os.path.join(BASE, 'js', '*.js')):
    replace_in_file(f, js_replacements)

# === 2. R2 CDN logo URLs in HTML ===
print('\n=== R2 CDN Logo URLs ===')
r2_replacements = [
    ('https://pub-5adc3ecd20c347cfb03e96cae9ceb623.r2.dev/images/logo-light.png', 'images/logo-light.png'),
    ('https://pub-5adc3ecd20c347cfb03e96cae9ceb623.r2.dev/images/logo-dark.png', 'images/logo-dark.png'),
    ('https://pub-5adc3ecd20c347cfb03e96cae9ceb623.r2.dev/logo_dark.png', 'images/logo-dark.png'),
    ('https://pub-1872e954c9da49929650d78642a05e08.r2.dev/images/jjk-logo.png', ''),
]
for pattern in ['*.html', 'admin/*.html', 'posts/*.html']:
    for f in glob.glob(os.path.join(BASE, pattern)):
        if any(skip in f for skip in ['wireframe', 'color-guide', 'node_modules']):
            continue
        replace_in_file(f, r2_replacements)

# === 3. package.json ===
print('\n=== Config Files ===')
replace_in_file(os.path.join(BASE, 'package.json'), [
    ('IBN', 'K-\uc790\uae08\ucef4\ud37c\ub2c8'),
])

# === 4. .env.example ===
replace_in_file(os.path.join(BASE, '.env.example'), [
    ('IBN', 'K-\uc790\uae08\ucef4\ud37c\ub2c8'),
    ('\uace0\ud30c\ub3c4', '\ucf00\uc774(k)-\uc790\uae08 \ucef4\ud37c\ub2c8'),  # 고파도 → 케이(k)-자금 컴퍼니
    ('\uae40\ud604\uc900', '\uae40\uc740\ud76c'),  # 김현준 → 김은희
    ('1522-7494', '1844-0239'),
])

# === 5. OG files - Green to Blue + IBN ===
print('\n=== OG Files ===')
og_replacements = [
    ('rgba(107,168,141', 'rgba(74,137,181'),
    ('rgba(107, 168, 141', 'rgba(74, 137, 181'),
    ('rgba(143,191,168', 'rgba(123,186,214'),
    ('rgba(143, 191, 168', 'rgba(123, 186, 214'),
    ('#6BA88D', '#4A89B5'),
    ('#4E8A6F', '#3A7099'),
    ('#124330', '#142240'),
    ('#000000', '#1C2D4F'),
    ('1522-7494', '1844-0239'),
    ('hj.kim@urbane-gp.com', 'ni5720@daum.net'),
    ('https://pub-5adc3ecd20c347cfb03e96cae9ceb623.r2.dev/images/logo-light.png', 'images/logo-light.png'),
    ('https://pub-5adc3ecd20c347cfb03e96cae9ceb623.r2.dev/images/logo-dark.png', 'images/logo-dark.png'),
    ('IBN', 'K-\uc790\uae08\ucef4\ud37c\ub2c8'),
]
for f in glob.glob(os.path.join(BASE, 'og', '*.html')):
    replace_in_file(f, og_replacements)

# === 6. Admin HTML files ===
print('\n=== Admin Files ===')
admin_replacements = [
    ('IBN', 'K-\uc790\uae08\ucef4\ud37c\ub2c8'),
    ('1522-7494', '1844-0239'),
    ('https://pub-5adc3ecd20c347cfb03e96cae9ceb623.r2.dev/images/logo-light.png', 'images/logo-light.png'),
]
for f in glob.glob(os.path.join(BASE, 'admin', '*.html')):
    replace_in_file(f, admin_replacements)

print('\n=== All fixes complete ===')
