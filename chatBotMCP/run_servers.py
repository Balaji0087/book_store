import subprocess

subprocess.Popen(["python", "mongo_mcp_server.py"])

subprocess.run([
    "uvicorn",
    "main:app",
    "--reload"
])