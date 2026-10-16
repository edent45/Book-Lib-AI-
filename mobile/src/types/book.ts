export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  series: string | null;
  position: number | null;
  language: string | null;
  published_date: string | null;
  read_year: number | null;
  rating: number | null;
  isbn: string | null;
  cover_image: string | null; // base64 string
  cover_url: string | null;
  notes: string | null;
  tags: string | null;
}
