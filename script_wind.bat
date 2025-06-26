#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Full Stack Project...');

// Start Python server
console.log('🐍 Starting Python server...');
const pythonServer = spawn('py', ['run_server.py'], {
    cwd: 'PRINTPROD',
    stdio: 'inherit',
    shell: true
});

// Wait then start Angular
setTimeout(() => {
    console.log('⚡ Installing npm packages and starting Angular server...');
    const angularServer = spawn('npm install && ng serve', [], {
        cwd: 'Read_excel_data_angular-main',
        stdio: 'inherit', 
        shell: true
    });

    // Wait for Angular server to be ready
    angularServer.on('spawn', () => {
        console.log('📦 Angular process started...');
        
        // Wait additional time for server to be fully ready
        setTimeout(() => {
            console.log('🌐 Opening browser...');
            const { exec } = require('child_process');
            
            // Cross-platform browser opening
            const openCommand = process.platform === 'win32' ? 'start' : 
                               process.platform === 'darwin' ? 'open' : 'xdg-open';
            
            exec(`${openCommand} http://localhost:4600`);
        }, 10000); // Wait 10 seconds after Angular starts
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping servers...');
        pythonServer.kill();
        angularServer.kill();
        process.exit(0);
    });

}, 3000);

console.log('✅ Both servers starting...');
console.log('🌐 Python: http://localhost:5000');
console.log('🌐 Angular: http://localhost:4600');