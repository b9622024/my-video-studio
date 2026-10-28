"""Conservative pre-publication check of tracked files; never prints secret values."""
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
ALLOWED = {'docs/recovery-v2.4.md', 'config/model-assets.v2.4.json', 'config/voice-test.v2.4.template.json', '.gitignore', 'README.md', 'config/voice-test.template.json',
           'config/voice-test.v2.3.template.json', 'docs/voice-recovery.md',
           'docs/recovery-v2.3.md', 'scripts/private_assets.py',
           'scripts/private_zip.py', 'scripts/check_public_files.py'}
PATTERNS = [rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
            rb'gh[pousr]_[A-Za-z0-9]{20,}', rb'github_pat_[A-Za-z0-9_]{30,}',
            rb'AKIA[0-9A-Z]{16}', rb'sk-[A-Za-z0-9_-]{24,}',
            rb'(?i)(?:api[_-]?key|access[_-]?token|password)\s*[:=]\s*[\x22\x27][^\x22\x27\r\n]{12,}[\x22\x27]']

def main():
    files = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    failures = []
    for name in filter(None, files):
        if name not in ALLOWED:
            failures.append((name, 'not in reviewed public allowlist'))
            continue
        path = ROOT / name
        if path.is_symlink():
            failures.append((name, 'symbolic link'))
            continue
        data = path.read_bytes()
        try:
            data.decode('utf-8')
        except UnicodeDecodeError:
            failures.append((name, 'non UTF-8 content'))
        for pattern in PATTERNS:
            if re.search(pattern, data):
                failures.append((name, 'possible secret'))
    if failures:
        for name, reason in failures:
            print(name, reason)
        raise SystemExit(1)
    print('PASS: tracked files match reviewed text allowlist; no matching secret patterns')

if __name__ == '__main__':
    main()
