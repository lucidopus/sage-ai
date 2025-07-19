# AI Co-Scientist Frontend

A modern React/Next.js frontend application for the AI Co-Scientist platform that generates scientific hypotheses from natural language research goals.

## Features

- **Research Goal Input**: Natural language interface for describing research objectives
- **AI-Generated Hypotheses**: Displays up to 5 scientific hypotheses with detailed analysis
- **Analytics Dashboard**: Shows confidence scores, processing time, and hypothesis statistics
- **Interactive Hypothesis Viewer**: Navigate between hypotheses with detailed views
- **Environment-based Configuration**: Simple backend setup via environment variables
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm, yarn, or pnpm
- A running FastAPI backend (see backend configuration below)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sage-ai
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Backend Configuration

### Setting up the API Connection

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` with your actual backend configuration:
   - **NEXT_PUBLIC_BACKEND_URL**: Your FastAPI backend URL
   - **NEXT_PUBLIC_BACKEND_API_KEY**: Your API key (if required)

### Backend API Requirements

Your FastAPI backend should provide the following endpoint:

```
POST /query
Content-Type: application/json

Request Body:
{
  "query": "string",
  "max_hypotheses": 5
}

Response:
{
  "hypotheses": [
    {
      "title": "string",
      "description": "string",
      "confidence_score": 0.85,
      "methodology": "string",
      "expected_outcomes": ["string", "string"],
      "resources_needed": ["string", "string"],
      "timeline_estimate": "string"
    }
  ],
  "query_id": "string",
  "processing_time": 1500,
  "total_hypotheses": 5
}
```

## Usage

### Generating Hypotheses

1. Enter your research goal in natural language in the text area
2. Click "Generate Hypotheses" to send the request to your backend
3. Wait for the AI to process your request (loading indicator will show)
4. Once complete, click "View Hypotheses" to see the results

### Viewing Results

- **Hypotheses List**: Left sidebar shows all generated hypotheses with confidence scores
- **Detailed View**: Main panel shows comprehensive details for the selected hypothesis
- **Navigation**: Use Previous/Next buttons or click hypotheses in the sidebar
- **Analytics**: Header shows key metrics about the generation process

### Example Research Goals

- "I want to understand the relationship between social media usage and mental health in teenagers"
- "Investigate the impact of microplastics on marine ecosystem biodiversity"
- "Explore the effectiveness of different renewable energy storage solutions"
- "Study the correlation between urban green spaces and air quality improvement"

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Main research input page
│   ├── hypotheses/page.tsx      # Hypotheses results page
│   ├── layout.tsx              # Root layout with error boundary
│   └── globals.css             # Global styles
├── components/
│   ├── ApiSettings.tsx         # Backend configuration modal
│   └── ErrorBoundary.tsx       # Error handling component
├── config/
│   └── api.ts                  # API configuration constants
├── services/
│   └── api.ts                  # API service for backend communication
└── types/
    └── api.ts                  # TypeScript type definitions
```

## Environment Variables

The application requires environment variables for backend configuration:

```bash
# .env.local (required)
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
NEXT_PUBLIC_BACKEND_API_KEY=your-api-key
```

**Important**: You must create a `.env.local` file with your backend URL for the application to work.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with modern design
- **State Management**: React hooks (useState, useEffect)
- **Data Storage**: localStorage for settings
- **Error Handling**: React Error Boundaries

## Deployment

### Vercel (Recommended)

1. Push your code to a Git repository
2. Connect your repository to [Vercel](https://vercel.com)
3. Deploy with default settings

### Other Platforms

This is a standard Next.js application and can be deployed to any platform that supports Node.js:

- Netlify
- Railway
- Heroku
- AWS Amplify
- Google Cloud Run

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check your backend URL in settings
   - Ensure your backend is running and accessible
   - Verify CORS settings on your backend

2. **Hypotheses Not Loading**
   - Check browser console for errors
   - Verify your backend returns data in the expected format
   - Test your API endpoint with curl or Postman

3. **Settings Not Saving**
   - Ensure localStorage is enabled in your browser
   - Check browser console for JavaScript errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]