export const createAirtableClient = () => {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  // Validate required environment variables
  if (!apiKey) {
    throw new Error(
      "AIRTABLE_API_KEY environment variable is required. Please check your .env file or ensure environment variables are passed to the child process."
    );
  }
  if (!baseId) {
    throw new Error(
      "AIRTABLE_BASE_ID environment variable is required. Please check your .env file or ensure environment variables are passed to the child process."
    );
  }
  if (!tableName) {
    throw new Error(
      "AIRTABLE_TABLE_NAME environment variable is required. Please check your .env file or ensure environment variables are passed to the child process."
    );
  }

  // Base URL for Airtable REST API v0
  const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

  const makeRequest = async (endpoint, options = {}) => {
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  const getAllRecords = async () => {
    try {
      let allRecords = [];
      let offset = null;

      do {
        const params = new URLSearchParams({
          timeZone: "UTC",
          userLocale: "en",
        });

        if (offset) {
          params.append("offset", offset);
        }

        const response = await makeRequest(`?${params.toString()}`);

        if (response.records) {
          allRecords = allRecords.concat(response.records);
          console.log(`Fetched ${response.records.length} records. Total: ${allRecords.length}`);
        }

        offset = response.offset;
      } while (offset);

      console.log(`Successfully fetched ${allRecords.length} total records from Airtable`);
      return allRecords;
    } catch (error) {
      console.error("Error fetching records from Airtable:", error.message);
      throw error;
    }
  };

  const getRecordsWithFilter = async (filterFormula) => {
    try {
      let allRecords = [];
      let offset = null;

      do {
        const params = new URLSearchParams({
          timeZone: "UTC",
          userLocale: "en",
          filterByFormula: filterFormula,
        });

        if (offset) {
          params.append("offset", offset);
        }

        const response = await makeRequest(`?${params.toString()}`);

        if (response.records) {
          allRecords = allRecords.concat(response.records);
        }

        offset = response.offset;
      } while (offset);

      console.log(`Fetched ${allRecords.length} filtered records from Airtable`);
      return allRecords;
    } catch (error) {
      console.error("Error fetching filtered records:", error.message);
      throw error;
    }
  };

  const getRecordById = async (recordId) => {
    try {
      const params = new URLSearchParams({
        timeZone: "UTC",
        userLocale: "en",
      });

      const response = await makeRequest(`/${recordId}?${params.toString()}`);
      console.log(`Successfully fetched record ${recordId} from Airtable`);
      return response;
    } catch (error) {
      console.error("Error fetching record from Airtable:", error.message);
      throw error;
    }
  };

  // Helper function to get just the field data without Airtable metadata
  const extractFieldData = (records) => {
    return records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));
  };

  // Return an object with all the methods
  return {
    makeRequest,
    getAllRecords,
    getRecordsWithFilter,
    getRecordById,
    extractFieldData,
  };
};

// For backward compatibility, also export as default
export default createAirtableClient;
