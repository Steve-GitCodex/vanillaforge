/**
 * CSS Auto-Discovery and Generation Utility
 * 
 * This utility helps manage CSS files for VanillaForge components by:
 * - Auto-discovering component CSS files
 * - Generating CSS stub files for new components
 * - Validating CSS file paths and structure
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * CSS Auto-Discovery System
 */
export class CSSAutoDiscovery {
    constructor(options = {}) {
        this.srcDir = options.srcDir || path.join(projectRoot, 'src');
        this.stylesDir = options.stylesDir || path.join(this.srcDir, 'styles');
        this.componentsDir = options.componentsDir || path.join(this.srcDir, 'components');
        this.componentStylesDir = path.join(this.stylesDir, 'components');
    }    /**
     * Auto-discover all component files
     */
    async discoverComponents() {
        try {
            const files = await fs.readdir(this.componentsDir);
            return files
                .filter(file => file.endsWith('.js') && file !== 'base-component.js')
                .map(file => ({
                    name: file.replace('.js', ''),
                    path: path.join(this.componentsDir, file),
                    expectedCSSPath: path.join(this.componentStylesDir, file.replace('.js', '.css'))
                }));
        } catch (error) {
            console.error('Failed to discover components:', error);
            return [];
        }
    }

    /**
     * Check which components are missing CSS files
     */
    async findMissingCSS() {
        const components = await this.discoverComponents();
        const missing = [];

        for (const component of components) {
            try {
                await fs.access(component.expectedCSSPath);
            } catch (error) {
                missing.push(component);
                console.warn(`Missing CSS for component: ${component.name} (expected at ${path.relative(projectRoot, component.expectedCSSPath)}): ${error.message}`);
            }
        }

        return missing;
    }    /**
     * Generate CSS stub files for components
     */
    async generateCSSStubs(componentNames = null) {
        const missing = await this.findMissingCSS();
        const components = componentNames
            ? missing.filter(c => componentNames.includes(c.name))
            : missing;

        // Ensure components styles directory exists
        await fs.mkdir(this.componentStylesDir, { recursive: true });

        const generated = [];

        for (const component of components) {
            const cssTemplate = this.generateCSSTemplate(component.name);

            try {
                await fs.writeFile(component.expectedCSSPath, cssTemplate);
                generated.push(component.expectedCSSPath);
                console.log(`Generated CSS stub: ${path.relative(projectRoot, component.expectedCSSPath)}`);
            } catch (error) {
                console.error(`Failed to generate CSS for ${component.name}:`, error);
            }
        }

        return generated;
    }

    /**
     * Generate CSS template for a component
     */
    generateCSSTemplate(componentName) {
        const className = componentName.toLowerCase().replace(/component$/, '').replace(/[^a-z0-9]/g, '-');

        return `/**
 * ${componentName} Styles
 * 
 * Auto-generated CSS file for ${componentName}
 * Customize these styles as needed for your component.
 */

.${className} {
    /* Base component styles */
    display: block;
    box-sizing: border-box;
}

.${className}-container {
    /* Container styles */
    width: 100%;
}

.${className}-content {
    /* Content area styles */
    padding: 1rem;
}

.${className}-header {
    /* Header styles */
    margin-bottom: 1rem;
}

.${className}-body {
    /* Body content styles */
}

.${className}-footer {
    /* Footer styles */
    margin-top: 1rem;
}

/* Responsive styles */
@media (max-width: 768px) {
    .${className}-content {
        padding: 0.5rem;
    }
}

/* Component-specific styles */
/* Add your custom styles below */

`;
    }

    /**
     * Validate CSS file structure
     */
    async validateCSSStructure() {
        const components = await this.discoverComponents();
        const report = {
            total: components.length,
            withCSS: 0,
            missingCSS: 0,
            components: []
        };

        for (const component of components) {
            let hasCSS = false;

            try {
                await fs.access(component.expectedCSSPath);
                hasCSS = true;
                report.withCSS++;
            } catch (error) {
                report.missingCSS++;
                console.warn(`Missing CSS for component: ${component.name} (expected at ${path.relative(projectRoot, component.expectedCSSPath)}): ${error.message}`);
            }

            report.components.push({
                name: component.name,
                hasCSS,
                cssPath: component.expectedCSSPath
            });
        }

        return report;
    }

    /**
     * Auto-discovery CLI interface
     */
    async runAutoDiscovery(options = {}) {
        console.log('Running CSS Auto-Discovery...\n');

        // Validate structure
        const report = await this.validateCSSStructure();

        console.log('CSS Structure Report:');
        console.log(`  Total components: ${report.total}`);
        console.log(`  Components with CSS: ${report.withCSS}`);
        console.log(`  Components missing CSS: ${report.missingCSS}\n`);

        if (report.missingCSS > 0) {
            console.log('Missing CSS files:');
            report.components
                .filter(c => !c.hasCSS)
                .forEach(c => console.log(`  ${c.name}`));

            if (options.generateStubs) {
                console.log('\n  Generating CSS stubs...');
                await this.generateCSSStubs();
                console.log('CSS stub generation complete!\n');
            } else {
                console.log('\n Run with --generate to create CSS stub files\n');
            }
        } else {
            console.log('All components have CSS files!\n');
        }

        return report;
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const cssDiscovery = new CSSAutoDiscovery();
    const generateStubs = process.argv.includes('--generate');

    cssDiscovery.runAutoDiscovery({ generateStubs })
        .then(report => {
            process.exit(report.missingCSS > 0 && !generateStubs ? 1 : 0);
        })
        .catch(error => {
            console.error('CSS Auto-Discovery failed:', error);
            process.exit(1);
        });
}
