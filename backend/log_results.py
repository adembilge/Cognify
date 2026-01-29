import subprocess
import os

with open('final_log.txt', 'w', encoding='utf-8') as f:
    test_files = [
        'apps.documents.tests.test_requirements',
        'apps.documents.tests.test_scenarios',
        'apps.documents.tests.test_use_cases_fulfillment'
    ]
    all_ok = True
    for test_file in test_files:
        f.write(f"\n--- RUNNING {test_file} ---\n")
        cmd = [r'.\venv\Scripts\python.exe', 'manage.py', 'test', test_file, '--noinput']
        result = subprocess.run(cmd, stdout=f, stderr=subprocess.STDOUT, text=True)
        if result.returncode != 0:
            all_ok = False
    f.write(f"\nFINAL EXIT CODE: {0 if all_ok else 1}")
