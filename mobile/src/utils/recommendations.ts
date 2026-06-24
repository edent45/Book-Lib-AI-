import { Book } from '../types/book';

export type Mood = 'cozy' | 'epic' | 'thoughtful' | 'fun' | 'thriller' | 'philosophical';

const MOOD_GENRES: Record<Mood, string[]> = {
  cozy:          ['Fiction', 'Mystery', 'Romance', 'Contemporary'],
  epic:          ['Fantasy', 'Sci-Fi', 'Science Fiction', 'Adventure'],
  thoughtful:    ['Literary Fiction', 'History', 'Biography', 'Historical Fiction'],
  fun:           ['Comedy', 'YA', 'Young Adult', 'Fiction'],
  thriller:      ['Mystery', 'Thriller', 'Horror', 'Suspense', 'Crime'],
  philosophical: ['Philosophy', 'Literary Fiction', 'Classic', 'Fiction'],
};

export function getTopGenres(books: Book[]): string[] {
  const genreScore: Record<string, number> = {};
  books.forEach(b => {
    if (b.genre && b.rating && b.rating >= 4) {
      genreScore[b.genre] = (genreScore[b.genre] ?? 0) + (b.rating ?? 1);
    }
  });
  return Object.entries(genreScore)
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre);
}

export function getMostLoved(books: Book[]): Book[] {
  return [...books]
    .filter(b => (b.rating ?? 0) >= 4)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}

/**
 * Returns books from the library that match the user's top genres,
 * excluding the 5 most recently read — these surface as "based on your taste".
 */
export function getRecommendations(books: Book[]): Book[] {
  const topGenres = getTopGenres(books);
  if (topGenres.length === 0) return getMostLoved(books).slice(0, 5);

  const recentIds = new Set(
    [...books]
      .sort((a, b) => (b.read_year ?? 0) - (a.read_year ?? 0))
      .slice(0, 5)
      .map(b => b.id)
  );

  const recs = books
    .filter(b => !recentIds.has(b.id) && b.genre && topGenres.includes(b.genre))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  // If nothing left after excluding recent, fall back to all top-genre books by rating
  if (recs.length === 0) {
    return books
      .filter(b => b.genre && topGenres.includes(b.genre))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 5);
  }

  return recs;
}

export function getMoodRecommendations(
  books: Book[],
  mood: Mood
): { recs: Book[]; message: string } {
  const genres = MOOD_GENRES[mood];

  const matches = books
    .filter(b =>
      b.genre &&
      genres.some(g => b.genre!.toLowerCase().includes(g.toLowerCase()))
    )
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const topRated = books
    .filter(b => (b.rating ?? 0) >= 5)
    .slice(0, 2)
    .map(b => `"${b.title}"`);
  const loved = topRated.length ? `Since you loved ${topRated.join(' and ')}, ` : '';

  const moodLabel: Record<Mood, string> = {
    cozy:          'something warm and cozy 🌙',
    epic:          'an epic adventure ⚔️',
    thoughtful:    'something deep and thoughtful 🧠',
    fun:           'something light and fun 😂',
    thriller:      'edge-of-your-seat suspense 😱',
    philosophical: 'something to make you think 💭',
  };

  const fallback: Record<Mood, string> = {
    cozy:          "try Alexander McCall Smith or Rainbow Rowell for warm, cozy reads.",
    epic:          "Sanderson's Stormlight Archive or Rothfuss's Kingkiller Chronicle are legendary choices.",
    thoughtful:    "Kazuo Ishiguro or Haruki Murakami write with incredible depth.",
    fun:           "Terry Pratchett's Discworld or Douglas Adams' Hitchhiker's Guide are delightfully hilarious.",
    thriller:      "Gillian Flynn or Tana French are masterful — \"Gone Girl\" or \"In the Woods\" would grip you.",
    philosophical: "Dostoevsky's \"The Brothers Karamazov\" or Camus' \"The Stranger\" are essential reads.",
  };

  if (matches.length > 0) {
    const rec = matches[0];
    const extra =
      matches.length > 1
        ? ` And don't overlook "${matches[1].title}" — another great ${matches[1].genre} from your shelf.`
        : '';
    return {
      recs: matches.slice(0, 5),
      message: `You're craving ${moodLabel[mood]}\n\n🔥 ${loved}"${rec.title}" by ${rec.author} is exactly what you need.${extra}`,
    };
  }

  return {
    recs: [],
    message: `You're craving ${moodLabel[mood]}\n\n🔥 Your library doesn't have a perfect match yet — but ${fallback[mood]}`,
  };
}
