import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

# Check raw bytes at end of each problematic line
print('=== Raw check of problematic lines ===')
for idx in [3023, 3111, 3239, 7502, 7510, 7750, 8574, 9949, 9957, 9965, 10125, 10429]:
    l = lines[idx]
    bs = l.encode('utf-8')
    print('L' + str(idx+1) + ':')
    print('  len=' + str(len(bs)) + ' ends=' + str(bs[-5:].hex()))
    print('  ends= ' + repr(l[-15:]))
    # Check if ends with "'\n" or just "'" or what
    print('  last 5 bytes: ' + str([hex(b) for b in bs[-5:]]))