import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

fixes = 0

# Lines ending with 3f3f3f3f0a (4 question marks + newline = unclosed string, no comma)
# Line 3024: layerDrawerTitle.value = '???' -> layerDrawerTitle.value = '图层选择'
# Line 3112: layerDrawerTitle.value = '??????' -> layerDrawerTitle.value = '图层选择'
# Line 3240: layerDrawerTitle.value = '???' -> layerDrawerTitle.value = '数据选择'
fixes_map = {
    3023: ('3f3f3f3f0a', "3f3f3f3f0a"),  # '???? -> '????'  (layerDrawerTitle = ?)
    3111: ('3f3f3f3f3f3f3f3f0a', "3f3f3f3f3f3f3f3f0a"),  # 8 q's -> '图层选择'
    3239: ('3f3f3f3f0a', "3f3f3f3f0a"),  # 4 q's -> '数据选择'
    # Lines ending with 3f3f3f2c0a (3 question marks + comma = unclosed string with comma)
    7502: ('3f3f3f2c0a', "3f3f3f2c0a"),  # title: '???, -> title: '案件类型',
    7510: ('3f3f3f2c0a', "3f3f3f2c0a"),  # content: '???????, -> content: '暂无数据',
    7750: ('3f3f3f2c0a', "3f3f3f2c0a"),  # content: '???????, -> content: '暂无数据',
    9950: ('3f3f3f2c0a', "3f3f3f2c0a"),  # title: '???????, -> title: '暂无案件',
    9957: ('3f3f3f2c0a', "3f3f3f2c0a"),  # content: '?????????, -> content: '暂无案件',
    9965: ('3f3f3f2c0a', "3f3f3f2c0a"),  # confirmText: '???, -> confirmText: '暂无',
    10125: ('3f3f3f2c0a', "3f3f3f2c0a"),  # title: '????/?????, -> title: '暂无/暂无',
    10429: ('3f3f3f2c0a', "3f3f3f2c0a"),  # title: '????/?????, -> title: '暂无/暂无',
    # Line 8575: 3f3f3f270a -> ??` : '??\n -> ??'` : '暂无'\n
    8574: ('3f3f3f270a', "3f3f3f270a"),
}

# Actually let me fix each line by replacing the corrupted bytes at the end
fixes_data = [
    # (index, old_suffix_bytes_hex, new_suffix)
    # Lines with 4 question marks + newline (no comma)
    (3023, '3f3f3f3f0a', "图\n"),  # layerDrawerTitle.value = '图
    (3111, '3f3f3f3f3f3f3f3f0a', "图层选择\n"),  # 8 chars
    (3239, '3f3f3f3f0a', "数据选择\n"),  # 4 chars
    # Lines with 3 question marks + comma + newline
    (7502, '3f3f3f2c0a', "案件类型',\n"),  # 3 chars + closing quote
    (7510, '3f3f3f2c0a', "暂无数据',\n"),
    (7750, '3f3f3f2c0a', "暂无数据',\n"),
    (9950, '3f3f3f2c0a', "暂无案件',\n"),
    (9957, '3f3f3f2c0a', "暂无案件',\n"),
    (9965, '3f3f3f2c0a', "暂无',\n"),
    (10125, '3f3f3f2c0a', "暂无/暂无',\n"),
    (10429, '3f3f3f2c0a', "暂无/暂无',\n"),
    # Line 8575: ends with 3f3f3f270a -> ???` : '??\n -> ???` : '暂无'\n
    (8574, '3f3f3f270a', "暂无'\n"),
]

for (idx, old_hex, new_suffix) in fixes_data:
    old = lines[idx]
    bs = old.encode('utf-8')
    old_suffix = bytes.fromhex(old_hex)
    if bs.endswith(old_suffix):
        new_bs = bs[:-len(old_suffix)] + new_suffix.encode('utf-8')
        lines[idx] = new_bs.decode('utf-8')
        fixes += 1
        print('Fixed L' + str(idx+1) + ': was=' + repr(old[-20:]) + ' now=' + repr(lines[idx][-20:]))
    else:
        print('L' + str(idx+1) + ': pattern not found, hex=' + bs.hex()[-20:])

open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'w', encoding='utf-8').writelines(lines)
print()
print('Total fixes: ' + str(fixes))