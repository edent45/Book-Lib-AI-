PRAGMA foreign_keys = ON;   --Enable foreign key support

-- Authors Table
CREATE TABLE Authors (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL, 
    country TEXT ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_authors_name ON Authors(name); 

-- Series Table
CREATE TABLE Series (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author_id TEXT,
    status TEXT CHECK(status IN ('ongoing', 'completed', 'hiatus')) DEFAULT 'ongoing',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_series_title ON Series(title);

-- Genres Table
CREATE TABLE Genres (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
CREATE INDEX idx_genres_name ON Genres(name);

-- Tags Table
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
CREATE INDEX idx_tags_name ON tags(name);

-- Books Table
CREATE TABLE Books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author_id TEXT,
    series_id TEXT,
    genre_id TEXT,
    language TEXT,
    published_date DATE,
    read_year INTEGER,
    -- Allow half-star ratings (e.g., 4.5). Null is allowed.
    rating REAL CHECK (
        rating IS NULL OR (
            rating >= 0 AND rating <= 5 AND CAST(rating * 2 AS INTEGER) = rating * 2
        )
    ),
    notes TEXT,
    isbn TEXT,
    cover_image BLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES Authors(id) ON DELETE SET NULL,
    FOREIGN KEY (series_id) REFERENCES Series(id) ON DELETE SET NULL,
    FOREIGN KEY (genre_id) REFERENCES Genres(id) ON DELETE SET NULL
);
CREATE INDEX idx_books_title ON Books(title);
CREATE INDEX idx_books_isbn ON Books(isbn);


-- Junction Table for Book Tags
CREATE TABLE BookTags (
    book_id TEXT,
    tag_id TEXT,
    PRIMARY KEY (book_id, tag_id),
    FOREIGN KEY (book_id) REFERENCES Books(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
CREATE INDEX idx_booktags_book_id ON BookTags(book_id);

-- Junction Table for Series and Books (to maintain order in series)
CREATE TABLE series_books(
    series_id TEXT,
    book_id TEXT,
    position INTEGER,
    PRIMARY KEY (series_id, book_id),
    FOREIGN KEY (series_id) REFERENCES Series(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES Books(id) ON DELETE CASCADE
);

CREATE TABLE UserSeriesProgress (
    series_id TEXT PRIMARY KEY,
    status TEXT CHECK(status IN ('reading', 'completed', 'dropped', 'TBR')),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (series_id) REFERENCES Series(id) ON DELETE CASCADE
);

-- Triggers to update updated_at timestamp on record modification
CREATE TRIGGER update_authors_updated_at
AFTER UPDATE ON Authors
FOR EACH ROW
BEGIN
    UPDATE Authors SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER update_series_updated_at
AFTER UPDATE ON Series
FOR EACH ROW
BEGIN
    UPDATE Series SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER update_books_updated_at
AFTER UPDATE ON Books
FOR EACH ROW
BEGIN
    UPDATE Books SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;



