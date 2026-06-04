#!/usr/bin/env python3
import os, json, paramiko

CONFIG_FILE = os.path.expanduser("~/.htw-deploy-config.json")

def setup():
    print("=== HTW Deploy Setup ===")
    config = {
        "sftp_host": "host155.alfahosting-server.de",
        "sftp_user": "gcfnn41f",
        "sftp_pass": input("SFTP Pass: "),
        "sftp_port": 22,
        "target_path": "/public_html/index.html"
    }
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f)
    os.chmod(CONFIG_FILE, 0o600)
    print(f"✓ Config gespeichert: {CONFIG_FILE}")

def deploy(html_content):
    if not os.path.exists(CONFIG_FILE):
        print("Config nicht gefunden.")
        return False
    with open(CONFIG_FILE) as f:
        config = json.load(f)
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(config["sftp_host"], port=config["sftp_port"], username=config["sftp_user"], password=config["sftp_pass"], timeout=15)
        sftp = ssh.open_sftp()
        tmp_file = "/tmp/htw-index.html"
        with open(tmp_file, 'w') as f:
            f.write(html_content)
        sftp.put(tmp_file, config["target_path"])
        print(f"✓ heeltheworld.ch is live")
        sftp.close()
        ssh.close()
        return True
    except Exception as e:
        print(f"✗ Deploy failed: {e}")
        return False

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "setup":
        setup()
