import sys, re
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

# Fix line 8391: districtUnit with unclosed strings and invalid bracket syntax
# Current: smug.border === '???? ? '[?????]' : ...
# The string is unclosed, and the [?????] part is treated as bracket notation
# Fix: close the string properly, treat [?????] as part of the string value

i = 8390  # index (line 8391)
old = lines[i]
print('BEFORE: ' + repr(old))
print('HEX: ' + old.encode('utf-8').hex())

# Replace the corrupted line with a clean version
# Based on the pattern: smug.border === 'string1' ? '[district1]' : smug.border === 'string2' ? '[district2]' : ...
# The strings are corrupted to '???? ? ' - we need valid strings
# Fix: replace the whole line with valid JS
new = "\t\tconst districtUnit = smug.border === '北仑' ? '[峒中]' : smug.border === '滩散' ? '[那良]' : smug.border === '文浪' ? '[文昌]' : smug.border === '平江' ? '[水口]' : '[未知防区]'\n"

lines[i] = new
print('AFTER: ' + repr(new))

open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'w', encoding='utf-8').writelines(lines)
print('Done')