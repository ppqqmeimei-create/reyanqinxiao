import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

# Fix L9950 (1-indexed) = index 9949: title: '????????,
# hex: 090909097469746c653a20273f3f3f3f3f3f3f3f2c0a
# Should be: title: '暂无',
i = 9949
bs = lines[i].encode('utf-8')
print('Current hex: ' + bs.hex())
print('Current repr: ' + repr(lines[i]))

old_end = bytes.fromhex('090909097469746c653a20273f3f3f3f3f3f3f3f2c0a')
new_end = "暂无',\n".encode('utf-8')

if bs.endswith(old_end):
    lines[i] = (bs[:-len(old_end)] + new_end).decode('utf-8')
    print('Fixed: ' + repr(lines[i]))
else:
    print('Pattern not found')

open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'w', encoding='utf-8').writelines(lines)
print('Done')