# Digital Experience Audit Report Generator

A Node.js application that generates comprehensive digital experience audit reports from Airtable data.

## Features

- 📊 Fetches audit data from Airtable
- 📈 Generates interactive HTML reports with charts
- 🎯 User journey analysis with visual attention insights
- 📋 Detailed findings and recommendations
- 🎨 Modern, responsive design

## Setup

### Prerequisites

- Node.js (v14 or higher)
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
```

### Getting Airtable Credentials

1. **API Key**: Go to [Airtable Account](https://airtable.com/account) → API → Generate API key
2. **Base ID**: Found in your Airtable URL: `https://airtable.com/appXXXXXXXXXXXXXX`
3. **Table Name**: Found in your table settings or URL

## Usage

Generate audit reports:
```bash
npm start
```

Reports will be generated in the `output/` directory.

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

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AIRTABLE_API_KEY` | Your Airtable API key | Yes |
| `AIRTABLE_BASE_ID` | Your Airtable base ID | Yes |
| `AIRTABLE_TABLE_NAME` | Your Airtable table name | Yes |

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