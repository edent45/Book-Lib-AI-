import React, {useCallback,useState} from 'react';
import { View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../theme';
import { getBooks } from '../api/books';
import { Book } from '../types/book';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOOKS_PER_SHELF = 7;
const SHELF_HEIGHT = 200; 
const MOCK_BOOKS: Book[] = [
  { id: '1', title: 'The Way of Kings', author: 'Brandon Sanderson', genre: 'Fantasy', series: 'Stormlight Archive', position: 1, language: 'English', published_date: '2010-08-31', read_year: 2023, rating: 5, isbn: '9780765326355', cover_image: null, cover_url: null, notes: null, tags: 'epic, magic' },
  { id: '2', title: 'A Game of Thrones', author: 'George R.R. Martin', genre: 'Fantasy', series: 'ASOIAF', position: 1, language: 'English', published_date: '1996-08-06', read_year: 2022, rating: 5, isbn: '9780553103540', cover_image: null, cover_url: null, notes: null, tags: 'epic' },
  { id: '3', title: '1Q84', author: 'Haruki Murakami', genre: 'Mystery', series: null, position: null, language: 'Japanese', published_date: '2009-05-29', read_year: 2021, rating: 4, isbn: '9780307593313', cover_image: null, cover_url: null, notes: null, tags: null },
  { id: '4', title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy', series: null, position: null, language: 'English', published_date: '1937-09-21', read_year: 2020, rating: 5, isbn: '9780547928227', cover_image: null, cover_url: null, notes: null, tags: null },
  { id: '5', title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy', series: 'The Kingkiller Chronicle', position: 1, language: 'English', published_date: '2007-03-27', read_year: 2023, rating: 5, isbn: '9780756404741', cover_image: null, cover_url: null, notes: null, tags: null },
  { id: '6', title: 'The Catcher in the Rye', author: 'J.D. Salinger', genre: 'Fiction', series: null, position: null, language: 'English', published_date: '1951-07-16', read_year: 2022, rating: 4, isbn: '9780316769488', cover_image: null, cover_url: null, notes: null, tags: null },
  { id: '7', title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', series: null, position: null, language: 'English', published_date: '1960-07-11', read_year: 2021, rating: 5, isbn: '9780061120084', cover_image: null, cover_url: null, notes: null, tags: null },
];

function hashStr (s: string): number {
  if (!s) return 0;   // ← add this line
  let h = 0;
  for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

const GENRE_COLORS: Record<string, string> = {
  'Fantasy':        '#4a3f6b',  // deep purple
  'Sci-Fi':         '#2e4a6b',  // dark blue
  'Science Fiction':'#2e4a6b',
  'Mystery':        '#3a2e1e',  // dark brown
  'Thriller':       '#5c2e2e',  // dark red
  'Horror':         '#2e1e1e',  // near black-red
  'Romance':        '#6b2e4a',  // dark rose
  'Historical':     '#5c4a2e',  // warm brown
  'Biography':      '#2e5c4a',  // dark teal
  'Non-Fiction':    '#3a4a2e',  // dark olive
  'Fiction':        '#3a3a6b',  // slate blue
  'Adventure':      '#1e5c4a',  // dark green
  'Classic':        '#4a3a1e',  // aged leather
};

const FALLBACK_COLORS = [
  '#4a3f6b', '#2e4a6b', '#1e5c4a', '#5c2e3a',
  '#6b4a1e', '#3a3a6b', '#5c4a2e', '#2e5c5c',
];

function spineColor(genre: string | null, title: string): string {
  if (genre && GENRE_COLORS[genre]) return GENRE_COLORS[genre];
  // unknown genre → deterministic color from title
  return FALLBACK_COLORS[hashStr(title) % FALLBACK_COLORS.length];
}


function spineHeight(title: string): number {
  // varies between 110 and 175
  return Math.max(90, Math.min(210, title.length * 8));
}

function spineWidth(title: string): number {
  // varies between 28 and 44
  return Math.max(28, Math.min(52, 22 + Math.floor(title.length * 1.4)));
}



// book spine
function BookSpine({ book, onPress }: { book: Book; onPress: () => void }) {
  const h = spineHeight(book.title);
  const w = spineWidth(book.title);
  const bg = spineColor(book.genre, book.title);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.spine, { height: h, width: w, backgroundColor: bg }]}
      activeOpacity={0.75}
    >
      {/* Rotated container: swapped dimensions so text wraps within spine width */}
      <View style={{
        width: h,
        height: w,
        transform: [{ rotate: '-90deg' }],
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8
      }}>
        <Text style={{
          fontFamily: fonts.semiBold,
          fontSize: 12,
          color: 'rgba(255,255,255,0.85)',
          textAlign: 'center',
        }}>
          {book.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── ShelfPlank ───────────────────────────────────────────────────────────────
function ShelfPlank() {
  return <View style={styles.plank} />;
}

// ── BooksScreen ──────────────────────────────────────────────────────────────
export default function BooksScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      getBooks()
        .then(data => setBooks(data.length > 0 ? data : MOCK_BOOKS))
        //.catch(() => setError('Could not load books'))
        .catch(() => setBooks(MOCK_BOOKS))
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accentPurple} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (books.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>📚</Text>
        <Text style={styles.emptyTitle}>Your shelves are empty</Text>
        <Text style={styles.emptySubtitle}>Add your first book to get started</Text>
      </View>
    );
  }

  // Split books into rows of BOOKS_PER_SHELF
  const shelves: Book[][] = [];
  for (let i = 0; i < books.length; i += BOOKS_PER_SHELF) {
    shelves.push(books.slice(i, i + BOOKS_PER_SHELF));
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>My Library</Text>

      {/* Bookcase frame */}
      <View style={styles.bookcase}>
        {shelves.map((shelf, i) => (
          <View key={i}>
            {/* Books row — alignItems:'flex-end' makes them all sit on the plank */}
            <View style={styles.shelfRow}>
              {shelf.map(book => (
                <BookSpine
                  key={book.id}
                  book={book}
                  onPress={() => {
                    // TODO: navigate to BookDetailScreen
                    console.log('tapped', book.title);
                  }}
                />
              ))}
            </View>
            <ShelfPlank />
          </View>
        ))}
      </View>

      <Text style={styles.count}>{books.length} books</Text>
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    color: colors.primaryText,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },

  // Bookcase outer frame
  bookcase: {
    marginHorizontal: 12,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderColor: '#3b2e1e',
    borderRadius: 4,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },

  // One shelf row
  shelfRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',   // books sit on the plank
    paddingHorizontal: 6,
    paddingTop: 16,
    gap: 3,
    minHeight: SHELF_HEIGHT,
  },

  // Wood plank
  plank: {
    height: 14,
    backgroundColor: '#3b2e1e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },

  // Individual spine
  spine: {
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  spineText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    transform: [{ rotate: '-90deg' }],
    width: SHELF_HEIGHT,
    textAlign: 'center',
  },

  // Empty state
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.primaryText,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.subText,
  },

  errorText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#ff6b6b',
  },

  count: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 16,
  },
});

