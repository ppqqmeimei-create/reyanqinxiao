import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

fixes = 0

# Fix line 3024 (index 3023): layerDrawerTitle.value = '????? (unclosed string)
i = 3023
old = lines[i]
print('L3024: ' + repr(old))
print('Hex: ' + old.encode('utf-8').hex())
# Pattern: ends with ', (unclosed)
# Check if it ends with ' then newline (unclosed string)
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    new = old.rstrip() + "'\n"
    lines[i] = new
    fixes += 1
    print('Fixed L3024')

# Fix line 3112 (index 3111)
i = 3111
old = lines[i]
print('L3112: ' + repr(old))
if old.rstrip().endswith("'"):
    new = old.rstrip() + "'\n"
    lines[i] = new
    fixes += 1
    print('Fixed L3112')

# Fix line 3240 (index 3239)
i = 3239
old = lines[i]
print('L3240: ' + repr(old))
if old.rstrip().endswith("'"):
    new = old.rstrip() + "'\n"
    lines[i] = new
    fixes += 1
    print('Fixed L3240')

# Fix line 9462 (index 9461): unclosed string at end of line
i = 9461
old = lines[i]
print('L9462: ' + repr(old))
print('Hex: ' + old.encode('utf-8').hex())
# The line ends with '国家一级) -> missing closing quote
# Should be: protection_level === '国家一级'
if old.rstrip().endswith("'国家一级)"):
    new = old.rstrip()[:-1] + "国家一级')\n"
    lines[i] = new
    fixes += 1
    print('Fixed L9462')
elif "'国家一级)" in old:
    new = old.replace("'国家一级)", "'国家一级')")
    lines[i] = new
    fixes += 1
    print('Fixed L9462')

open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'w', encoding='utf-8').writelines(lines)
print('Fixes so far: ' + str(fixes))