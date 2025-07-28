import Airtable from "airtable";

class AirtableClient {
  constructor() {
    this.apiKey = process.env.AIRTABLE_API_KEY;
    this.baseId = process.env.AIRTABLE_BASE_ID;
    this.tableName = process.env.AIRTABLE_TABLE_NAME;

    // Validate required environment variables
    if (!this.apiKey) {
      throw new Error(
        "AIRTABLE_API_KEY environment variable is required. Please check your .env file or ensure environment variables are passed to the child process."
      );
    }
    if (!this.baseId) {
      throw new Error(
        "AIRTABLE_BASE_ID environment variable is required. Please check your .env file or ensure environment variables are passed to the child process."
      );
    }
    if (!this.tableName) {
      throw new Error(
        "AIRTABLE_TABLE_NAME environment variable is required. Please check your .env file or ensure environment variables are passed to the child process."
      );
    }

    // Configure Airtable with API key
    Airtable.configure({ apiKey: this.apiKey });

    // Initialize the base and table
    this.base = Airtable.base(this.baseId);
    this.table = this.base(this.tableName);
  }

  async getAllRecords() {
    try {
      let allRecords = [];

      // Use the official Airtable.js library to fetch all records
      await this.table.select().eachPage((records, fetchNextPage) => {
        allRecords = allRecords.concat(records);
        console.log(`Fetched ${records.length} records. Total: ${allRecords.length}`);
        fetchNextPage();
      });

      console.log(`Successfully fetched ${allRecords.length} total records from Airtable`);
      return allRecords;
    } catch (error) {
      console.error("Error fetching records from Airtable:", error.message);
      throw error;
    }
  }

  async getRecordsWithFilter(filterFormula) {
    try {
      let allRecords = [];

      // Use the official Airtable.js library with filter
      await this.table
        .select({
          filterByFormula: filterFormula,
        })
        .eachPage((records, fetchNextPage) => {
          allRecords = allRecords.concat(records);
          fetchNextPage();
        });

      console.log(`Fetched ${allRecords.length} filtered records from Airtable`);
      return allRecords;
    } catch (error) {
      console.error("Error fetching filtered records:", error.message);
      throw error;
    }
  }

  async getRecordById(recordId) {
    try {
      const record = await this.table.find(recordId);
      console.log(`Successfully fetched record ${recordId} from Airtable`);
      return record;
    } catch (error) {
      console.error("Error fetching record from Airtable:", error.message);
      throw error;
    }
  }

  // Helper method to get just the field data without Airtable metadata
  extractFieldData(records) {
    return records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));
  }
}

export default AirtableClient;
