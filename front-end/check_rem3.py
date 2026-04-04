import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

# Check remaining unclosed strings
print('=== Remaining unclosed strings ===')
for i, l in enumerate(lines):
    s = l.rstrip()
    q = s.count("'")
    if q % 2 != 0 and q > 1:
        print('Line ' + str(i+1) + ' [q=' + str(q) + ']: ' + repr(s))
