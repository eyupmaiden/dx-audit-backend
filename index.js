require('dotenv').config();
const AirtableClient = require('./src/airtable');
const DataProcessor = require('./src/dataProcessor');
const ReportGenerator = require('./src/reportGenerator');

async function generateAuditReports() {
    try {
        console.log('🚀 Starting audit report generation...');
        
        // Fetch data from Airtable
        console.log('📊 Fetching data from Airtable...');
        const airtable = new AirtableClient();
        const records = await airtable.getAllRecords();
        const cleanData = airtable.extractFieldData(records);
        
        // Process the data
        console.log('⚙️  Processing audit data...');
        const processor = new DataProcessor(cleanData);
        const summaryStats = processor.getSummaryStats();
        
        console.log(`\n📋 Found audits for ${summaryStats.clients.length} client(s):`);
        summaryStats.clients.forEach(client => console.log(`   • ${client}`));
        
        if (summaryStats.clients.length === 1) {
            // Single client - generate one report with client-specific filename
            console.log('\n📄 Generating single client report...');
            const client = summaryStats.clients[0];
            const filename = `${client.toLowerCase().replace(/[^a-z0-9]/g, '-')}-audit-report.html`;
            const outputPath = `./output/${filename}`;
            
            const reportGenerator = new ReportGenerator(processor);
            console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(reportGenerator)));
            const reportPath = await reportGenerator.generateReport(outputPath);
            
            console.log(`\n✅ Report generated successfully!`);
            console.log(`📁 Report saved to: ${outputPath}`);
            
        } else {
            // Multiple clients - generate individual reports
            console.log('\n📄 Generating individual client reports...');
            
            for (const client of summaryStats.clients) {
                console.log(`   🔄 Processing ${client}...`);
                
                // Filter data for this client
                const clientData = cleanData.filter(record => record.Client === client);
                const clientProcessor = new DataProcessor(clientData);
                const clientReportGenerator = new ReportGenerator(clientProcessor);
                
                // Generate filename
                const filename = `${client.toLowerCase().replace(/[^a-z0-9]/g, '-')}-audit-report.html`;
                const outputPath = `./output/${filename}`;
                
                await clientReportGenerator.generateReport(outputPath);
                console.log(`   ✅ ${client} report saved to: ${outputPath}`);
            }
            
            console.log(`\n🎉 All ${summaryStats.clients.length} client reports generated successfully!`);
        }
        
        console.log(`\n🌐 Open the HTML files in your browser to view the reports`);
        
    } catch (error) {
        console.error('❌ Report generation failed:', error.message);
    }
}

generateAuditReports();