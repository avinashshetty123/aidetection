#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class SystemOptimizer {
  constructor() {
    this.tempDir = path.join(__dirname, 'server', 'temp');
    this.logFile = path.join(__dirname, 'optimization.log');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    
    try {
      fs.appendFileSync(this.logFile, logMessage);
    } catch (error) {
      console.warn('Failed to write to log file:', error.message);
    }
  }

  async cleanTempFiles() {
    this.log('Starting temp file cleanup...');
    
    try {
      if (!fs.existsSync(this.tempDir)) {
        this.log('Temp directory does not exist, creating...');
        fs.mkdirSync(this.tempDir, { recursive: true });
        return;
      }

      const files = fs.readdirSync(this.tempDir);
      let deletedCount = 0;
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (stats.mtime.getTime() < oneHourAgo) {
          totalSize += stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
          this.log(`Deleted old temp file: ${file}`);
        }
      }

      this.log(`Cleanup complete: ${deletedCount} files deleted, ${(totalSize / 1024 / 1024).toFixed(2)} MB freed`);
    } catch (error) {
      this.log(`Error during temp file cleanup: ${error.message}`);
    }
  }

  async checkDiskSpace() {
    this.log('Checking disk space...');
    
    try {
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
      
      const files = fs.readdirSync(this.tempDir);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const fileStats = fs.statSync(filePath);
        totalSize += fileStats.size;
      }
      
      const totalSizeMB = totalSize / 1024 / 1024;
      this.log(`Temp directory size: ${totalSizeMB.toFixed(2)} MB (${files.length} files)`);
      
      if (totalSizeMB > 100) {
        this.log('WARNING: Temp directory is getting large (>100MB)');
        return false;
      }
      
      return true;
    } catch (error) {
      this.log(`Error checking disk space: ${error.message}`);
      return false;
    }
  }

  async generateReport() {
    this.log('='.repeat(50));
    this.log('AI DETECTION SYSTEM - OPTIMIZATION REPORT');
    this.log('='.repeat(50));
    
    await this.cleanTempFiles();
    const diskSpaceOk = await this.checkDiskSpace();
    
    this.log('\nSUMMARY:');
    this.log(`✓ Temp file cleanup: COMPLETED`);
    this.log(`✓ Disk space check: ${diskSpaceOk ? 'PASSED' : 'WARNING'}`);
    
    this.log(`\nOVERALL SYSTEM HEALTH: ${diskSpaceOk ? '✅ GOOD' : '⚠️  NEEDS ATTENTION'}`);
    this.log('Optimization complete!');
    this.log('='.repeat(50));
    
    return { success: true };
  }
}

if (require.main === module) {
  const optimizer = new SystemOptimizer();
  optimizer.generateReport().catch(console.error);
}

module.exports = SystemOptimizer;