# ResumeMatch AI

A modern, production-ready web application that analyzes resumes against job descriptions using AI-powered matching. Built for students, fresh graduates, and job seekers to improve their resume alignment with job requirements.

## Overview

ResumeMatch AI leverages OpenAI's GPT models to provide comprehensive resume analysis including:
- **Match Percentage**: Realistic scoring of resume-job description alignment
- **Skill Matching**: Identification of matching and missing skills
- **Actionable Suggestions**: Specific recommendations to improve resume match

## Features

- **PDF Resume Upload**: Secure upload and parsing of PDF resumes
- **Job Description Analysis**: Paste and analyze any job description
- **AI-Powered Matching**: Uses OpenAI GPT-4o-mini for accurate analysis
- **Structured Results**: Clear visualization of match percentage, skills, and suggestions
- **Professional UI**: Clean, enterprise-style interface suitable for professional use
- **Responsive Design**: Optimized for desktop and mobile devices
- **Error Handling**: Comprehensive error handling for API failures and invalid inputs
- **Type Safety**: Full TypeScript implementation with Zod validation

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Groq API (Llama 3.1 70B) - Free tier available with fast inference
- **PDF Parsing**: pdf-parse-new
- **Validation**: Zod

## Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm
- Groq API key - **FREE** ([Get one here](https://console.groq.com/keys))
  - Free tier: 14,400 requests per day (600 requests/hour)
  - Fast inference with LPUs (Language Processing Units)
  - No credit card required

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd resumematch-ai
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

**Note:** If you encounter PDF parsing errors, try rebuilding native dependencies:
```bash
npm rebuild
# or delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Groq API key:

```
GROQ_API_KEY=your_groq_api_key_here
```

**Note:** Groq offers a generous free tier (14,400 requests/day, 600 requests/hour) with extremely fast inference. Get your free API key at https://console.groq.com/keys

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
resumematch-ai/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # API route for resume analysis
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home page
├── components/
│   ├── AnalysisResults.tsx        # Results display component
│   ├── FileUpload.tsx             # PDF upload component
│   └── ResumeAnalyzer.tsx         # Main analyzer component
├── lib/
│   ├── openai.ts                  # OpenAI integration and prompts
│   └── pdfParser.ts               # PDF text extraction utility
├── public/                        # Static assets
└── package.json
```

## Environment Variables

| Variable | Description | Required | Free Tier |
|----------|-------------|----------|-----------|
| `GROQ_API_KEY` | Your Groq API key | Yes | Yes (14,400 req/day, 600/hr) |

**Getting a Free API Key:**
1. Visit https://console.groq.com/keys
2. Sign up for a free account (no credit card required)
3. Click "Create API Key"
4. Copy the key and add it to your `.env.local` file

**Why Groq?**
- Fast inference with LPUs (Language Processing Units)
- Generous free tier: 14,400 requests per day
- No credit card required
- Reliable availability worldwide

## Usage

1. **Upload Resume**: Click the upload area or drag and drop a PDF resume file
2. **Paste Job Description**: Enter the job description in the text area
3. **Analyze**: Click "Analyze Resume" to start the analysis
4. **Review Results**: View the match percentage, matched/missing skills, and suggestions
5. **Reset**: Click "Reset" to start a new analysis

## API Details

### Analyze Endpoint

**POST** `/api/analyze`

**Form Data:**
- `resumeFile`: PDF file (required)
- `jobDescription`: Text string (required)

**Response:**
```json
{
  "matchPercentage": 75.5,
  "matchedSkills": ["JavaScript", "React", "TypeScript"],
  "missingSkills": ["Python", "Docker"],
  "suggestions": [
    "Add Python experience if available",
    "Highlight Docker experience if applicable"
  ]
}
```

**Error Responses:**
- `400`: Invalid input (missing file, invalid file type, empty job description)
- `500`: Server error (API failure, parsing error)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add the `OPENAI_API_KEY` environment variable in project settings
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

Make sure to set the `GROQ_API_KEY` environment variable in your deployment platform.

## Architecture Decisions

### Prompt Engineering

The Groq integration uses a carefully crafted system prompt to ensure:
- **Structured Output**: JSON format enforced via `response_format`
- **Consistency**: Lower temperature (0.3) for more predictable results
- **Accuracy**: Detailed instructions for match percentage calculation
- **Completeness**: Clear requirements for all response fields

### PDF Parsing

Uses `pdf-parse-new` library which:
- Handles text extraction from PDF files
- Supports various PDF formats with better compatibility
- Pure JavaScript implementation (no native dependencies)
- Provides robust error handling for corrupted files

### Validation

Zod schemas ensure:
- Type safety at runtime
- Validation of AI responses
- Clear error messages for malformed data

## Troubleshooting

### PDF Parsing Errors

If you encounter errors like "Cannot read properties of undefined" or "Failed to parse PDF":

1. **Reinstall Dependencies**: If you encounter parsing issues, try reinstalling:
   ```bash
   npm install
   ```

2. **Reinstall Dependencies**: If rebuilding doesn't work:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check PDF Format**: Ensure your PDF contains selectable text (not just scanned images). Image-based PDFs cannot be parsed.

4. **Try a Different PDF**: Some PDF formats may not be fully supported. Try exporting your resume as a new PDF from your source application.

5. **File Size**: Very large PDF files (>10MB) may cause issues. Try optimizing your PDF file size.

### API Errors

If you encounter Groq API errors:

1. **Verify API Key**: Ensure your `GROQ_API_KEY` is correctly set in `.env.local`
2. **Check Free Tier Limits**: Free tier allows 14,400 requests/day (600 requests/hour)
3. **Get API Key**: If you don't have one, get a free key at https://console.groq.com/keys
4. **Network Issues**: Check your internet connection and firewall settings

## Future Improvements

- [ ] Support for multiple file formats (DOCX, TXT)
- [ ] Resume template recommendations based on job description
- [ ] Historical analysis tracking
- [ ] Export analysis results as PDF
- [ ] User authentication and saved analyses
- [ ] Comparison of multiple job descriptions
- [ ] Industry-specific analysis models
- [ ] Integration with job board APIs
- [ ] Bulk resume analysis
- [ ] ATS (Applicant Tracking System) compatibility scoring

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.
