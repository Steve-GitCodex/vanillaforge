/**
 * Build Script for VanillaForge
 *
 * This script builds the application for production deployment by:
 * - Bundling and minifying JavaScript files
 * - Auto-discovering and processing CSS files
 * - Generating optimized HTML with auto-injected CSS links
 * - Optimizing assets with proper path handling
 */

import esbuild from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const buildConfig = {
  srcDir: path.join(projectRoot, 'src'),
  distDir: path.join(projectRoot, 'dist'),
  entryPoint: path.join(projectRoot, 'src', 'app.js'),
  outfile: path.join(projectRoot, 'dist', 'app.bundle.js'),
  minify: process.env.NODE_ENV === 'production',
  sourceMaps: process.env.NODE_ENV !== 'production',
  cssAutoInject: true, // Auto-inject discovered CSS files
};

/**
 * Auto-discover CSS files in the src directory
 */
async function discoverCssFiles() {
  const cssPattern = path.join(buildConfig.srcDir, '**/*.css');
  const cssFiles = await glob(cssPattern, { windowsPathsNoEscape: true });
  
  return cssFiles.map(file => {
    const relativePath = path.relative(buildConfig.srcDir, file);
    return {
      srcPath: file,
      relativePath: relativePath,
      distPath: path.join(buildConfig.distDir, relativePath),
      webPath: relativePath.replace(/\\/g, '/') // Ensure web-friendly paths
    };
  });
}

/**
 * Process and copy CSS files with optimization
 */
async function processCss() {
  console.log('Processing CSS files...');
  
  const cssFiles = await discoverCssFiles();
  const processedFiles = [];
  
  for (const cssFile of cssFiles) {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(cssFile.distPath), { recursive: true });
      
      // Read and optionally minify CSS
      let cssContent = await fs.readFile(cssFile.srcPath, 'utf-8');
      
      if (buildConfig.minify) {
        // Simple CSS minification
        cssContent = cssContent
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/\s+/g, ' ') // Collapse whitespace
          .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
          .replace(/\s*{\s*/g, '{') // Clean braces
          .replace(/\s*}\s*/g, '}')
          .replace(/\s*;\s*/g, ';')
          .trim();
      }
      
      // Write processed CSS
      await fs.writeFile(cssFile.distPath, cssContent);
      processedFiles.push(cssFile);
      
      console.log(`  ${cssFile.relativePath}`);
    } catch (error) {
      console.error(`  Failed to process ${cssFile.relativePath}:`, error.message);
    }
  }
  
  console.log(`Processed ${processedFiles.length} CSS files`);
  return processedFiles;
}

/**
 * Process HTML file with auto-injected CSS links
 */
async function processHtml(cssFiles) {
  console.log('Processing HTML...');
  
  const indexPath = path.join(projectRoot, 'index.html');
  let html = await fs.readFile(indexPath, 'utf-8');

  // Replace JavaScript reference
  html = html.replace(
    /src="src\/app\.js"/g,
    'src="app.bundle.js"'
  );

  if (buildConfig.cssAutoInject) {
    // Remove existing CSS links
    html = html.replace(/<link[^>]+rel="stylesheet"[^>]+href="src\/[^"]*"[^>]*>/g, '');
    
    // Generate new CSS link tags
    const cssLinks = cssFiles.map(cssFile => 
      `    <link rel="stylesheet" href="${cssFile.webPath}">`
    ).join('\n');
    
    // Inject CSS links before closing </head> tag
    html = html.replace(
      /<\/head>/,
      `${cssLinks}\n</head>`
    );
  } else {
    // Manual path replacement (legacy mode)
    html = html.replace(
      /href="src\/styles\//g,
      'href="styles/'
    );
  }

  await fs.writeFile(path.join(buildConfig.distDir, 'index.html'), html);
  console.log('HTML processed successfully');
}

/**
 * Copy additional assets
 */
async function copyAssets() {
  console.log('Copying additional assets...');
  
  // Copy any other assets (images, fonts, etc.)
  const assetPatterns = [
    'src/**/*.{png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot}',
    'src/**/*.json'
  ];
  
  for (const pattern of assetPatterns) {
    const assetFiles = await glob(path.join(projectRoot, pattern), { windowsPathsNoEscape: true });
    
    for (const assetFile of assetFiles) {
      const relativePath = path.relative(path.join(projectRoot, 'src'), assetFile);
      const distPath = path.join(buildConfig.distDir, relativePath);
      
      await fs.mkdir(path.dirname(distPath), { recursive: true });
      await fs.copyFile(assetFile, distPath);
    }
  }
  
  console.log('Assets copied successfully');
}

/**
 * Main build function
 */
async function build() {
  console.log('Starting VanillaForge build...');
  console.log(`Source: ${buildConfig.srcDir}`);
  console.log(`Output: ${buildConfig.distDir}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Clean and create dist directory
  await fs.rm(buildConfig.distDir, { recursive: true, force: true });
  await fs.mkdir(buildConfig.distDir, { recursive: true });

  try {
    // Build JavaScript bundle
    console.log('Building JavaScript bundle...');
    await esbuild.build({
      entryPoints: [buildConfig.entryPoint],
      bundle: true,
      outfile: buildConfig.outfile,
      minify: buildConfig.minify,
      sourcemap: buildConfig.sourceMaps,
      format: 'esm',
      target: 'es2020',
      treeShaking: true,
    });
    console.log('JavaScript bundle created successfully');

    // Process CSS files
    const cssFiles = await processCss();
    
    // Process HTML with CSS injection
    await processHtml(cssFiles);
    
    // Copy additional assets
    await copyAssets();
    
    // Build summary
    console.log('\nBuild completed successfully!');
    console.log('Build Summary:');
    console.log(`  JavaScript: app.bundle.js`);
    console.log(`  CSS files: ${cssFiles.length}`);
    console.log(`  HTML: index.html`);
    console.log(`  Output directory: ${buildConfig.distDir}`);
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}
// Start the build process
build();
