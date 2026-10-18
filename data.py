import sqlite3
import argparse
import uuid

DB_PATH = "books.db"

def uid() -> str:  # Generate a unique identifier
    return str(uuid.uuid4())

def connect(): # Connect to the SQLite database
    con = sqlite3.connect(DB_PATH)
    con.execute("PRAGMA foreign_keys = ON;")
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
    