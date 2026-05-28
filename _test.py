import ast # Abstract Syntax Tree
import sqlite3 # For database operations
import uuid 
import pytest 
import data
from pathlib import Path 


DB_PATH = "test.db" 

# Test the functions in data.py using pytest

@pytest.fixture (autouse=True) 
def temp_db(tmp_path , monkeypatch): #create a temporary database for the tests
    # creating a temp file for testing 
    db_file =  tmp_path / DB_PATH
    monkeypatch.setattr(data, "DB_PATH", str(db_file))
    
    schema= Path("schema.sql").read_text(encoding="utf-8") # read the schema from the file
    con = sqlite3.connect(db_file)
    con.execute("PRAGMA foreign_keys = ON;") # Enable foreign key support
    con.executescript(schema)
    con.commit() 
    con.close()
    
    yield db_file # Yield the path to the temporary database file for use in tests
    
def test_uid(): 
    # Test that the uid function generates a unique identifier
    ids = [data.uid() for _ in range(1000)]
    assert len(ids) == 1000 
    for id in ids:
        parse_id = uuid.UUID(id) # Check if the generated id is a valid UUID
        assert str(parse_id) == id # Check if the string representation of the parsed UUID matches the original id

def test_get_or_create_id_by_name():
    #first function test - 
    
    con = data.connect()
    first = data.get_or_create_id_by_name(con, "Authors", "Test Author")
    second = data.get_or_create_id_by_name(con, "Authors", "Test Author")
    con.commit() 
    
    cur = con.cursor()
    cur.execute("SELECT COUNT(*) FROM Authors WHERE name = ?", ("Test Author",))
    count = cur.fetchone()[0]
    con.close()
    
    assert first == second # Check if the same name returns the same id
    assert count == 1 # Check if only one entry is created for the same name

def test_add_author(capsys):
    data.add_author("Test Author", "Test Country")
    out = capsys.readouterr().out.strip() #output of add_author
    payload = ast.literal_eval(out) 
    assert payload["name"] == "Test Author" # Check if the name in the payload matches the input
    
    # Check if the author was added to the database  
    con = data.connect()
    cur = con.cursor()
    cur.execute("SELECT name, country FROM Authors WHERE name = ?", ("Test Author",))
    row = cur.fetchone()
    con.close()
    
    assert row == ("Test Author", "Test Country") 


def test_add_book():
    data.add_book(
        title="Test Book",
        author="Test Author",
        genre="Test Genre",
        series="Test Series",
        position=1,
        tags="tag1, tag2",
        language="English",
        published_date="2020-01-01",
        read_year=2021,
        rating=4.5,
        notes="Test notes",
        isbn="1234567890"
    )
    
    # Check if the book was added to the database
    con = data.connect()
    cur = con.cursor()
    
    # check title
    cur.execute("SELECT COUNT(*) FROM Books WHERE title = ?", ("Test Book",))
    assert cur.fetchone()[0] == 1 
    
    # check author
    cur.execute("SELECT COUNT(*) FROM Authors WHERE name = ?", ("Test Author",))
    assert cur.fetchone()[0] == 1 
    
    # check genre
    cur.execute("SELECT COUNT(*) FROM Genres WHERE name = ?", ("Test Genre",))
    assert cur.fetchone()[0] == 1
    
    # check series
    cur.execute("SELECT COUNT(*) FROM Series WHERE title = ?", ("Test Series",))
    assert cur.fetchone()[0] == 1
    
    # check book details
    cur.execute("""
                SELECT COUNT(*) 
                FROM BookTags bt 
                JOIN tags t ON t.id = bt.tag_id
                WHERE t.name IN ('tag1', 'tag2') 
                """ 
                )
    assert cur.fetchone()[0] == 2 # Check if both tags were added to the BookTags table
    
    # check series books junction table
    cur.execute(" SELECT COUNT(*) FROM series_books")
    assert cur.fetchone()[0] == 1 # Check if the book was added to the series_books junction table
    
    con.close()
    
    
#add test for ratings 
#add test for listing books

def test_list_books(capsys): 
    # test the list books function 
    
    data.add_book(
        title="Test Book",
        author="Test Author",
        genre="Test Genre",
        series="Test Series",
        position=1,
        tags="tag1, tag2",
        language="English",
        published_date="2020-01-01",
        read_year=2021,
        rating=4.5,
        notes="Test notes",
        isbn="1234567890"
    )
    
    capsys.readouterr()  # clear output from add_book
    data.list_books()
    # Capture the output of the list_books function
    out = capsys.readouterr().out.strip()
    # Convert the output string to a list of dictionaries
    books = [ast.literal_eval(line) for line in out.splitlines()]
    assert len(books) == 1 # Check if one book is listed
    book = books[0]
    assert book["title"] == "Test Book" # Check if the title matches
    assert book["author"] == "Test Author" # Check if the author matches
    assert book["genre"] == "Test Genre" # Check if the genre matches
    assert book["series"] == "Test Series" # Check if the series matches
    assert book["position"] == 1 # Check if the position in the series matches
    assert book["language"] == "English" # Check if the language matches
    assert book["published_date"] == "2020-01-01" # Check if
    assert book["read_year"] == 2021 # Check if the read year matches
    assert book["rating"] == 4.5 # Check if the rating matches
    assert book["isbn"] == "1234567890" # Check if the ISBN matches
    
    
    
            
    
    



    
    