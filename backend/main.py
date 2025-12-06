# import os
# import shutil
# import tempfile
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()

# from fastapi import FastAPI, UploadFile, File, HTTPException, Form
# from pydantic import BaseModel
# import chromadb

# # --- LANGCHAIN IMPORTS ---
# # If these are red in VS Code, follow the "Fix the Red Errors" steps above!
# from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
# from langchain_chroma import Chroma
# from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader, TextLoader
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_classic.chains import create_retrieval_chain
# from langchain_classic.chains.combine_documents import create_stuff_documents_chain
# from langchain_core.prompts import ChatPromptTemplate

# # --- CONFIGURATION ---
# GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
# CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
# CHROMA_TENANT = os.getenv("CHROMA_TENANT")
# CHROMA_DATABASE = os.getenv("CHROMA_DATABASE")

# if not GOOGLE_API_KEY or not CHROMA_API_KEY:
#     raise ValueError("Missing API Keys. Please check your .env file.")

# app = FastAPI(title="Recipe Assistant (Gemini 2.0)")

# # --- 1. SETUP EMBEDDINGS ---
# embedding_function = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

# # --- 2. SETUP CHROMA CLOUD ---
# cloud_client = chromadb.CloudClient(
#     tenant=CHROMA_TENANT,
#     database=CHROMA_DATABASE,
#     api_key=CHROMA_API_KEY
# )

# vectorstore = Chroma(
#     client=cloud_client,
#     embedding_function=embedding_function,
#     collection_name="my_recipes_v2" 
# )

# # --- MODELS ---
# class QueryRequest(BaseModel):
#     question: str

# class QueryResponse(BaseModel):
#     answer: str
#     source_documents: list[str]

# # --- HELPERS ---
# def get_loader(file_path: str, file_type: str):
#     if file_type == "application/pdf":
#         return PyPDFLoader(file_path)
#     elif file_type == "text/plain":
#         return TextLoader(file_path)
#     else:
#         raise ValueError("Unsupported file type")

# # --- ROUTES ---

# @app.get("/")
# def health_check():
#     return {"status": "Running", "model": "Gemini 2.0 Flash"}

# @app.post("/ingest-url")
# async def ingest_url(url: str = Form(...)):
#     """
#     Run this ONCE with a recipe URL to fix the 'Awaiting Data' message.
#     """
#     try:
#         loader = WebBaseLoader(url)
#         docs = loader.load()
#         text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
#         splits = text_splitter.split_documents(docs)
#         vectorstore.add_documents(documents=splits)
#         return {"message": f"Success! Ingested {url}. Check your Chroma Dashboard now."}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/ingest-file")
# async def ingest_file(file: UploadFile = File(...)):
#     try:
#         with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as tmp:
#             shutil.copyfileobj(file.file, tmp)
#             tmp_path = tmp.name

#         loader = get_loader(tmp_path, file.content_type)
#         docs = loader.load()
#         text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
#         splits = text_splitter.split_documents(docs)
#         vectorstore.add_documents(documents=splits)
#         os.remove(tmp_path)
#         return {"message": f"Success! Ingested {file.filename}."}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/ask", response_model=QueryResponse)
# async def ask_question(request: QueryRequest):
#     # 1. Retrieve
#     retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})
    
#     # 2. LLM (Gemini 2.0 Flash)
#     llm = ChatGoogleGenerativeAI(
#         model="gemini-2.0-flash",
#         temperature=0.3
#     )

#     # 3. Prompt
#     system_prompt = (
#         "You are a master chef. "
#         "Use the retrieved context to answer the question. "
#         "If the answer is not in the context, say 'I don't know'.\n\n"
#         "Context:\n{context}"
#     )
    
#     prompt = ChatPromptTemplate.from_messages([
#         ("system", system_prompt),
#         ("human", "{input}"),
#     ])

#     # 4. Run Chain
#     question_answer_chain = create_stuff_documents_chain(llm, prompt)
#     rag_chain = create_retrieval_chain(retriever, question_answer_chain)
#     result = rag_chain.invoke({"input": request.question})

#     sources = [doc.metadata.get("source", "Unknown") for doc in result.get("context", [])]
#     return {
#         "answer": result["answer"],
#         "source_documents": list(set(sources))
#     }

import os
import shutil
import tempfile
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Header, Depends, Request
from pydantic import BaseModel
import chromadb

# --- 1. NEW SECURITY IMPORTS ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- LANGCHAIN IMPORTS (Corrected) ---
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
# NOTE: 'langchain_classic' is not standard. Using standard 'langchain.chains'
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

# --- CONFIGURATION CHECKS ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE")
ADMIN_SECRET = os.getenv("ADMIN_SECRET")  # <--- NEW: Get the password

if not GOOGLE_API_KEY or not CHROMA_API_KEY:
    raise ValueError("Missing API Keys in .env file")

if not ADMIN_SECRET:
    print("⚠️ WARNING: ADMIN_SECRET is missing. Admin routes will be insecure!")

# --- 2. SETUP RATE LIMITER ---
# This tracks users by their IP address to stop spam
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Recipe Assistant (Secured)")

# Connect the rate limiter to the app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- SETUP EMBEDDINGS ---
embedding_function = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

# --- SETUP CHROMA CLOUD ---
cloud_client = chromadb.CloudClient(
    tenant=CHROMA_TENANT,
    database=CHROMA_DATABASE,
    api_key=CHROMA_API_KEY
)

vectorstore = Chroma(
    client=cloud_client,
    embedding_function=embedding_function,
    collection_name="my_recipes_v2" 
)

# --- MODELS ---
class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str
    source_documents: list[str]

# --- 3. SECURITY FUNCTION (THE BOUNCER) ---
async def verify_admin(x_admin_token: str = Header(None)):
    """
    Checks if the user sent the correct password in the header.
    If not, kicks them out with a 403 Forbidden error.
    """
    if x_admin_token != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Unauthorized: Invalid Admin Token")

# --- HELPERS ---
def get_loader(file_path: str, file_type: str):
    if file_type == "application/pdf":
        return PyPDFLoader(file_path)
    elif file_type == "text/plain":
        return TextLoader(file_path)
    else:
        raise ValueError("Unsupported file type")

# --- ROUTES ---

@app.get("/")
def health_check():
    return {"status": "Running", "security": "Active"}

@app.post("/ingest-url", dependencies=[Depends(verify_admin)]) # <--- LOCKED
@limiter.limit("5/minute") # <--- RATE LIMITED
async def ingest_url(request: Request, url: str = Form(...)):
    """
    Upload a URL. Requires 'x-admin-token' header.
    """
    try:
        loader = WebBaseLoader(url)
        docs = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        vectorstore.add_documents(documents=splits)
        return {"message": f"Success! Ingested {url}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest-file", dependencies=[Depends(verify_admin)]) # <--- LOCKED
@limiter.limit("5/minute")
async def ingest_file(request: Request, file: UploadFile = File(...)):
    """
    Upload a File. Requires 'x-admin-token' header.
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        loader = get_loader(tmp_path, file.content_type)
        docs = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        vectorstore.add_documents(documents=splits)
        os.remove(tmp_path)
        return {"message": f"Success! Ingested {file.filename}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/ask", response_model=QueryResponse)
@limiter.limit("20/minute")
async def ask_question(request: Request, query_body: QueryRequest):
    # 1. Retrieve
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})
    
    # 2. LLM
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.3
    )

    # 3. Prompt
    system_prompt = (
        "You are a master chef. "
        "Use the retrieved context to answer the question. "
        "If the answer is not in the context, say 'I don't know'.\n\n"
        "Context:\n{context}"
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    # 4. Format documents function
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    # 5. Create the RAG chain using LCEL (LangChain Expression Language)
    from langchain_core.runnables import RunnablePassthrough
    from langchain_core.output_parsers import StrOutputParser
    
    rag_chain = (
        {
            "context": retriever | format_docs,
            "input": RunnablePassthrough()
        }
        | prompt
        | llm
        | StrOutputParser()
    )
    
    # 6. Invoke the chain
    answer = rag_chain.invoke(query_body.question)
    
    # 7. Get source documents separately for the response
    docs = retriever.invoke(query_body.question)
    sources = [doc.metadata.get("source", "Unknown") for doc in docs]
    
    return {
        "answer": answer,
        "source_documents": list(set(sources))
    }