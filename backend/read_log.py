import sys
filename = sys.argv[1] if len(sys.argv) > 1 else 'test_log.txt'
try:
    with open(filename, 'rb') as f:
        content = f.read()
    for enc in ['utf-16le', 'utf-8', 'latin-1']:
        try:
            text = content.decode(enc)
            if 'Ran' in text:
                print(text)
                break
        except:
            continue
except Exception as e:
    print(e)
