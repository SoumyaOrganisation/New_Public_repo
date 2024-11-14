import os
import subprocess
import sys
def run_command(command):
   """Run a shell command and return the output."""
   try:
       result = subprocess.run(command, check=True, text=True, capture_output=True)
       print(result.stdout)
   except subprocess.CalledProcessError as e:
       print(f"Error occurred: {e.stderr}")
       sys.exit(1)
def start_rabbitmq():
   """Start the RabbitMQ service."""
   print("Starting RabbitMQ service...")
   run_command(["sudo", "systemctl", "start", "rabbitmq-server"])
def main():
   start_rabbitmq()
   print("RabbitMQ installation and configuration completed successfully.")
if __name__ == "__main__":
   main()