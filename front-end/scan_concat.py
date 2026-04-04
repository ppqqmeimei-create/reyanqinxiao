import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

# Scan for lines that look like: }id: or }{id: (concatenated object entries)
import re
print('=== Lines with }id: pattern (likely concatenated) ===')
for i, l in enumerate(lines):
    if '}id:' in l or '}{id:' in l:
        print('Line ' + str(i+1) + ': ' + repr(l.rstrip()))

print()
print('=== Lines with odd curly brace patterns ===')
# Also scan for lines that have unbalanced {} with content
for i, l in enumerate(lines):
    s = l.rstrip()
    if '{' in s and '}' in s:
        # Check if } is immediately followed by {
        if '}{' in s:
            print('Line ' + str(i+1) + ' (}{): ' + repr(s))
        # Check if } is immediately followed by id:
        if re.search(r'\}[a-z]', s) and '}id' not in s:
            pass  # fine
        elif re.search(r'\}id', s):
            # Check if preceded by comma - if not, likely concatenated
            pos = s.find('}id')
            if pos > 0 and s[pos-1] not in (',', ' ', '\t'):
                print('Line ' + str(i+1) + ' (no comma before }id): ' + repr(s))