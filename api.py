import base64 #for images
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel #for request body validation
import data
import httpx
""'api.py is FastAPI web server that will warp the functions in data.py and expose them as API endpoints.'"" 


app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- Model for creating a book ---
class Book(BaseModel):
    title: str
    author: str
    genre: str | None = None
    series: str | None = None
    position: int | None = None
    tags: str | None = None
    language: str | None = None
    published_date: str | None = None
    read_year: int | None = None
    rating: float | None = None
    notes: str | None = None
    isbn: str | None = None
    cover_image: str | None = None # Base64 encoded string for the image
    cover_url: str | None = None
    
    
#---- Get / Books ----
@app.get("/books")
def get_books():
    books = data.list_books()
    for book in books:
        if book["cover_image"]:
            book["cover_image"] = base64.b64encode(book["cover_image"]).decode('utf-8') # Convert bytes to base64 string
        if book["cover_url"]:
            book["cover_url"] = book["cover_url"]  # Keep the cover URL as is
    return books


# --- Post / Books ---
@app.post("/books")
def create_book(book: Book):
    cover_image_bytes = base64.b64decode(book.cover_image) if book.cover_image else None # Decode base64 string to bytes
    return data.add_book(
        title=book.title,
        author=book.author,
        genre=book.genre,
        series=book.series,
        position=book.position,
        tags=book.tags,
        language=book.language,
        published_date=book.published_date,
        read_year=book.read_year,
        rating=book.rating,
        notes=book.notes,
        isbn=book.isbn,
        cover_image=cover_image_bytes,
        cover_url=book.cover_url
    )


#--- PUT / series progress ---
class SeriesProgress(BaseModel):
    series_title: str
    status: str
    
@app.put("/series/{series_title}/progress")
def update_series_progress(series_title: str, body: SeriesProgress):
    result = data.set_series_progress(series_title=series_title, status=body.status)
    if result is None:
        raise HTTPException(status_code=404, detail="Series not found")
    return result

#--- Search books by title ---
@app.get("/search")
async def search_books(q: str):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://openlibrary.org/search.json",
            params={"q": q, "maxResults": 10}
        )
        
        res.raise_for_status()
        
    docs = res.json().get("docs", [])
    return [
        {
            "title": book.get("title", "Unknown title"),
            "author": ", ".join(book.get("author_name", [])),
            "published_date": str(book.get("first_publish_year"))
                if book.get("first_publish_year") else None,
            "genre": book.get("subject", [None])[0],
            "isbn": next(
                (
                    isbn for isbn in book.get("isbn", [])
                    if len(isbn) == 13
                ),
                None,
            ),
            "cover": (
                f"https://covers.openlibrary.org/b/id/{book['cover_i']}-M.jpg"
                if book.get("cover_i")
                else None
            ),
            "description": "",
        }
        for book in docs
    ]

