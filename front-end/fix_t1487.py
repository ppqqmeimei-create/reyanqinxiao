import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'r', encoding='utf-8').readlines()

# Fix line 1487 (index 1486): same concat issue
old = lines[1486]
new = "\t\t{ id: 'ranking', icon: 'layers.png', text: '????', color: '#FF4D4F' },\n\t\t{ id: 'intel', icon: 'alert-warning.png', text: '????', color: '#FFA940' },\n"
lines[1486] = new
print('Before: ' + repr(old))
print('After: ' + repr(new))

open(r'c:\Users\Maystars\Desktop\互联网+\reyanqinxiao\front-end\pages\GIS\index.vue', 'w', encoding='utf-8').writelines(lines)
print('Fixed line 1487')