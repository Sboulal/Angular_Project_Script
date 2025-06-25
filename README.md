import subprocess
import time
import signal
import sys
import os

def signal_handler(sig, frame):
    print('\n🛑 Shutting down servers...')
    # Kill all spawned processes
    for proc in processes:
        if proc.poll() is None:  # Process is still running
            proc.terminate()
    sys.exit(0)

def main():
    global processes
    processes = []
    
    print('🚀 Starting Full Stack Project...')
    
    # Start Python server (navigate to Python folder)
    print('🐍 Starting Python server...')
    try:
        python_proc = subprocess.Popen(['py', 'run_server.py'], cwd='python-project')
        processes.append(python_proc)
    except Exception as e:
        print(f'Error starting Python server: {e}')
        return
    
    # Wait a moment for server to start
    time.sleep(3)
    
    # Start Angular development server (navigate to Angular folder)
    print('⚡ Starting Angular development server...')
    try:
        angular_proc = subprocess.Popen(['ng', 'serve'], cwd='angular-project')
        processes.append(angular_proc)
    except Exception as e:
        print(f'Error starting Angular server: {e}')
        return
    
    print('✅ Both servers are starting...')
    print('🌐 Python server: http://localhost:5000')
    print('🌐 Angular app: http://localhost:4200')
    print('Press Ctrl+C to stop both servers')
    
    # Set up signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Wait for processes to complete
    try:
        for proc in processes:
            proc.wait()
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == '__main__':
    main()