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
