import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

# Fix all lines with unclosed strings (odd single-quote count)
# These are lines where the string value is not closed

fixes = 0

# Line 3024 (index 3023): layerDrawerTitle.value = '?????'
i = 3023
old = lines[i]
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    lines[i] = old.rstrip() + "'\n"
    fixes += 1
    print('Fixed L3024')

# Line 3112 (index 3111): layerDrawerTitle.value = '?????????'
i = 3111
old = lines[i]
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    lines[i] = old.rstrip() + "'\n"
    fixes += 1
    print('Fixed L3112')

# Line 3240 (index 3239): layerDrawerTitle.value = '???????'
i = 3239
old = lines[i]
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    lines[i] = old.rstrip() + "'\n"
    fixes += 1
    print('Fixed L3240')

# Line 7503 (index 7502): title: '????,' - unclosed with comma
i = 7502
old = lines[i]
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    new_str = old.rstrip()[:-1] + "'\n"
    lines[i] = new_str
    fixes += 1
    print('Fixed L7503')

# Line 7511 (index 7510): content: '???????????????,'
i = 7510
old = lines[i]
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    new_str = old.rstrip()[:-1] + "'\n"
    lines[i] = new_str
    fixes += 1
    print('Fixed L7511')

# Line 7751 (index 7750): content: '???????????,'
i = 7750
old = lines[i]
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    new_str = old.rstrip()[:-1] + "'\n"
    lines[i] = new_str
    fixes += 1
    print('Fixed L7751')

# Line 8415 (index 8414): content template literal with unclosed
i = 8414
old = lines[i]
print('L8415: ' + repr(old))
print('Hex: ' + old.encode('utf-8').hex())
# The line ends with ...\\n?????' - missing closing ` and ,
# Let's look at what it should end with
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    print('  ends with unclosed quote')
# Fix: close with `, then newline
new_str = old.rstrip() + "',\n"
lines[i] = new_str
fixes += 1
print('Fixed L8415')

# Line 8575 (index 8574): ctrl.risk_score > 0  ? `????${ctrl.risk_score}??` : '??
i = 8574
old = lines[i]
print('L8575: ' + repr(old))
print('Hex: ' + old.encode('utf-8').hex())
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    # Should end with '?????'
    new_str = old.rstrip()[:-1] + "?????'\n"
    lines[i] = new_str
    fixes += 1
    print('Fixed L8575')

# Line 9462 (index 9461): protection_level === '国家一级)
i = 9461
old = lines[i]
print('L9462: ' + repr(old))
bs = old.encode('utf-8')
if "'国家一级)" in old:
    new_str = old.replace("'国家一级)", "'国家一级')")
    lines[i] = new_str
    fixes += 1
    print('Fixed L9462')

# Line 9950 (index 9949): title: '?????,'
i = 9949
old = lines[i]
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    new_str = old.rstrip()[:-1] + "'\n"
    lines[i] = new_str
    fixes += 1
    print('Fixed L9950')

# Line 9958 (index 9957): content: '?????????????,'
i = 9957
old = lines[i]
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    new_str = old.rstrip()[:-1] + "'\n"
    lines[i] = new_str
    fixes += 1
    print('Fixed L9958')

# Line 9966 (index 9965): confirmText: '????,'
i = 9965
old = lines[i]
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    new_str = old.rstrip()[:-1] + "'\n"
    lines[i] = new_str
    fixes += 1
    print('Fixed L9966')

# Line 10126 (index 10125): title: '????/?????,'
i = 10125
old = lines[i]
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    new_str = old.rstrip()[:-1] + "'\n"
    lines[i] = new_str
    fixes += 1
    print('Fixed L10126')

# Line 10430 (index 10429): title: '????/?????,'
i = 10429
old = lines[i]
bs = old.encode('utf-8')
if bs.rstrip().endswith(b"'"):
    new_str = old.rstrip()[:-1] + "'\n"
    lines[i] = new_str
    fixes += 1
    print('Fixed L10430')

open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'w', encoding='utf-8').writelines(lines)
print('Total fixes: ' + str(fixes))