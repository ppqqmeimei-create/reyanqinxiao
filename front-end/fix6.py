import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

fixes = 0

def fix_line_ending_quote(idx, extra_close=None):
    """Fix lines where a string is not closed at the end."""
    global fixes
    old = lines[idx]
    bs = old.encode('utf-8')
    # Line ends with ' followed by \n - missing closing quote
    if bs.rstrip().endswith(b"'"):
        new = old.rstrip() + (extra_close or "'") + '\n'
        lines[idx] = new
        fixes += 1
        print('Fixed L' + str(idx+1) + ': ' + repr(new[-40:]))
        return True
    return False

def fix_line_by_hex(idx, old_hex, new_str):
    """Replace specific hex bytes in a line."""
    global fixes
    old = lines[idx]
    bs = old.encode('utf-8')
    if old_hex in bs.hex():
        new = old.replace(bytes.fromhex(old_hex).decode('utf-8', errors='replace'), new_str, 1)
        lines[idx] = new
        fixes += 1
        print('Fixed L' + str(idx+1) + ' by hex')
        return True
    return False

# Line 3024 (idx 3023): ends with "= '?????" (unclosed)
# hex: 203d20273f3f3f3f3f3f0a -> = '??????\n
# Pattern: = '??????  -> close quote
fix_line_ending_quote(3023)

# Line 3112 (idx 3111): ends with = '?????????  (unclosed)
fix_line_ending_quote(3111)

# Line 3240 (idx 3239): ends with = '???????  (unclosed)
fix_line_ending_quote(3239)

# Line 7503 (idx 7502): title: '????,' - unclosed with comma
# ends: 3a20273f3f3f3f3f2c0a -> ': '????',\n
fix_line_ending_quote(7502)

# Line 7511 (idx 7510): content: '???????????????,'
fix_line_ending_quote(7510)

# Line 7751 (idx 7750): content: '???????????,'
fix_line_ending_quote(7750)

# Line 8575 (idx 8574): ctrl.risk_score > 0  ? `????${ctrl.risk_score}??` : '??
# ends: 3f3f60203a20273f3f0a -> ??` : '???'\n
# The string is: `????${ctrl.risk_score}??` : '??  (unclosed)
# Should be: `????${ctrl.risk_score}??` : '暂无'
i = 8574
old = lines[i]
# Replace the unclosed tail
if old.rstrip().endswith("'??\n") or "'??\n" in old:
    new = old.replace("'??\n", "???'\n", 1)
    lines[i] = new
    fixes += 1
    print('Fixed L8575')

# Line 9950 (idx 9949): title: '?????,'
fix_line_ending_quote(9949)

# Line 9958 (idx 9957): content: '?????????????,'
fix_line_ending_quote(9957)

# Line 9966 (idx 9965): confirmText: '????,'
fix_line_ending_quote(9965)

# Line 10126 (idx 10125): title: '????/?????,'
fix_line_ending_quote(10125)

# Line 10430 (idx 10429): title: '????/?????,'
fix_line_ending_quote(10429)

open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'w', encoding='utf-8').writelines(lines)
print()
print('Total fixes: ' + str(fixes))