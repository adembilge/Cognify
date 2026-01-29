import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

def run_specific_test(test_path):
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    failures = test_runner.run_tests([test_path])
    sys.exit(bool(failures))

if __name__ == "__main__":
    # Target specific failing test
    run_specific_test('apps.documents.tests.test_scenarios.CognifyScenarioTests.test_scenario_8_single_doc_qa')
