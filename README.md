# AI Playground

A multi-modal AI-powered playground application with authentication and three core capabilities: Conversation Analysis, Image Analysis, and Document/URL Summarization.

## Features

- **Authentication**: Secure login system with demo credentials
- **Conversation Analysis**: Upload audio files for transcription, speaker diarization (2 speakers max), and summarization
- **Image Analysis**: Upload images to generate detailed descriptions
- **Document/URL Summarization**: Upload PDFs/DOC files or provide URLs for content summarization
- **History Tracking**: View last 10 interactions
- **Clean UI**: Linear-inspired minimalistic design

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-playground
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
OPENAI_API_KEY=your-openai-api-key-here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Demo Credentials

- Email: `demo@example.com`
- Password: `demo123`

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **AI Integration**: OpenAI API
- **File Processing**: pdf-parse, mammoth, cheerio

## Project Structure

```
ai-playground/
├── app/
│   ├── api/              # API routes for analysis
│   ├── components/       # React components
│   ├── lib/             # Utility functions
│   ├── login/           # Login page
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main application page
├── types/               # TypeScript type definitions
├── public/              # Static assets
└── middleware.ts        # Authentication middleware
```

## API Endpoints

- `/api/auth/[...nextauth]` - Authentication
- `/api/analyze/conversation` - Audio analysis
- `/api/analyze/image` - Image description
- `/api/analyze/document` - Document/URL summarization

## Building for Production

```bash
npm run build
npm run start
```

## Deployment

The application can be deployed to Vercel:

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

## Notes

- The application uses mock data when OPENAI_API_KEY is not configured
- File size limits: 10MB for uploads
- Supported audio formats: All common audio formats
- Supported image formats: JPG, PNG, GIF, WebP
- Supported document formats: PDF, DOC, DOCX
- URL summarization works with publicly accessible web pages

## Security Considerations

- Change `NEXTAUTH_SECRET` in production
- Keep your `OPENAI_API_KEY` secure
- The demo uses hardcoded credentials for simplicity; implement proper user management in production
- Consider implementing rate limiting for API endpoints

## License

MIT