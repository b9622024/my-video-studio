"""Monitor a local inference subprocess; stop on memory, disk or runtime limits."""
import argparse
import json
from pathlib import Path
import signal
import subprocess
import time
import psutil


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--report', type=Path, required=True)
    p.add_argument('--log', type=Path, required=True)
    p.add_argument('command', nargs=argparse.REMAINDER)
    a = p.parse_args()
    command = a.command[1:] if a.command[0] == '--' else a.command
    start = time.monotonic()
    peak = 0
    cg_peak_sample = 0
    reason = None
    with a.log.open('x') as log:
        child = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        process = psutil.Process(child.pid)
        while child.poll() is None:
            try:
                family = [process] + process.children(recursive=True)
                rss = sum(x.memory_info().rss for x in family if x.is_running())
                peak = max(peak, rss)
                cg = int(Path('/sys/fs/cgroup/memory.current').read_text())
                cg_peak_sample = max(cg_peak_sample, cg)
                # Cgroup file cache is reclaimable; process RSS is the active-memory guard.
                if rss > 7 * 1024**3:
                    reason = 'process_tree_rss_above_7_GiB'
                if psutil.disk_usage('/workspace').free < 2 * 1024**3:
                    reason = 'workspace_free_below_2_GiB'
                if time.monotonic() - start > 1200:
                    reason = 'runtime_above_20_minutes'
                if reason:
                    import os
                    os.killpg(child.pid, signal.SIGTERM)
                    try:
                        child.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        os.killpg(child.pid, signal.SIGKILL)
                    break
            except psutil.NoSuchProcess:
                pass
            time.sleep(0.1)
        code = child.wait()
    a.report.write_text(json.dumps({'exit_code': code, 'stop_reason': reason,
        'wall_seconds': time.monotonic()-start, 'sampled_process_tree_peak_rss_bytes': peak,
        'sampled_cgroup_peak_bytes_including_reclaimable_cache': cg_peak_sample}, indent=2))
    print(a.report.read_text())
    raise SystemExit(code if not reason else 1)


if __name__ == '__main__':
    main()
