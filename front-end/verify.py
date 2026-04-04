import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

# Check lines with odd single-quote count again
print('=== Odd quote scan after fixes ===')
problems = []
for i in range(1318, 11237):
    l = lines[i].rstrip()
    if not l:
        continue
    s = l.lstrip()
    if s.startswith('//') or s.startswith('*'):
        continue
    sq = l.count("'")
    dq = l.count('"')
    if sq % 2 != 0:
        print('Line ' + str(i+1) + ' [sq=' + str(sq) + ']: ' + repr(l[:100]))
        problems.append(i)
    elif dq % 2 != 0:
        print('Line ' + str(i+1) + ' [dq=' + str(dq) + ']: ' + repr(l[:100]))
        problems.append(i)

print()
print('Total: ' + str(len(problems)))

# Also verify the specific lines from scan
print()
for idx in [3023, 3111, 3239, 7502, 7510, 7750, 8414, 8574, 9461, 9949, 9957, 9965, 10125, 10429]:
    l = lines[idx]
    sq = l.count("'")
    bs = l.encode('utf-8')
    print('L' + str(idx+1) + ' [sq=' + str(sq) + ']: ends=' + repr(l.rstrip()[-30:]) + ' hex_end=' + str(bs[-10:].hex()))