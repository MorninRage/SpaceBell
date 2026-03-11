#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# Read the file
with open('game.js', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Count before
count_before = {
    'arrow': len(re.findall(r'â†'', content)),
    'arrow_unicode': len(re.findall(r'\u2192', content)),
}

print(f'Before: {count_before}')

# Replace corrupted sequences
# The arrow character â†' is actually 3 bytes: E2 86 92 in UTF-8
replacements = [
    ('â†'', '→'),  # Corrupted arrow
    ('Î¨', 'Ψ'),   # Capital Psi
    ('Ïˆ', 'ψ'),   # Lowercase psi
    ('Â²', '²'),   # Superscript 2
    ('â€¢', '•'),  # Bullet
    ('Ï„', 'τ'),   # Tau
]

total = 0
for old, new in replacements:
    count = content.count(old)
    if count > 0:
        content = content.replace(old, new)
        total += count
        print(f'Replaced {count} instances of "{old}" with "{new}"')

print(f'\nTotal replacements: {total}')

# Write back
with open('game.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('File updated!')

# Verify
count_after = {
    'arrow': len(re.findall(r'â†'', content)),
}
print(f'Remaining corrupted arrows: {count_after}')
