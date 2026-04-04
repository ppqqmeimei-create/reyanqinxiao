import sys, re
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

fixes = 0

# Line 2664: label and protection strings missing closing quote
i = 2663
old = lines[i]
# Check by hex: label: ' starts at some position
# Pattern: label: 'xxxxx, (missing closing quote)
bs = old.encode('utf-8')
if b"label: '" in bs and bs.count(b"'") % 2 != 0:
    # Fix: replace the malformed strings
    new = old.replace("label: '?????,", "label: '执法案件',", 1)
    new = new.replace(", icon: '??',", ", icon: '执',", 1)
    new = new.replace(", protection: '?????,", ", protection: '一级',", 1)
    if new != old:
        lines[i] = new
        fixes += 1
        print('Fixed L2664')

# Line 5647: concat with missing ;
i = 5646
old = lines[i]
# Check for \t after // comment marker (the tab separator)
bs = old.encode('utf-8')
if b'// ' in bs and b'\t' in bs:
    # Find where the tab is after the //
    idx = bs.find(b'\t')
    # Check if there's an identifier pattern after the tab
    remaining = bs[idx:]
    if remaining.startswith(b'\t') and re.match(b'\t[a-zA-Z]', remaining):
        # Split here
        lines[i] = bs[:idx].decode('utf-8') + '\n'
        lines[i+1] = remaining.decode('utf-8')
        fixes += 1
        print('Fixed L5647')
    else:
        print('L5647: tab not after // comment')
else:
    print('L5647: no concat pattern found, hex=' + bs.hex()[:60])

# Line 5910: space in icon path
i = 5909
old = lines[i]
if b'/static/ cons/' in old.encode('utf-8'):
    lines[i] = old.replace(b'/static/ cons/').decode('utf-8')
    fixes += 1
    print('Fixed L5910')

# Line 9790: missing quotes in ternary string - use hex search
i = 9789
old = lines[i]
bs = old.encode('utf-8')
# Search for ternary with space after ?
# Pattern in hex: 3f 27 20 ... 3f 3a 27 20 ... 27
# The string ? ' ???? : ' ????  is corrupted
# Let's find the pattern
# The label ' 已关闭' would be: e5 b7 b2 e5 85 853f e5 bc 80
# The corrupted pattern ? ' (3f 27 20) should NOT appear in valid strings
# Replace any pattern where quotes are clearly missing
# Find: , icon: '??', protection: '
# Use: replace label: '?????, with label: '执法案件',
# But let's do it by hex
if b"? ' " in bs or b"': '" in bs:
    print('L9790 has malformed ternary: ' + bs.hex()[:80])

open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'w', encoding='utf-8').writelines(lines)
print('Total fixes: ' + str(fixes))