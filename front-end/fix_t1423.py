import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

# Fix line 1415 (index 1414): empty or malformed line
# Fix line 1423 (index 1422): concatenated toolbar items

# The corrupted line has:
# { id: 'ranking', icon: 'alert-critical.png', text: '????', color: '#FF4D4F' }id: 'panorama', ...
# Should be two separate objects separated by },

lines[1414] = ''
lines[1422] = "\t\t{ id: 'ranking', icon: 'alert-critical.png', text: '????', color: '#FF4D4F' },\n\t\t{ id: 'panorama', icon: 'camera-infrared.png', text: '????', color: '#00D4FF' },\n"

open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'w', encoding='utf-8').writelines(lines)
print('Fixed')

lines2 = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()
print('L1415: ' + repr(lines2[1414]))
print('L1423: ' + repr(lines2[1422]))