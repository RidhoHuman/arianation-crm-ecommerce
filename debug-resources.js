// debug-resources.js - Lightweight resource monitoring

const os = require('os');
const v8 = require('v8');

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const monitorResources = () => {
  const usage = process.memoryUsage();
  const heapStats = v8.getHeapStatistics();
  const heapUsed = usage.heapUsed;
  const heapLimit = heapStats.heap_size_limit;

  // Only log if memory is critical (> 80%)
  const heapPercent = (heapUsed / heapLimit * 100);
  
  if (heapPercent > 80) {
    console.warn(`⚠️  High Heap Usage: ${heapPercent.toFixed(1)}%`);
  }
};

// Export for use in server
module.exports = { monitorResources, formatBytes };

// If run directly
if (require.main === module) {
  console.log('🔍 Monitoring Node.js resources (every 30 sec)...\n');
  setInterval(monitorResources, 30000);
  monitorResources();
}

