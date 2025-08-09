#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes production build output and generates performance metrics
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, '..', 'dist');

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function analyzeDirectory(dirPath) {
  const results = {
    totalSize: 0,
    files: [],
    chunks: {},
    assets: {},
    summary: {}
  };

  if (!existsSync(dirPath)) {
    console.error('❌ Dist directory not found. Run npm run build first.');
    process.exit(1);
  }

  function processDirectory(currentPath, relativePath = '') {
    const items = readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = join(currentPath, item);
      const relativeItemPath = relativePath ? join(relativePath, item) : item;
      const stats = statSync(fullPath);
      
      if (stats.isDirectory()) {
        processDirectory(fullPath, relativeItemPath);
      } else {
        const fileInfo = {
          name: relativeItemPath,
          size: stats.size,
          formatted: formatBytes(stats.size)
        };
        
        results.files.push(fileInfo);
        results.totalSize += stats.size;
        
        // Categorize files
        if (relativeItemPath.includes('assets/')) {
          if (relativeItemPath.endsWith('.js')) {
            const chunkName = item.replace(/-.+\.js$/, '');
            if (!results.chunks[chunkName]) {
              results.chunks[chunkName] = [];
            }
            results.chunks[chunkName].push(fileInfo);
          } else if (relativeItemPath.endsWith('.css')) {
            results.assets.css = results.assets.css || [];
            results.assets.css.push(fileInfo);
          }
        } else if (relativeItemPath.endsWith('.html')) {
          results.assets.html = results.assets.html || [];
          results.assets.html.push(fileInfo);
        }
      }
    }
  }

  processDirectory(dirPath);
  
  // Generate summary
  const jsFiles = results.files.filter(f => f.name.endsWith('.js'));
  const cssFiles = results.files.filter(f => f.name.endsWith('.css'));
  
  results.summary = {
    totalFiles: results.files.length,
    totalSize: formatBytes(results.totalSize),
    totalSizeBytes: results.totalSize,
    javascript: {
      count: jsFiles.length,
      size: formatBytes(jsFiles.reduce((sum, f) => sum + f.size, 0)),
      sizeBytes: jsFiles.reduce((sum, f) => sum + f.size, 0)
    },
    css: {
      count: cssFiles.length,
      size: formatBytes(cssFiles.reduce((sum, f) => sum + f.size, 0)),
      sizeBytes: cssFiles.reduce((sum, f) => sum + f.size, 0)
    }
  };
  
  return results;
}

function generateReport(analysis) {
  console.log('📦 Bundle Analysis Report');
  console.log('========================\n');
  
  console.log('📊 Summary:');
  console.log(`  Total Bundle Size: ${analysis.summary.totalSize} (${analysis.summary.totalSizeBytes} bytes)`);
  console.log(`  JavaScript: ${analysis.summary.javascript.size} (${analysis.summary.javascript.count} files)`);
  console.log(`  CSS: ${analysis.summary.css.size} (${analysis.summary.css.count} files)`);
  console.log(`  Other Assets: ${analysis.summary.totalFiles - analysis.summary.javascript.count - analysis.summary.css.count} files\n`);
  
  // Performance thresholds
  const TARGET_BUNDLE_SIZE = 500 * 1024; // 500KB
  const CURRENT_SIZE = analysis.summary.totalSizeBytes;
  const SIZE_RATIO = (CURRENT_SIZE / TARGET_BUNDLE_SIZE);
  
  console.log('🎯 Performance Targets:');
  console.log(`  Target Bundle Size: ${formatBytes(TARGET_BUNDLE_SIZE)}`);
  console.log(`  Current Bundle Size: ${formatBytes(CURRENT_SIZE)}`);
  console.log(`  Size Ratio: ${(SIZE_RATIO * 100).toFixed(1)}% of target`);
  
  if (SIZE_RATIO <= 1) {
    console.log('  ✅ Bundle size is within target!');
  } else {
    const overage = CURRENT_SIZE - TARGET_BUNDLE_SIZE;
    console.log(`  ⚠️  Bundle is ${formatBytes(overage)} over target (${((SIZE_RATIO - 1) * 100).toFixed(1)}% larger)`);
  }
  console.log('');
  
  // Largest chunks analysis
  console.log('📈 Largest JavaScript Chunks:');
  const jsFiles = analysis.files.filter(f => f.name.endsWith('.js')).sort((a, b) => b.size - a.size);
  jsFiles.slice(0, 10).forEach((file, index) => {
    const percentage = ((file.size / analysis.summary.javascript.sizeBytes) * 100).toFixed(1);
    console.log(`  ${index + 1}. ${file.name}: ${file.formatted} (${percentage}%)`);
  });
  console.log('');
  
  // Code splitting effectiveness
  console.log('🔧 Code Splitting Analysis:');
  const mainChunks = jsFiles.filter(f => 
    f.name.includes('vue-ecosystem') || 
    f.name.includes('supabase') || 
    f.name.includes('dashboard-chunks') ||
    f.name.includes('ui-components') ||
    f.name.includes('forms')
  );
  
  if (mainChunks.length > 0) {
    console.log('  Manual chunks found:');
    mainChunks.forEach(chunk => {
      const percentage = ((chunk.size / analysis.summary.javascript.sizeBytes) * 100).toFixed(1);
      console.log(`    - ${chunk.name}: ${chunk.formatted} (${percentage}%)`);
    });
  }
  console.log('');
  
  // Optimization recommendations
  console.log('💡 Optimization Recommendations:');
  
  const largeFiles = jsFiles.filter(f => f.size > 50 * 1024); // Files > 50KB
  if (largeFiles.length > 0) {
    console.log('  🎯 Large files that could benefit from splitting:');
    largeFiles.forEach(file => {
      console.log(`    - ${file.name}: ${file.formatted}`);
    });
  }
  
  if (SIZE_RATIO > 1) {
    console.log('  📉 Suggested optimizations:');
    console.log('    - Consider lazy loading more routes');
    console.log('    - Review dependency tree for unused code');
    console.log('    - Enable tree shaking for larger libraries');
    console.log('    - Consider dynamic imports for non-critical features');
  }
  
  return {
    targetMet: SIZE_RATIO <= 1,
    currentSize: CURRENT_SIZE,
    targetSize: TARGET_BUNDLE_SIZE,
    sizeRatio: SIZE_RATIO,
    recommendations: SIZE_RATIO > 1 ? ['lazy-loading', 'tree-shaking', 'dynamic-imports'] : []
  };
}

// Main execution
const analysis = analyzeDirectory(distPath);
const report = generateReport(analysis);

// Exit with appropriate code
process.exit(report.targetMet ? 0 : 1);