import sys, re
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

fixes = 0

# Line 2664: label and protection strings missing closing quote
i = 2663
old = lines[i]
# Check by looking at the raw hex
bs = old.encode('utf-8')
print('L2664: ' + bs.hex())
print('L2664: ' + repr(old))
# The line contains unclosed string: label: '?????, (ends at , not ')
# Also protection: '?????, (same issue)
# Pattern: after label: ' is text then , not '
# After protection: ' is text then , not '
# Check if there are unclosed quotes
sq = bs.count(b"'")
print('Single quotes in L2664: ' + str(sq))
# Since sq is odd, there's an unclosed string
# Let's just fix by replacing the known bad patterns
# label: '?????, -> label: '执法案件',
# protection: '?????, -> protection: '一级',
# icon: '??', -> icon: '???',
new = old
new = new.replace("label: '?????,", "label: '执法案件',")
new = new.replace("icon: '??',", "icon: '???',")
new = new.replace("protection: '?????,", "protection: '一级',")
if new != old:
    lines[i] = new
    fixes += 1
    print('Fixed L2664')
else:
    print('L2664: no pattern match')

# Line 5910: space in icon path
i = 5909
old = lines[i]
if '/static/ cons/' in old:
    lines[i] = old.replace('/static/ cons/', '/static/icons/drug')
    fixes += 1
    print('Fixed L5910')
else:
    print('L5910: hex=' + old.encode('utf-8').hex()[:80])

# Line 8389: look at it
print()
print('Lines 8389-8392:')
for j in range(8388, 8392):
    print('L' + str(j+1) + ': ' + repr(lines[j]))
    print('     hex: ' + lines[j].encode('utf-8').hex())

# Also check 5917 (id: 2 3) and 5957 (lng: 109. 200)
print()
print('Lines 5917, 5957:')
for j in [5916, 5956]:
    print('L' + str(j+1) + ': ' + repr(lines[j]))
    print('     hex: ' + lines[j].encode('utf-8').hex())

open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'w', encoding='utf-8').writelines(lines)
print()
print('Total fixes: ' + str(fixes))