const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting Full Stack Project...');

// Function to open browser
function openBrowser(url) {
    const openCommand = process.platform === 'win32' ? 'start ""' : 
                       process.platform === 'darwin' ? 'open' : 'xdg-open';
    
    exec(`${openCommand} "${url}"`, (error) => {
        if (error) {
            console.log(`❌ Could not open browser automatically: ${error.message}`);
            console.log(`🌐 Please manually open: ${url}`);
        } else {
            console.log('🌐 Browser opened successfully!');
        }
    });
}

// Function to check if port is ready
function checkPort(port, callback, maxRetries = 30) {
    const net = require('net');
    const client = new net.Socket();
    
    client.setTimeout(1000);
    
    client.on('connect', () => {
        client.destroy();
        callback(true);
    });
    
    client.on('error', () => {
        if (maxRetries > 0) {
            setTimeout(() => checkPort(port, callback, maxRetries - 1), 1000);
        } else {
            callback(false);
        }
    });
    
    client.on('timeout', () => {
        client.destroy();
        if (maxRetries > 0) {
            setTimeout(() => checkPort(port, callback, maxRetries - 1), 1000);
        } else {
            callback(false);
        }
    });
    
    client.connect(port, 'localhost');
}

// Start Python server
console.log('🐍 Starting Python server...');
const pythonServer = spawn('py', ['run_server.py'], {
    cwd: 'PRINTPROD',
    stdio: 'inherit',
    shell: true
});

// Wait then start Angular (without npm install)
setTimeout(() => {
    console.log('⚡ Starting Angular server...');
    
    // Start Angular server directly
    const angularServer = spawn('ng', ['serve', '--port', '4600'], {
        cwd: 'Read_excel_data_angular-main',
        stdio: 'inherit',
        shell: true
    });
    
    // Check when Angular server is ready
    console.log('🔍 Waiting for Angular server to be ready...');
    checkPort(4600, (isReady) => {
        if (isReady) {
            console.log('✅ Angular server is ready!');
            console.log('🌐 Opening browser...');
            openBrowser('http://localhost:4600');
        } else {
            console.log('❌ Angular server failed to start or is not responding');
            console.log('🌐 Please manually check: http://localhost:4600');
        }
    });
    
    // Handle Ctrl+C for both servers
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping servers...');
        pythonServer.kill('SIGTERM');
        angularServer.kill('SIGTERM');
        process.exit(0);
    });
    
}, 3000);

// Handle Ctrl+C for Python server
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping Python server...');
    pythonServer.kill('SIGTERM');
    process.exit(0);
});

console.log('✅ Both servers starting...');
console.log('🌐 Python: http://localhost:5000');
console.log('🌐 Angular: http://localhost:4600');
console.log('📝 Note: Make sure npm packages are already installed in the Angular project');