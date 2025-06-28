import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Setting up Python environment for Railway...');

try {
  // Check if we're on Railway (Linux environment)
  if (process.platform === 'linux') {
    console.log('📦 Installing Python and dependencies...');
    
    // Update package list and install Python
    execSync('apt-get update', { stdio: 'inherit' });
    execSync('apt-get install -y python3 python3-pip python3-venv', { stdio: 'inherit' });
    
    // Create a virtual environment
    if (!fs.existsSync('venv')) {
      console.log('🐍 Creating Python virtual environment...');
      execSync('python3 -m venv venv', { stdio: 'inherit' });
    }
    
    // Activate virtual environment and install requirements
    console.log('📋 Installing Python requirements...');
    execSync('source venv/bin/activate && pip install -r requirements.txt', { 
      stdio: 'inherit',
      shell: '/bin/bash'
    });
    
    console.log('✅ Python setup completed successfully!');
  } else {
    console.log('ℹ️  Not on Railway/Linux, skipping Python setup...');
  }
} catch (error) {
  console.error('❌ Python setup failed:', error.message);
  console.log('⚠️  Continuing without Python setup...');
} 