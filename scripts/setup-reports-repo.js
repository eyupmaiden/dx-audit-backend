const fs = require('fs');
const path = require('path');

/**
 * Script to copy reports files to a new repository
 * Usage: node scripts/setup-reports-repo.js [target-directory]
 */

const SOURCE_DIR = './reports';
const FILES_TO_COPY = ['index.html', 'README.md', 'reports.json'];

function copyReportsFiles(targetDir) {
    try {
        console.log('📁 Setting up reports repository...');
        
        // Check if source directory exists
        if (!fs.existsSync(SOURCE_DIR)) {
            console.log('❌ Reports directory not found. Please run the setup first.');
            return;
        }
        
        // If no target directory provided, ask user
        if (!targetDir) {
            console.log('\n📋 Please provide the path to your new reports repository:');
            console.log('Example: ../dx-audit-reports');
            console.log('Or run: node scripts/setup-reports-repo.js [target-directory]');
            return;
        }
        
        // Check if target directory exists
        if (!fs.existsSync(targetDir)) {
            console.log(`❌ Target directory not found: ${targetDir}`);
            console.log('Please create the repository directory first.');
            return;
        }
        
        console.log(`📄 Copying files to: ${targetDir}`);
        
        // Copy each file
        FILES_TO_COPY.forEach(file => {
            const sourcePath = path.join(SOURCE_DIR, file);
            const destPath = path.join(targetDir, file);
            
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
                console.log(`   ✅ Copied: ${file}`);
            } else {
                console.log(`   ❌ Source file not found: ${file}`);
            }
        });
        
        console.log('\n🎉 Files copied successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Navigate to your reports repository');
        console.log('2. Add and commit the files: git add . && git commit -m "Initial setup"');
        console.log('3. Push to GitHub: git push origin main');
        console.log('4. Enable GitHub Pages in repository settings');
        
    } catch (error) {
        console.error('❌ Error copying files:', error.message);
    }
}

// Get target directory from command line arguments
const targetDir = process.argv[2];
copyReportsFiles(targetDir); 