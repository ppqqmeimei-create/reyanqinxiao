import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

# Line 9950: current hex is e69a82e697a0272c0a which decodes as 暂无',\n
# But it should be title: '暂无',
# We need to add the title: ' prefix back

i = 9949
bs = lines[i].encode('utf-8')
print('Current: ' + bs.hex() + ' = ' + repr(bs.decode('utf-8')))

# We need: \ttitle: '暂无',\n
# hex: 090909097469746c653a20 e69a82e697a0 272c0a
target = "\ttitle: '暂无',\n".encode('utf-8')
print('Target: ' + target.hex())

lines[i] = target.decode('utf-8')
print('Fixed: ' + repr(lines[i]))

open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'w', encoding='utf-8').writelines(lines)
print('Done')