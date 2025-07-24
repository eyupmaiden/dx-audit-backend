const axios = require('axios');

class AirtableClient {
    constructor() {
        this.apiKey = process.env.AIRTABLE_API_KEY;
        this.baseId = process.env.AIRTABLE_BASE_ID;
        this.tableName = process.env.AIRTABLE_TABLE_NAME;
        this.baseUrl = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`;
        
        // Set up axios with default headers
        this.client = axios.create({
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async getAllRecords() {
        try {
            let allRecords = [];
            let offset = null;

            do {
                const params = {};
                if (offset) {
                    params.offset = offset;
                }

                const response = await this.client.get(this.baseUrl, { params });
                
                allRecords = allRecords.concat(response.data.records);
                offset = response.data.offset;
                
                console.log(`Fetched ${response.data.records.length} records. Total: ${allRecords.length}`);
                
            } while (offset);

            console.log(`Successfully fetched ${allRecords.length} total records from Airtable`);
            return allRecords;

        } catch (error) {
            console.error('Error fetching records from Airtable:', error.response?.data || error.message);
            throw error;
        }
    }

    async getRecordsWithFilter(filterFormula) {
        try {
            let allRecords = [];
            let offset = null;

            do {
                const params = {
                    filterByFormula: filterFormula
                };
                if (offset) {
                    params.offset = offset;
                }

                const response = await this.client.get(this.baseUrl, { params });
                
                allRecords = allRecords.concat(response.data.records);
                offset = response.data.offset;
                
            } while (offset);

            console.log(`Fetched ${allRecords.length} filtered records from Airtable`);
            return allRecords;

        } catch (error) {
            console.error('Error fetching filtered records:', error.response?.data || error.message);
            throw error;
        }
    }

    // Helper method to get just the field data without Airtable metadata
    extractFieldData(records) {
        return records.map(record => ({
            id: record.id,
            ...record.fields
        }));
    }
}

module.exports = AirtableClient;