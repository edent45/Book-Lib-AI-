import BASE_URL from './config';
import { Book } from '../types/book';

export async function getBooks(): Promise<Book[]> {
  const res = await fetch(`${BASE_URL}/books`);
  if (!res.ok) throw new Error('Failed to fetch books');
  return res.json();
}

export async function createBook(book: Omit<Book, 'id'>): Promise<Book> {
  const res = await fetch(`${BASE_URL}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  });
  if (!res.ok) throw new Error('Failed to create book');
  return res.json();
}

export async function updateSeriesProgress(seriesTitle: string, status: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/series/${encodeURIComponent(seriesTitle)}/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ series_title: seriesTitle, status }),
  });
  if (!res.ok) throw new Error('Series not found');
}

export interface BookSearchResult {
  title: string;
  author: string;
  published_date: string | null;
  genre: string | null;
  isbn: string | null;
  cover: string | null;       // thumbnail URL (not base64)
  description: string;
}

export async function searchBooks(q: string): Promise<BookSearchResult[]> {
  const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function updateRating(bookId: string, rating: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/books/${encodeURIComponent(bookId)}/rating`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  });
  if (!res.ok) throw new Error('Failed to update rating');
}


export async function updateNotes(bookId: string, notes: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/books/${encodeURIComponent(bookId)}/notes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error('Failed to update notes');
}

export async function updateBook(bookId: string, book: Book): Promise<void> {
  const res = await fetch(`${BASE_URL}/books/${encodeURIComponent(bookId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  });

  if (!res.ok) throw new Error('Failed to update book');
}

export async function deleteBook(bookId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/books/${encodeURIComponent(bookId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete book');
}


export async function fetchSeries(seriesTitle: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/series/${encodeURIComponent(seriesTitle)}/books`);
  if (!res.ok) throw new Error('Failed to fetch series books');
  return res.json();
}

export interface SeriesBook {
  id: string | null; title: string; position: number | null;
  read_year: number | null; rating: number | null; read: boolean;
  owned: boolean; // false for books known from Wikidata that aren't in the library
}
export interface SeriesInfo {
  id: string; title: string; author: string | null;
  status: string | null; progress_status: string | null;
  books_read: number; books_total: number;
  parts_known: boolean; // true once the book list has been fetched
  books: SeriesBook[];
}

export async function getSeries(): Promise<SeriesInfo[]> {
  const res = await fetch(`${BASE_URL}/series`);
  if (!res.ok) throw new Error('Failed to fetch series');
  return res.json();
}

export async function refreshSeriesTotal(seriesTitle: string): Promise<SeriesInfo> {
  const res = await fetch(`${BASE_URL}/series/${encodeURIComponent(seriesTitle)}/refresh-total`, { method: 'POST' });
  if (!res.ok) throw new Error('Series lookup failed');
  return res.json();
}

