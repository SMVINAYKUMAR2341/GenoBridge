"""Run real TS-to-Python bridge contract tests with Node's built-in test runner."""

import os
from pathlib import Path
import shutil
import subprocess
import sys
import unittest


@unittest.skipUnless(shutil.which("node"), "Node 24+ is required for TS bridge tests")
class BridgeContractTests(unittest.TestCase):
    def test_typescript_mapping_and_workflow_contract(self):
        root = Path(__file__).resolve().parents[2]
        env = dict(os.environ, CRITERIA_TEST_PYTHON=sys.executable)
        completed = subprocess.run(
            ["node", "--experimental-vm-modules", "--test", "backend/tests/criteria-service.test.mjs"],
            cwd=root, env=env, capture_output=True, text=True, timeout=45,
        )
        self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr)


if __name__ == "__main__":
    unittest.main()
