# Digital Experience Audit Report Generator

A Node.js application that generates comprehensive digital experience audit reports from Airtable data.

## Features

- 📊 Fetches audit data from Airtable
- 📈 Generates interactive HTML reports with charts
- 🎯 User journey analysis with visual attention insights
- 📋 Detailed findings and recommendations
- 🎨 Modern, responsive design
- 🔧 Development mode with live reload
- 🚀 API-ready for single record generation

## Setup

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- Airtable account with API access

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd dx-audit
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` with your Airtable credentials:
```env
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_TABLE_NAME=your_table_name_here
OUTPUT_FOLDER=/path/to/output/directory  # Optional, defaults to ./output
```

### Getting Airtable Credentials

1. **API Key**: Go to [Airtable Account](https://airtable.com/account) → API → Generate API key
2. **Base ID**: Found in your Airtable URL: `https://airtable.com/appXXXXXXXXXXXXXX`
3. **Table Name**: Found in your table settings or URL

## Usage

### Generate All Reports
```bash
# Generate reports for all records
npm run build:all
# or
node index.js --all
```

### Generate Single Report
```bash
# Generate report for a specific record ID
npm run build:single -- --recordId=recXXXXXXXXXXXXXX
# or
node index.js --recordId=recXXXXXXXXXXXXXX
```

### Development Mode
```bash
# Start development server with live reload (requires recordId)
npm run dev -- --recordId=recXXXXXXXXXXXXXX

# Or set DEV_RECORD in your .env file and run:
npm run dev
```

**Note**: Dev mode requires a recordId for single record development. You can either:
- Pass `--recordId=recXXXXXXXXXXXXXX` to the command
- Set `DEV_RECORD=recXXXXXXXXXXXXXX` in your `.env` file

Reports will be generated in the `output/` directory (or `OUTPUT_FOLDER` if specified).

## Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--all` | Generate reports for all records | `node index.js --all` |
| `--recordId=<id>` | Generate report for specific record | `node index.js --recordId=recXXXXXXXXXXXXXX` |

**Note**: When using `--recordId`, the system validates that the record exists in Airtable before proceeding.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AIRTABLE_API_KEY` | Your Airtable API key | Yes | - |
| `AIRTABLE_BASE_ID` | Your Airtable base ID | Yes | - |
| `AIRTABLE_TABLE_NAME` | Your Airtable table name | Yes | - |
| `OUTPUT_FOLDER` | Output directory for reports | No | `./output` |
| `NODE_ENV` | Environment mode | No | `production` |
| `DEV` | Development mode flag | No | `false` |
| `DEV_RECORD` | Default recordId for dev mode | No | - |

## Project Structure

```
dx-audit/
├── src/
│   ├── airtable.js          # Airtable API client
│   ├── dataProcessor.js     # Data processing logic
│   ├── reportGenerator.js   # Report generation
│   └── templates/
│       └── report.html      # HTML template
├── output/                  # Generated reports
├── reports/                 # Report assets
├── .env                     # Environment variables (not in git)
├── .env.example            # Example environment file
└── index.js                # Main entry point
```

## Development Mode

Development mode provides:
- Live reload on file changes
- Local development server
- Cached data for faster iteration
- File watching for templates and styles

Start with:
```bash
npm run dev
```

## Security

- `.env` file is gitignored to protect your API keys
- Never commit actual API keys to version control
- Use `.env.example` as a template for required variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

[Add your license here] 