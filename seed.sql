INSERT INTO Authors (id, name, country) VALUES
('author1', 'J.K. Rowling', 'United Kingdom'),
('author2', 'George R.R. Martin', 'United States'),
('author3', 'brandon sanderson', 'United States'),
('author4', 'Haruki Murakami', 'Japan');

INSERT INTO Series (id, title, author_id, status, notes) VALUES
('series1', 'Harry Potter', 'author1', 'completed', 'A series about a young wizard.'),
('series2', 'A Song of Ice and Fire', 'author2', 'ongoing', 'Epic fantasy series.'),
('series3', 'The Stormlight Archive', 'author3', 'ongoing', 'High fantasy series.'),
('series4', '1Q84', 'author4', 'completed', 'A surreal novel set in 1984 Tokyo.'),
('series5' , 'Mistborn', 'author3', 'completed', 'A trilogy about a world ruled by a dark lord.');

INSERT INTO Genres (id, name) VALUES
('genre1', 'Fantasy'),
('genre2', 'Science Fiction'),
('genre3', 'Mystery'),
('genre4', 'Romance');


INSERT INTO Books (id , title , author_id , series_id , genre_id , language , published_date , read_year , rating , notes ) VALUES
('book1', 'Harry Potter and the Sorcerer''s Stone', 'author1', 'series1', 'genre1', 'English', '1997-06-26', 2020, 5, 'First book in the Harry Potter series.'),
('book2', 'A Game of Thrones', 'author2', 'series2', 'genre1', 'English', '1996-08-06', 2019, 5, 'First book in A Song of Ice and Fire series.'),
('book3', 'The Way of Kings', 'author3', 'series3', 'genre1', 'English', '2010-08-31', 2021, 5, 'First book in The Stormlight Archive series.'),
('book4', '1Q84 Book 1', 'author4', 'series4', 'genre3', 'Japanese', '2009-05-29', 2018, 4, 'First book in the 1Q84 series.'),
('book5', 'Mistborn: The Final Empire', 'author3', 'series5', 'genre1', 'English', '2006-07-17', 2022, 5, 'First book in the Mistborn trilogy.');



INSERT INTO tags (id, name) VALUES
('tag1', 'Bestseller'),
('tag2', 'Classic'),
('tag3', 'Epic'),
('tag4', 'Enemies to Lovers'),
('tag5', 'Magic'),
('tag6', 'Dystopian'),
('tag7', 'Adventure');


INSERT INTO BookTags (book_id, tag_id) VALUES
('book1', 'tag1'),
('book1', 'tag5'),
('book2', 'tag1'),
('book2', 'tag7'),
('book3', 'tag3'),
('book3', 'tag5'),
('book4', 'tag2'),
('book5', 'tag3'),
('book5', 'tag6');

INSERT INTO series_books(series_id, book_id, position) VALUES
('series1', 'book1', 1),
('series2', 'book2', 1),
('series3', 'book3', 1),
('series4', 'book4', 1),
('series5', 'book5', 1);










