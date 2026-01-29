import subprocess
import sys
import os

def run_tests():
    cmd = [r'.\venv\Scripts\python.exe', 'manage.py', 'test', 'apps.documents.tests.test_scenarios', '--noinput']
    # Execute and stream directly
    result = subprocess.run(cmd, capture_output=False)
    print(f"\nFinal Exit Code: {result.returncode}")

if __name__ == "__main__":
    run_tests()
