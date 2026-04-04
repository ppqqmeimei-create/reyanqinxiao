import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

fixes = 0

# Fix each line by finding the corrupted part and replacing it
# Format: (index, bytes_to_remove, bytes_to_add)

fixes_data = [
    # Lines with unclosed strings ending in newlines (no comma): replace "?\n" with "???('\n"
    (3023, "3f3f3f3f0a", "暂无'\n"),       # L3024: layerDrawerTitle.value = '????
    (3111, "3f3f3f3f3f3f3f3f0a", "暂无'\n"),  # L3112: layerDrawerTitle.value = '????????
    (3239, "3f3f3f3f0a", "暂无'\n"),       # L3240: layerDrawerTitle.value = '????
    # Lines with unclosed strings ending with comma+newline: replace "???,\n" with "???',\n"
    (7502, "3f3f3f2c0a", "暂无',\n"),       # L7503: title: '???,
    (7510, "3f3f3f2c0a", "暂无',\n"),       # L7511: content: '?????????,
    (7750, "3f3f3f2c0a", "暂无',\n"),       # L7751: content: '?????????,
    (9950, "3f3f3f2c0a", "暂无',\n"),       # L9950: title: '?????,
    (9957, "3f3f3f2c0a", "暂无',\n"),       # L9958: content: '????????,
    (9965, "3f3f3f2c0a", "暂无',\n"),       # L9966: confirmText: '???,
    (10125, "3f3f2c0a", "暂无',\n"),        # L10126: title: '????/????,
    (10429, "3f3f2c0a", "暂无',\n"),        # L10430: title: '????/????,
    # Line 8575: ctrl.risk_score > 0  ? `????${ctrl.risk_score}??` : '??
    (8574, "3f3f3f270a", "暂无'\n"),       # L8575: : '???\n
]

for (idx, old_hex, new_suffix) in fixes_data:
    old = lines[idx]
    bs = old.encode('utf-8')
    old_suffix = bytes.fromhex(old_hex)
    if bs.endswith(old_suffix):
        new_bs = bs[:-len(old_suffix)] + new_suffix.encode('utf-8')
        lines[idx] = new_bs.decode('utf-8')
        fixes += 1
        print('Fixed L' + str(idx+1))
    else:
        print('L' + str(idx+1) + ': pattern not found, hex_end=' + bs.hex()[-30:])

open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'w', encoding='utf-8').writelines(lines)
print()
print('Total fixes: ' + str(fixes))