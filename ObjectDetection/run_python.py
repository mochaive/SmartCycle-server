import os
import sys
import subprocess
cwd = os.getcwd()

proc = subprocess.Popen(['python3', cwd+"/classifier.py"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
output = proc.communicate()[0].decode("utf-8")
print(output)
