import sys, re
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

# 1) Scan for }id: or }icon: or }text: or }color: patterns (missing comma before closing brace)
print('=== Concat patterns (missing comma before } next item) ===')
concat_lines = []
for i, l in enumerate(lines):
    if re.search(r'\}[a-z]', l) and '}id:' in l or '}icon:' in l or '}text:' in l or '}color:' in l:
        # Check if there's a comma or newline before }id
        pos = None
        for pat in ['}id:', '}icon:', '}text:', '}color:']:
            if pat in l:
                pos = l.find(pat)
                break
        if pos is not None:
            # Is there a comma, space, or tab before the }?
            ch_before = l[pos-1] if pos > 0 else ''
            if ch_before not in (',', ' ', '\t', '\n'):
                print('Line ' + str(i+1) + ': ' + repr(l.rstrip()))
                concat_lines.append(i)

print()
print('Total concat lines found: ' + str(len(concat_lines)))

# 2) Scan for ???? pattern (corrupted/missing Chinese chars)
print()
print('=== Lines with ???? (likely missing Chinese text) ===')
for i, l in enumerate(lines):
    if '????' in l or '??' in l:
        s = l.strip()
        # Filter out template comments that are just decorative
        if s.startswith('<!--') or s.startswith('*') or s.startswith('//'):
            continue
        # Check if it's in a meaningful context
        if re.search(r'["\'].*?\?\?\?\?.*?["\']', l):
            print('Line ' + str(i+1) + ': ' + repr(l.rstrip()[:100]))