import sys, re
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

# Look at specific suspicious lines for syntax issues
suspicious = [
    2663,   # label:'?????, (missing closing quote)
    2664,   # protection:'?????, (missing closing quote)
    5630,   # async function handleCategoryChange
    5646,   # line before concat
    5647,   # concat with missing ; and next statement
    5909,   # fooddrug marker space in id
    5910,   # /static/ cons/drug.png
    5917,   # id: 2 3
    5957,   # lng: 109. 200
    8389,   # complex border/district string concat
    9790,   # labels[key] + ... concat issue
]

for i in suspicious:
    idx = i - 1
    print('L' + str(i) + ': ' + repr(lines[idx]))

print()
print('=== Checking for lines where comma/; might be missing ===')
# Check for lines ending with , without proper continuation
for i in range(1318, 11237):
    l = lines[i].rstrip()
    if l.endswith(',') and not l.endswith(',,') and not l.endswith(',,'):
        # Check if the NEXT non-empty line starts with something that looks like continuation
        j = i + 1
        while j < len(lines) and lines[j].strip() == '':
            j += 1
        if j < len(lines):
            next_l = lines[j].rstrip()
            # Check for obvious concat: }id: or }{id: or just id: after }
            if re.match(r"\s*\{.*\}id:", next_l) or re.match(r"\s*\{.*\}\{", next_l) or re.match(r"\s*\{", next_l):
                # This might be fine (array of objects)
                pass
            elif re.match(r"\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=", next_l) and not l.endswith('=,'):
                print('L' + str(i+1) + ' ends with , but next line starts with assignment: ' + repr(next_l[:60]))
            elif re.match(r"\s*\}", next_l) or re.match(r"\s*\]", next_l):
                # Fine - it's end of block
                pass
            elif re.match(r"\s*//", next_l) or re.match(r"\s*\*", next_l):
                # Comment - fine
                pass
            elif re.match(r"\s*\}", l) and re.match(r"\s*[a-zA-Z_]", next_l):
                print('L' + str(i+1) + ' ends with } but next starts with identifier: ' + repr(next_l[:60]))