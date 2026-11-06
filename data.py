import sqlite3
import json
import argparse
import uuid

DB_PATH = "books.db"

def uid() -> str:  # Generate a unique identifier
    return str(uuid.uuid4())

def connect(): # Connect to the SQLite database
    con = sqlite3.connect(DB_PATH)
    con.execute("PRAGMA foreign_keys = ON;")
    con.execute("""
        CREATE TABLE IF NOT EXISTS UserSeriesProgress (
            series_id TEXT PRIMARY KEY,
            status TEXT CHECK(status IN ('reading', 'completed', 'dropped', 'TBR')),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (series_id) REFERENCES Series(id) ON DELETE CASCADE
        )
    """)
    cols = [r[1] for r in con.execute("PRAGMA table_info(Series)")]
    if "total_books" not in cols:
        con.execute("ALTER TABLE Series ADD COLUMN total_books INTEGER")
    if "parts_json" not in cols:
        con.execute("ALTER TABLE Series ADD COLUMN parts_json TEXT")
    return con

def get_or_create_id_by_name(con: sqlite3.Connection, table: str, name: str) -> str:
    # Check if an entry with the given name exists in the specified table.
    cur = con.cursor()
    cur.execute(f"SELECT id FROM {table} WHERE name = ?", (name,))
    row = cur.fetchone()
    if row:
        return row[0]
    new_id = uid()
    cur.execute(f"INSERT INTO {table} (id, name) VALUES (?, ?)", (new_id, name))
    return new_id

def add_author(name: str, country: str | None = None):
    con = connect()
    cur = con.cursor()
    aid = uid()
    cur.execute("INSERT INTO Authors (id, name, country) VALUES (?, ?, ?)", (aid, name, country))
    con.commit()
    con.close()
    print({"id": aid, "name": name})

def add_book(
    title: str,
    author: str,
    genre: str | None = None,
    series: str | None = None,
    position: int | None = None,
    tags: str | None = None,
    language: str | None = None,
    published_date: str | None = None,
    read_year: int | None = None,
    rating: float | None = None,
    notes: str | None = None,
    isbn: str | None = None,
    cover_image: bytes | None = None,
    cover_url: str | None = None,
):
    con = connect()
    cur = con.cursor()

    author_id = get_or_create_id_by_name(con, "Authors", author)
    genre_id = get_or_create_id_by_name(con, "Genres", genre) if genre else None
    

    series_id = None
    if series:
        cur.execute("SELECT id FROM Series WHERE title = ?", (series,))
        r = cur.fetchone()
        if r:
            series_id = r[0]
        else:
            series_id = uid()
            cur.execute(
                "INSERT INTO Series (id, title, author_id, status, notes) VALUES (?, ?, ?, ?, ?)",
                (series_id, series, author_id, None, None),
            )

    book_id = uid()
    cur.execute(
        """
        INSERT INTO Books
            (id, title, author_id, series_id, genre_id, language, published_date, read_year, rating, notes, isbn, cover_image, cover_url)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            book_id,
            title,
            author_id,
            series_id,
            genre_id,
            language,
            published_date,
            read_year,
            rating,
            notes,
            isbn,
            cover_image,
            cover_url,
        ),
    )

    if series_id and position is not None:
        cur.execute(
            "INSERT OR REPLACE INTO series_books (series_id, book_id, position) VALUES (?, ?, ?)",
            (series_id, book_id, position),
        )

    if tags:
        for t in [x.strip() for x in tags.split(",") if x.strip()]:
            tag_id = get_or_create_id_by_name(con, "tags", t)
            cur.execute(
                "INSERT OR IGNORE INTO BookTags (book_id, tag_id) VALUES (?, ?)",
                (book_id, tag_id),
            )

    con.commit()
    con.close()
    #print({"id": book_id, "title": title})
    return {"id": book_id, "title": title}

def list_books():
    con = connect()
    cur = con.cursor()
    cur.execute(
        """
        SELECT
          b.id,
          b.title,
          a.name AS author,
          g.name AS genre,
          s.title AS series,
          (SELECT sb.position FROM series_books sb WHERE sb.book_id = b.id AND sb.series_id = b.series_id LIMIT 1) AS position,
          b.language,
          b.published_date,
          b.read_year,
          b.rating,
          b.isbn,
          b.cover_image,
          b.cover_url,
          GROUP_CONCAT(t.name, ', ') AS tags,
          b.notes 
        FROM Books b
        LEFT JOIN Authors a ON a.id = b.author_id
        LEFT JOIN Genres g ON g.id = b.genre_id
        LEFT JOIN Series s ON s.id = b.series_id
        LEFT JOIN BookTags bt ON bt.book_id = b.id
        LEFT JOIN tags t ON t.id = bt.tag_id
        GROUP BY b.id
        ORDER BY b.title ASC
        """
    )
    
    dict_books = []
    
    for row in cur.fetchall():
        dict_books.append({
            "id": row[0],
            "title": row[1],
            "author": row[2],
            "genre": row[3],
            "series": row[4],
            "position": row[5],
            "language": row[6],
            "published_date": row[7],
            "read_year": row[8],
            "rating": row[9],
            "isbn": row[10],
            "cover_image": row[11],
            "cover_url": row[12],
            "tags": row[13],
            "notes": row[14],
        })
        
        """print({
            "id": row[0],
            "title": row[1],
            "author": row[2],
            "genre": row[3],
            "series": row[4],
            "position": row[5],
            "language": row[6],
            "published_date": row[7],
            "read_year": row[8],
            "rating": row[9],
            "isbn": row[10],
            "cover_image": row[11],
            "tags": row[12],
        })"""
    con.close()
    
    return dict_books


def set_series_progress(series_title: str, status: str):
    con = connect() # Connect to the database
    cur = con.cursor() # Create a cursor object to execute SQL commands
    
    cur.execute("SELECT id FROM Series WHERE title = ?", (series_title,))
    row = cur.fetchone() # Check if the series exists
    if not row:
        print(f"Series '{series_title}' not found.")
        con.close()
        return
    
    series_id = row[0] # Get the series ID
    cur.execute("""
        INSERT INTO UserSeriesProgress (series_id, status)
        VALUES (?, ?)
        ON CONFLICT(series_id) DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP
    """, (series_id, status)) # Insert or update the series progress
    
    dict_status = {
        "series_id": series_id,
        "status": status
    }
    
    con.commit() # Commit the transaction
    con.close() # Close the database connection
    #print(f"Series '{series_title}' progress set to '{status}'.")
    return dict_status
    
def set_book_rating(book_id: str, rating: float):
    con = connect()
    cur = con.cursor()
    cur.execute("UPDATE Books SET rating = ? WHERE id = ?", (rating, book_id))
    con.commit()
    updated = cur.rowcount
    con.close()
    if not updated:
        print(f"Book with ID '{book_id}' not found.")
        return
    return {"book_id": book_id, "rating": rating}

def set_book_notes(book_id: str, notes: str | None):
    con = connect()
    cur = con.cursor()
    cur.execute("UPDATE Books SET notes = ? WHERE id = ?", (notes, book_id))
    con.commit()
    updated = cur.rowcount
    con.close()
    if not updated:
        return
    return {"book_id": book_id, "notes": notes}

def update_book(book_id: str, title: str, author: str, genre: str | None = None, series: str | None = None,
                position: int | None = None, tags: str | None = None, language: str | None = None,
                published_date: str | None = None, read_year: int | None = None, rating: float | None = None,
                notes: str | None = None, isbn: str | None = None, cover_image: bytes | None = None,
                cover_url: str | None = None):
    con = connect()
    cur = con.cursor()
    cur.execute("""
        UPDATE Books
        SET title = ?, author = ?, genre = ?, series = ?, position = ?, tags = ?, language = ?, published_date = ?,
            read_year = ?, rating = ?, notes = ?, isbn = ?, cover_image = ?, cover_url = ?
        WHERE id = ?
    """, (title, author, genre, series, position, tags, language, published_date, read_year, rating, notes, isbn,
          cover_image, cover_url, book_id))
    con.commit()
    updated = cur.rowcount
    con.close()
    if not updated:
        return
    return {"book_id": book_id, "title": title, "author": author, "genre": genre, "series": series, "position": position,
            "tags": tags, "language": language, "published_date": published_date, "read_year": read_year,
            "rating": rating, "notes": notes, "isbn": isbn, "cover_image": cover_image, "cover_url": cover_url}


def delete_book(book_id: str):
    con = connect()
    cur = con.cursor()
    cur.execute("DELETE FROM Books WHERE id = ?", (book_id,))
    con.commit()
    deleted = cur.rowcount
    con.close()
    if not deleted:
        return
    return {"book_id": book_id}

def _series_books(cur, series_id: str) -> list[dict]:
    # A book counts as read when read_year is set
    cur.execute("""
        SELECT b.id, b.title, sb.position, b.read_year, b.rating
        FROM Books b
        LEFT JOIN series_books sb ON sb.book_id = b.id AND sb.series_id = b.series_id
        WHERE b.series_id = ?
        ORDER BY sb.position IS NULL, sb.position, b.title
    """, (series_id,))
    return [
        {"id": r[0], "title": r[1], "position": r[2], "read_year": r[3],
         "rating": r[4], "read": r[3] is not None, "owned": True}
        for r in cur.fetchall()
    ]


def _merge_known_parts(owned: list[dict], parts: list[dict]) -> list[dict]:
    """Owned books replace the known part at the same position; the rest show as not owned."""
    by_position = {}
    for b in owned:
        by_position.setdefault(b["position"], b)
    merged = []
    for part in parts:
        book = by_position.pop(part["position"], None)
        merged.append(book or {
            "id": None, "title": part["title"], "position": part["position"],
            "read_year": None, "rating": None, "read": False, "owned": False,
        })
    # Owned books that don't match a known position (or have none) go at the end
    leftovers = [b for b in owned if b not in merged]
    return merged + leftovers


def _series_rows(cur, where: str = "", params: tuple = ()) -> list[dict]:
    cur.execute(f"""
        SELECT s.id, s.title, a.name, s.status, p.status, s.parts_json
        FROM Series s
        LEFT JOIN Authors a ON a.id = s.author_id
        LEFT JOIN UserSeriesProgress p ON p.series_id = s.id
        {where}
        ORDER BY s.title
    """, params)
    result = []
    for sid, title, author, status, progress, parts_json in cur.fetchall():
        parts = json.loads(parts_json) if parts_json else None
        owned = _series_books(cur, sid)
        books = _merge_known_parts(owned, parts) if parts else owned
        result.append({
            "id": sid,
            "title": title,
            "author": author,
            "status": status,
            "progress_status": progress,
            "books_read": sum(b["read"] for b in books),
            "books_total": len(books),
            "parts_known": parts is not None,
            "books": books,
        })
    return result


def set_series_parts(series_title: str, parts: list[dict]):
    con = connect()
    try:
        cur = con.execute(
            "UPDATE Series SET parts_json = ?, total_books = ? WHERE title = ?",
            (json.dumps(parts), len(parts), series_title),
        )
        con.commit()
        if not cur.rowcount:
            return None
    finally:
        con.close()
    return get_series(series_title)


def list_series():
    con = connect()
    try:
        return _series_rows(con.cursor())
    finally:
        con.close()


def get_series(series_title: str):
    con = connect()
    try:
        rows = _series_rows(con.cursor(), "WHERE s.title = ?", (series_title,))
    finally:
        con.close()
    return rows[0] if rows else None


def get_series_books(series_title: str):
    series = get_series(series_title)
    return series["books"] if series else None





if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Book DB CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    pa = sub.add_parser("add-author")
    pa.add_argument("--name", required=True)
    pa.add_argument("--country")

    pb = sub.add_parser("add-book")
    pb.add_argument("--title", required=True)
    pb.add_argument("--author", required=True)
    pb.add_argument("--genre")
    pb.add_argument("--series")
    pb.add_argument("--position", type=int)
    pb.add_argument("--tags")
    pb.add_argument("--language")
    pb.add_argument("--published_date")
    pb.add_argument("--read_year", type=int)
    pb.add_argument("--rating", type=float)
    pb.add_argument("--notes")
    pb.add_argument("--isbn")

    sub.add_parser("list-books")

    args = p.parse_args()
    if args.cmd == "add-author":
        add_author(args.name, args.country)
    elif args.cmd == "add-book":
        book = add_book(
            title=args.title,
            author=args.author,
            genre=args.genre,
            series=args.series,
            position=args.position,
            tags=args.tags,
            language=args.language,
            published_date=args.published_date,
            read_year=args.read_year,
            rating=args.rating,
            notes=args.notes,
            isbn=args.isbn,
        )
    elif args.cmd == "list-books":
        books = list_books()
        for book in books:
            print(book)
    