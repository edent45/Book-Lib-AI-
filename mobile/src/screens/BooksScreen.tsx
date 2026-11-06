import React, {useCallback,useEffect,useRef,useState} from 'react';
import { View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions, Modal,
  useWindowDimensions, Image, TextInput, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../theme';
import { getBooks , updateRating, updateNotes, updateBook, deleteBook, updateSeriesProgress, getSeries, refreshSeriesTotal, SeriesInfo } from '../api/books';
import { Book } from '../types/book';
import  BookEditForm ,  {type BookChanges} from '../components/BookEditForm';
import PixelProgressBar from '../components/PixelProgressBar';

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


// ── function helper - star rating ──────────────────────────────────────────────────────────────
function Stars({ rating, onChange }: { rating: number | null; onChange: (r: number) => void }) {
  const r = Math.round(rating ?? 0);
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n === r ? 0 : n)} hitSlop={6}>
          <Text style={[styles.stars, n > r && styles.starsEmpty]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── function helper - update notes ──────────────────────────────────────────────
function NotesEditor({ book, onSave }: { book: Book; onSave: (n: string) => void }) {
  const [text, setText] = useState(book.notes ?? '');
  return (
    <>
      <Text style={styles.sectionTitle}>My Notes</Text>
      <TextInput
        style={styles.notesInput}
        value={text}
        onChangeText={setText}
        onBlur={() => text !== (book.notes ?? '') && onSave(text)}  // save when focus leaves
        placeholder="Write your thoughts about this book…"
        placeholderTextColor="#666"
        multiline
        textAlignVertical="top"
      />
    </>
  );
}

const PROGRESS_LABELS: Record<string, string> = {
  reading: '📖 Reading', completed: '✅ Completed', dropped: '⏸ Dropped', TBR: '🔖 TBR',
};

function SeriesPanel({ info, currentId, onSelect, onProgress }: {
  info: SeriesInfo;
  currentId: string;
  onSelect: (bookId: string) => void;
  onProgress: (status: string) => void;
}) {
  return (
    <View style={{ marginVertical: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {Object.keys(PROGRESS_LABELS).map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => onProgress(s)}
            style={[styles.pill, { opacity: info.progress_status === s ? 1 : 0.5 }]}
          >
            <Text style={styles.pillText}>{PROGRESS_LABELS[s]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {info.books.map(b => (
        <TouchableOpacity
          key={b.id ?? `part-${b.position}`}
          disabled={!b.owned}
          onPress={() => b.id && onSelect(b.id)}
          style={{ paddingVertical: 6, opacity: b.owned ? 1 : 0.45 }}
        >
          <Text style={[styles.sectionBody, b.id === currentId && { fontWeight: '700' }]}>
            {b.read ? '✓' : '○'} {b.position ? `#${b.position} · ` : ''}{b.title}
            {b.rating ? `  ★${b.rating}` : ''}
            {b.owned ? '' : '  (not in library)'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── BooksScreen ──────────────────────────────────────────────────────────────
export default function BooksScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Book | null>(null);
  const {height} = useWindowDimensions();
  const [editing, setEditing] = useState(false);
  const [seriesMap, setSeriesMap] = useState<Record<string, SeriesInfo>>({});
  const [showSeries, setShowSeries] = useState(false);
  
  const lookedUp = useRef<Set<string>>(new Set());

  const loadSeries = useCallback(async () => {
    try {
      const list = await getSeries();
      setSeriesMap(Object.fromEntries(list.map(s => [s.title, s])));

      // Fetch the real series size once per series for those that don't have one yet
      const unknown = list.filter(s => !s.parts_known && !lookedUp.current.has(s.title));
      unknown.forEach(s => lookedUp.current.add(s.title));
      const updated = await Promise.all(
        unknown.map(s => refreshSeriesTotal(s.title).catch(() => null))
      );
      const found = updated.filter((s): s is SeriesInfo => !!s && s.parts_known);
      if (found.length) {
        setSeriesMap(m => ({ ...m, ...Object.fromEntries(found.map(s => [s.title, s])) }));
      }
    } catch {}
  }, []);
  useEffect(() => {
    setShowSeries(false);
  }, [selected?.id]);

  const handleRate = (book: Book, rating: number) => {
    const prev = book.rating ?? 0;
    const apply = (r:number | null ) => {
      setBooks(bs => bs.map(b=> (b.id == book.id ? {...b, rating: r} : b))); 
      setSelected(s => (s && s.id === book.id ? { ...s, rating: r } : s));
    };
    console.warn(`Updating rating for book ID ${book.id} from ${prev} to ${rating}`);
    apply(rating);
    updateRating(book.id, rating).catch(() => apply(prev));
  };

  const handleNotes = (book: Book, notes: string) => {
    const prev = book.notes;
    const apply = (n: string | null) => {
      setBooks(bs => bs.map(b => (b.id === book.id ? { ...b, notes: n } : b)));
      setSelected(s => (s && s.id === book.id ? { ...s, notes: n } : s));
    };
    apply(notes);
    updateNotes(book.id, notes).catch(e => { console.warn('notes save failed', e); apply(prev); });
  };

  const handleDelete = (book: Book) => {
    Alert.alert('Delete book', `Delete "${book.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBook(book.id);
            setBooks(bs => bs.filter(b => b.id !== book.id));
            setSelected(null);
            setEditing(false);
            loadSeries();
          } catch {
            Alert.alert('Error', 'Could not delete the book.');
          }
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadSeries();

      getBooks()
        .then(data => setBooks(data.length > 0 ? data : MOCK_BOOKS))
        //.catch(() => setError('Could not load books'))
        .catch(() => setBooks(MOCK_BOOKS))
        .finally(() => setLoading(false));
    }, [loadSeries])
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
                    //console.log('tapped', book.title);
                    setSelected(book);
                  }}
                />
              ))}
            </View>
            <ShelfPlank />
          </View>
        ))}
      </View>

      <Text style={styles.count}>{books.length} books</Text>
      {/* Book detail modal */}
      <Modal
          visible={selected !== null}
          animationType="slide"
          onRequestClose={() => {
            setEditing(false);
            setSelected(null);
          }}
        >
          {selected && (
            editing ? (
              <BookEditForm
                book={selected}
                onCancel={() => setEditing(false)}
                onSave={async (changes: BookChanges) => {
                  const updatedBook = { ...selected, ...changes };

                  await updateBook(selected.id, updatedBook);

                  setBooks(current =>
                    current.map(book =>
                      book.id === updatedBook.id ? updatedBook : book
                    )
                  );
                  setSelected(updatedBook);
                  setEditing(false);
                  loadSeries();
                }}
              />
            ) : (
              (() => {
                const cover = selected.cover_url
                  ?? (selected.isbn
                    ? `https://covers.openlibrary.org/b/isbn/${selected.isbn}-L.jpg`
                    : null);
                const pills = [
                  selected.genre,
                  ...(selected.tags?.split(',').map(tag => tag.trim()) ?? []),
                ].filter(Boolean) as string[];

                return (
                  <View style={styles.detailRoot}>
                    <View style={[styles.hero, { height: height * 0.5 }]}>
                      <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => setSelected(null)}
                      >
                        <Text style={styles.backIcon}>‹</Text>
                      </TouchableOpacity>

                      {/* The cover shrinks to leave room for the title and author */}
                      {(() => {
                        const coverStyle = {
                          height: Math.min(250, height * 0.5 - 150),
                          width: Math.min(250, height * 0.5 - 150) * 0.68,
                        };
                        return cover ? (
                          <Image source={{ uri: cover }} style={[styles.heroCover, coverStyle]} />
                        ) : selected.cover_image ? (
                          <Image
                            source={{ uri: `data:image/jpeg;base64,${selected.cover_image}` }}
                            style={[styles.heroCover, coverStyle]}
                          />
                        ) : (
                          <View style={[styles.heroCover, styles.heroPlaceholder, coverStyle]}>
                            <Text style={{ fontSize: 64 }}>📖</Text>
                          </View>
                        );
                      })()}

                      <Text style={styles.heroTitle} numberOfLines={2}>
                        {selected.title}
                      </Text>
                      <Text style={styles.heroAuthor}>{selected.author}</Text>
                    </View>

                    <ScrollView
                      style={styles.sheet}
                      contentContainerStyle={{ padding: 20 }}
                    >
                      <View style={styles.statsRow}>
                        <View style={styles.stat}>
                          <Stars
                            rating={selected.rating}
                            onChange={rating => handleRate(selected, rating)}
                          />
                          <Text style={styles.statLabel}>Rating</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.stat}>
                          <Text style={styles.statValue}>
                            {selected.read_year ?? '—'}
                          </Text>
                          <Text style={styles.statLabel}>Read</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.stat}>
                          <Text style={styles.statValue}>
                            {selected.language ?? '—'}
                          </Text>
                          <Text style={styles.statLabel}>Language</Text>
                        </View>
                      </View>

                      <View style={styles.pillRow}>
                        {pills.map(pill => (
                          <View key={pill} style={styles.pill}>
                            <Text style={styles.pillText}>{pill}</Text>
                          </View>
                        ))}
                      </View>

                      {selected.series && seriesMap[selected.series] && (() => {
                        const info = seriesMap[selected.series!];
                        return (
                          <>
                            <TouchableOpacity onPress={() => setShowSeries(v => !v)} activeOpacity={0.7}>
                              <Text style={styles.sectionBody}>
                                📚 {selected.series}{selected.position ? ` · #${selected.position}` : ''}
                                {info.progress_status ? `  ${PROGRESS_LABELS[info.progress_status] ?? ''}` : ''}
                                {showSeries ? '  ▲' : '  ▼'}
                              </Text>
                              <PixelProgressBar read={info.books_read} total={info.books_total} />
                            </TouchableOpacity>
                            {showSeries && (
                              <SeriesPanel
                                info={info}
                                currentId={selected.id}
                                onSelect={id => {
                                  const next = books.find(b => b.id === id);
                                  if (next) setSelected(next);
                                }}
                                onProgress={async status => {
                                  try {
                                    await updateSeriesProgress(info.title, status);
                                    loadSeries();
                                  } catch {
                                    Alert.alert('Error', 'Could not update series progress.');
                                  }
                                }}
                              />
                            )}
                          </>
                        );
                      })()}
                      <NotesEditor
                        key={selected.id}
                        book={selected}
                        onSave={notes => handleNotes(selected, notes)}
                      />

                       <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.editBtn]}
                          onPress={() => setEditing(true)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.actionText}>✏️  Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => handleDelete(selected)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.actionText, styles.deleteText]}>🗑️  Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>
                );
              })()
            )
          )}
        </Modal>
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

  // Modal backdrop and panel (for the book details)
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    panel: {
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      padding: 20, maxHeight: '70%',
      borderWidth: 1, borderColor: colors.border,
    },
  modalTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.primaryText },
  modalAuthor: { fontSize: 14, fontFamily: fonts.regular, color: colors.subText, marginBottom: 12 },
  modalMeta: { fontSize: 13, fontFamily: fonts.regular, color: colors.primaryText, marginBottom: 4 },
  modalNotes: { fontSize: 13, fontFamily: fonts.regular, color: colors.subText, marginTop: 10 },
  closeBtn: { marginTop: 16, backgroundColor: colors.accentPurple, borderRadius: 10, padding: 12, alignItems: 'center' },
  closeText: { color: '#fff', fontFamily: fonts.semiBold },
  detailRoot: { flex: 1, backgroundColor: '#7a4a1e' },   // or derive from spineColor(selected.genre, selected.title)
  hero: { alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  backBtn: { position: 'absolute', top: 40, left: 20, width: 44, height: 44, borderRadius: 22,
            backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  backIcon: { color: '#fff', fontSize: 28, marginTop: -3 },
  heroCover: { width: 170, height: 250, borderRadius: 10, resizeMode: 'cover' },
  heroPlaceholder: { backgroundColor: '#2a1a3e', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#fff', fontSize: 18, fontFamily: fonts.bold, marginTop: 16, paddingHorizontal: 20, textAlign: 'center' },
  heroAuthor: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontFamily: fonts.regular, marginTop: 4 },

  sheet: { flex: 1, backgroundColor: '#0f0f0f', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  statsRow: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 20, paddingVertical: 16, marginBottom: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 18, fontFamily: fonts.bold },
  statSub: { color: '#888', fontSize: 12 },
  statLabel: { color: '#aaa', fontSize: 13, fontFamily: fonts.regular, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#333' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20 },
  pill: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  pillText: { color: '#111', fontSize: 13, fontFamily: fonts.semiBold },
  sectionTitle: { color: '#fff', fontSize: 18, fontFamily: fonts.bold, marginBottom: 8 },
  sectionBody: { color: '#aaa', fontSize: 14, lineHeight: 21, fontFamily: fonts.regular, marginBottom: 12 },

  stars: { color: '#FFC83D', fontSize: 22, paddingHorizontal: 2 },
  starsEmpty: { color: '#444' },

  notesInput: {
    backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 14, padding: 14,
    minHeight: 120, fontSize: 14, fontFamily: fonts.regular, marginBottom: 24,
  },

  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
actionBtn: {
  flex: 1,
  paddingVertical: 14,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
},
editBtn: { backgroundColor: colors.accentPurple },
deleteBtn: {
  backgroundColor: 'rgba(255,107,107,0.12)',
  borderWidth: 1,
  borderColor: '#ff6b6b',
},
actionText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
deleteText: { color: '#ff6b6b' },

});

