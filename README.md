# AI Playground 🤖

A comprehensive multi-modal AI-powered application built with Next.js 15, featuring advanced document processing, image analysis, and conversation transcription with custom speaker diarization.

## 🎯 Overview

AI Playground is a sophisticated web application that leverages OpenAI's latest models (GPT-4o-mini, GPT-3.5-turbo, and Whisper) to provide three core AI-powered functionalities:

1. **Image Analysis** - Detailed visual analysis using GPT-4o-mini vision capabilities
2. **Document Summarization** - Multi-format document processing with visual PDF analysis
3. **Conversation Analysis** - Audio transcription with custom speaker diarization

## ✨ Key Features

### 🔐 Authentication System
- **NextAuth.js Integration**: Secure credential-based authentication with JWT sessions
- **Protected Routes**: Middleware-based route protection for all application features
- **Demo Access**: Pre-configured demo user for easy testing
  - Email: `demo@example.com`
  - Password: `demo123`
- **Session Management**: Persistent sessions with automatic refresh
- **Custom Login Page**: Branded login interface with pre-filled demo credentials

### 🖼️ Image Analysis
- **Advanced Vision AI**: Powered by GPT-4o-mini with high-detail image processing
- **Format Support**: JPG, PNG, GIF, WebP (up to 20MB)
- **Real-time Preview**: Instant image preview before analysis
- **Detailed Descriptions**: Comprehensive visual analysis including:
  - Object detection and scene understanding
  - Color analysis and composition
  - Text extraction from images
  - Artistic style recognition
  - Spatial relationships and context

### 📄 Document Summarization
- **Multi-Format Support**:
  - **PDF Files**: Visual analysis with page-by-page processing
  - **Office Documents**: DOC/DOCX support via mammoth
  - **Text Files**: TXT, MD, CSV, LOG
  - **Web Pages**: URL content extraction with intelligent parsing
  
- **Advanced PDF Processing**:
  - Converts PDF pages to images (up to 5 pages)
  - Visual analysis using GPT-4o-mini vision model
  - Handles complex layouts including tables, charts, and graphs
  - Fallback text extraction for corrupted or image-based PDFs
  - Combined comprehensive summaries with page-level insights
  - Progress indicators for multi-page processing

- **Web Content Processing**:
  - HTML content extraction and cleaning
  - Automatic text normalization
  - 5MB content limit with 10-second timeout
  - Intelligent content filtering and formatting
  - Support for article extraction from complex websites

### 🎙️ Conversation Analysis
- **Audio Format Support**: MP3, WAV, M4A, WebM, MP4
- **OpenAI Whisper Integration**: High-accuracy transcription
- **Custom Speaker Diarization**:
  - Heuristic-based speaker identification (2 speakers max)
  - Linguistic pattern analysis for speaker changes
  - Question-response pattern recognition
  - First/second person pronoun analysis
  - Agreement/disagreement keyword detection
  - Natural conversation flow detection
- **Conversation Summarization**: GPT-3.5-turbo powered summaries
- **Color-Coded Display**: Visual differentiation between speakers
- **Transcript Export**: Full transcript with speaker labels

### 🛡️ Security & Performance

#### Rate Limiting System
- **Tiered Rate Limits**:
  - Standard API endpoints: 30 requests/minute
  - Heavy operations (PDF processing): 5 requests/minute
  - Authentication attempts: 10 attempts/15 minutes
  - Image processing: 10 requests/minute
- **IP-Based Tracking**: With X-Forwarded-For support for proxies
- **Automatic Cleanup**: Memory-efficient expired entry removal
- **Rate Limit Headers**: Standard HTTP headers for client awareness
- **Retry-After Headers**: Inform clients when to retry

#### Security Features
- **File Validation**: 
  - Type whitelisting for all uploads
  - Size limits (10MB documents, 20MB images)
  - Content-type verification
  - Malicious file detection
- **URL Validation**: Secure URL processing for web content
- **Error Sanitization**: Production-safe error messages
- **API Key Protection**: Secure storage with environment variables
- **CORS Protection**: Configured for production security

### 🎨 User Interface

#### Design System
- **Modern Stack**: Tailwind CSS with custom configuration
- **Typography**: Inter font from Google Fonts
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Color Scheme**: Consistent design tokens with CSS custom properties
- **Accessibility**: ARIA labels and keyboard navigation support

#### Interactive Features
- **Skill Selector**: 
  - Icon-based navigation with descriptive labels
  - Active state indicators
  - Smooth transitions between features
- **History Sidebar**: 
  - Collapsible design with toggle functionality
  - Last 10 analyses with timestamps
  - Quick access to previous results
  - Persistent across sessions
- **File Upload Areas**:
  - Drag-and-drop support
  - Visual feedback on hover/drag
  - File type indicators
  - Progress tracking for uploads
- **Progress Indicators**: 
  - Real-time feedback for long operations
  - Step-by-step progress for PDF processing
  - Estimated time remaining for heavy operations
- **Loading States**: 
  - Animated spinners with contextual messages
  - Skeleton loaders for content areas
  - Smooth transitions

#### Animations & Transitions
- **Fade-in Effects**: Smooth content transitions
- **Hover Animations**: Interactive element feedback
- **State Transitions**: Seamless UI state changes
- **Loading Animations**: Custom CSS animations
- **Micro-interactions**: Subtle feedback for user actions

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript for type safety
- **React**: Version 19 with modern hooks
- **Authentication**: NextAuth.js 4.24
- **Styling**: Tailwind CSS 3.4
- **AI Integration**: OpenAI API SDK

### Core Libraries
- **Document Processing**:
  - `pdf2pic`: PDF to image conversion with GraphicsMagick
  - `pdf-parse`: PDF text extraction fallback
  - `mammoth`: DOC/DOCX processing with style preservation
  - `cheerio`: HTML parsing and extraction
  
- **Media Processing**:
  - `sharp`: Image optimization and processing
  - `wavesurfer.js`: Audio waveform visualization
  - `webm-duration-fix`: WebM file handling
  
- **Security & Auth**:
  - `bcryptjs`: Secure password hashing
  - `next-auth`: Authentication framework
  - Custom rate limiting implementation (Redis-ready)

### API Endpoints

#### `/api/analyze/image`
- **Method**: POST
- **Input**: Image file (multipart/form-data)
- **Output**: Detailed visual analysis
- **Model**: GPT-4o-mini vision
- **Rate Limit**: 10 requests/minute

#### `/api/analyze/document`
- **Method**: POST
- **Input**: File upload or URL
- **Output**: Comprehensive summary
- **Models**: GPT-4o-mini (vision), GPT-3.5-turbo (text)
- **Rate Limit**: 5 requests/minute for PDFs

#### `/api/analyze/conversation`
- **Method**: POST
- **Input**: Audio file
- **Output**: Transcript with diarization and summary
- **Models**: Whisper (transcription), GPT-3.5-turbo (summary)
- **Rate Limit**: 30 requests/minute

#### `/api/auth/[...nextauth]`
- **Methods**: GET, POST
- **Purpose**: Authentication endpoints
- **Features**: Login, logout, session management

## 📁 Project Structure

```
ai-playground/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   ├── conversation/    # Audio processing endpoint
│   │   │   ├── document/        # Document analysis endpoint
│   │   │   └── image/           # Image analysis endpoint
│   │   └── auth/
│   │       └── [...nextauth]/   # Authentication endpoints
│   ├── components/
│   │   ├── AuthProvider.tsx     # Session management wrapper
│   │   ├── ConversationAnalysis.tsx
│   │   ├── DocumentSummarization.tsx
│   │   └── ImageAnalysis.tsx
│   ├── lib/
│   │   ├── auth.ts              # NextAuth configuration
│   │   ├── pdf-parser.ts        # PDF processing utilities
│   │   └── rate-limiter.ts      # Rate limiting implementation
│   ├── login/
│   │   └── page.tsx             # Login interface
│   ├── types/                   # TypeScript types
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout with auth
│   └── page.tsx                 # Main application UI
├── middleware.ts                # Route protection middleware
├── public/                      # Static assets
├── types/
│   └── next-auth.d.ts          # NextAuth type extensions
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── vercel.json                 # Vercel deployment config
└── package.json                # Dependencies and scripts
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-playground
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
```

Generate a secure NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

4. **Run the development server**
```bash
npm run dev
```

5. **Access the application**
Open [http://localhost:3000](http://localhost:3000) and login with:
- Email: `demo@example.com`
- Password: `demo123`

### Build for Production
```bash
npm run build
npm run start
```

## 🔧 Configuration

### Environment Variables
- `NEXTAUTH_URL`: Application URL for authentication callbacks
- `NEXTAUTH_SECRET`: Secret key for JWT encryption
- `OPENAI_API_KEY`: Your OpenAI API key for AI features

### Rate Limits (Configurable in `/app/lib/rate-limiter.ts`)
- Standard operations: 30 req/min
- Heavy operations: 5 req/min
- Auth attempts: 10 attempts/15 min
- Image processing: 10 req/min

### File Size Limits
- Documents: 10MB maximum
- Images: 20MB maximum
- Audio files: 25MB maximum
- URL content: 5MB maximum

## 📝 Usage Examples

### Image Analysis
1. Navigate to the Image Analysis tab
2. Upload an image (JPG, PNG, GIF, or WebP)
3. View real-time preview
4. Click "Analyze" for detailed AI-powered insights
5. Results include object detection, scene understanding, and more

### Document Processing
1. Select Document Summarization tab
2. Choose input method:
   - Upload a file (PDF, DOC, DOCX, TXT, etc.)
   - Enter a URL for web content
3. Wait for processing (progress shown for PDFs)
4. Review comprehensive summary with key insights

### Conversation Analysis
1. Go to Conversation Analysis tab
2. Upload audio file (MP3, WAV, M4A, WebM, MP4)
3. System will:
   - Transcribe using Whisper
   - Identify speakers automatically
   - Generate conversation summary
4. View color-coded transcript with speaker labels

## 🎯 Use Cases

- **Content Creation**: Analyze images for detailed descriptions
- **Research**: Quickly summarize long documents and PDFs
- **Meeting Notes**: Transcribe and summarize recorded conversations
- **Web Research**: Extract and summarize web content
- **Document Analysis**: Process complex PDFs with visual elements
- **Audio Content**: Convert podcasts or interviews to text with speaker identification
- **Academic Work**: Summarize research papers and technical documents
- **Business Intelligence**: Analyze reports and presentations

## 🔒 Security Considerations

- All routes except login are protected by authentication
- File uploads are validated for type and size
- Rate limiting prevents abuse
- API keys are never exposed to the client
- Errors are sanitized in production
- Sessions are encrypted with JWT
- HTTPS required in production
- XSS and CSRF protection built-in
