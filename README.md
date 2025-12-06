# 🍳 Recipe AI Assistant

A full-stack AI-powered recipe assistant built with FastAPI, LangChain, and React. Users can ask cooking questions and get AI-generated answers from a curated knowledge base of recipes. Admins can upload recipe documents and URLs to expand the knowledge base.

## 🌟 Features

### User Features
- 💬 **AI Chat Interface** - Ask cooking questions and get intelligent responses
- 📚 **Source Citations** - See which recipe documents were used for answers
- ⚡ **Real-time Responses** - Fast AI-powered answers using Google's Gemini model
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

### Admin Features
- 🔒 **Secure Admin Panel** - Password-protected admin interface
- 📄 **PDF Upload** - Upload recipe PDFs to the knowledge base
- 📝 **Text File Upload** - Upload .txt recipe files
- 🌐 **URL Ingestion** - Add recipes from web URLs
- ✅ **Upload Confirmation** - Real-time feedback on successful uploads

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **LangChain** - LLM orchestration and RAG implementation
- **Google Gemini** - AI model for generating responses
- **ChromaDB** - Vector database for semantic search
- **SlowAPI** - Rate limiting for API protection
- **Python 3.13+**

### Frontend
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool
- **Vercel** - Frontend hosting

### Infrastructure
- **Render** - Backend hosting
- **ChromaDB Cloud** - Managed vector database

## 📁 Project Structure

```
recipe-ai-assistant/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables (not in git)
│   └── .env.example         # Example environment file
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── api/            # API functions
│   │   ├── config/         # Configuration files
│   │   └── App.tsx         # Main application
│   ├── .env                # Frontend environment variables
│   ├── .env.example        # Example environment file
│   └── package.json        # Node dependencies
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.13+
- Node.js 18+
- Google API Key (Gemini)
- ChromaDB Cloud account

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/AkarshanGupta/rag-testing.git
cd rag-testing/backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Create .env file**
```bash
cp .env.example .env
```

5. **Configure environment variables**
```env
GOOGLE_API_KEY=your_google_api_key_here
CHROMA_API_KEY=your_chroma_api_key
CHROMA_TENANT=your_chroma_tenant
CHROMA_DATABASE=your_chroma_database
ADMIN_SECRET=your_secure_admin_password
```

6. **Run the backend**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd ../frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Configure environment variables**
```env
VITE_API_BASE_URL=http://localhost:8000
```

5. **Run the frontend**
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 🔧 API Documentation

### Endpoints

#### `GET /`
Health check endpoint
```json
Response: {
  "status": "Running",
  "security": "Active"
}
```

#### `POST /ask`
Ask a recipe question (Public - Rate Limited: 20/min)
```json
Request:
{
  "question": "How do I make pasta carbonara?"
}

Response:
{
  "answer": "To make pasta carbonara...",
  "source_documents": ["recipe1.pdf", "https://example.com/recipe"]
}
```

#### `POST /ingest-url`
Upload a recipe URL (Admin Only - Rate Limited: 5/min)
```bash
Headers:
  x-admin-token: YOUR_ADMIN_SECRET

Body (form-data):
  url: "https://example.com/recipe"

Response:
{
  "message": "Success! Ingested https://example.com/recipe"
}
```

#### `POST /ingest-file`
Upload a recipe file (Admin Only - Rate Limited: 5/min)
```bash
Headers:
  x-admin-token: YOUR_ADMIN_SECRET

Body (form-data):
  file: [PDF or TXT file]

Response:
{
  "message": "Success! Ingested filename.pdf"
}
```

## 🔐 Security Features

- **Rate Limiting** - Prevents API abuse
- **Admin Authentication** - Secure token-based admin access
- **CORS Protection** - Configured for specific frontend domains
- **Input Validation** - Pydantic models for request validation
- **Error Handling** - Graceful error responses

## 🌐 Deployment

### Backend Deployment (Render)

1. Create new Web Service on Render
2. Connect your GitHub repository
3. Configure build command:
```bash
pip install -r requirements.txt
```
4. Configure start command:
```bash
uvicorn main:app --host 0.0.0.0 --port 10000
```
5. Add environment variables in Render dashboard
6. Deploy!

### Frontend Deployment (Vercel)

1. Push frontend code to GitHub
2. Import project on Vercel
3. Configure environment variables
4. Deploy!

**Live URLs:**
- Backend: `https://rag-testing-m7nf.onrender.com`
- Frontend: `https://rag-frontend-ashy-sigma.vercel.app`

## 📦 Dependencies

### Backend (requirements.txt)
```
fastapi==0.123.10
uvicorn==0.38.0
python-dotenv==1.2.1
python-multipart==0.0.20
slowapi==0.1.9
chromadb==1.3.5
langchain==1.1.2
langchain-core==1.1.1
langchain-chroma==1.0.0
langchain-community==0.4.1
langchain-google-genai==3.2.0
langchain-text-splitters==1.0.0
pypdf==6.4.0
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "typescript": "^5.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "tailwindcss": "^3.x"
  }
}
```

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors, ensure:
1. Backend has CORS middleware configured
2. Frontend URL is in `allow_origins` list
3. Backend is running and accessible

### Rate Limit Errors
If you hit rate limits:
- Wait 1 minute before retrying
- User endpoint: 20 requests/minute
- Admin endpoints: 5 requests/minute

### Module Import Errors
Ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Environment Variables Not Loading
Check that:
1. `.env` file exists in the correct directory
2. Variable names match exactly (case-sensitive)
3. No quotes around values unless needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - [GitHub Profile](https://github.com/AkarshanGupta)

## 🙏 Acknowledgments

- Google Gemini for AI capabilities
- LangChain for RAG framework
- ChromaDB for vector storage
- FastAPI for the amazing web framework
- Anthropic Claude for development assistance

## 📧 Support

For support, email akarshangupta14@gmail.com or open an issue on GitHub.

---

**⭐ Star this repo if you find it helpful!**
