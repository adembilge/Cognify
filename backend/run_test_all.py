import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

def run_all_tests():
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    failures = test_runner.run_tests(['apps.documents.tests.test_scenarios'])
    sys.exit(bool(failures))

if __name__ == "__main__":
    run_all_tests()
