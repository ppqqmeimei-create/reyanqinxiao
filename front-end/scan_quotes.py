import sys, re
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

# Check for lines with odd single quote count in script section (1319-11237)
print('=== Lines with odd single-quote count in script (1319-11237) ===')
problems = []
for i in range(1318, 11237):
    l = lines[i].rstrip()
    if not l:
        continue
    s = l.lstrip()
    # Skip pure comment lines
    if s.startswith('//') or s.startswith('*'):
        continue

    sq = l.count("'")
    dq = l.count('"')
    if sq % 2 != 0:
        print('Line ' + str(i+1) + ' [sq=' + str(sq) + ']: ' + repr(l[:100]))
        problems.append(i)
    elif dq % 2 != 0:
        print('Line ' + str(i+1) + ' [dq=' + str(dq) + ']: ' + repr(l[:100]))
        problems.append(i)

print()
print('Total problematic lines: ' + str(len(problems)))

# Also check for lines with missing comma before identifier (statement concat)
print()
print('=== Lines ending with , where next line starts with identifier ===')
for i in range(1318, 11237):
    l = lines[i].rstrip()
    if not l or l.endswith(','):
        continue
    j = i + 1
    while j < len(lines) and not lines[j].rstrip():
        j += 1
    if j >= len(lines):
        continue
    next_l = lines[j].rstrip()
    if not next_l:
        continue
    s_next = next_l.lstrip()
    # Skip comments
    if s_next.startswith('//') or s_next.startswith('*') or s_next.startswith('}'):
        continue
    # Check if line ends with } and next starts with identifier (no ; separator)
    if re.search(r'[;\{]\s*$', l) and re.match(r"\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=\s", next_l):
        # This might be a concat issue
        if not l.endswith(';'):
            print('L' + str(i+1) + ' ends=' + repr(l[-30:]) + ' next=' + repr(next_l[:40]))