import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { getBooks } from '../api/books';
import BookCard from '../components/BookCard';
import { Book } from '../types/book';
import { getRecommendations } from '../utils/recommendations';
import { colors, fonts } from '../theme';

// Mock data shown when the backend is not reachable yet
const MOCK_BOOKS: Book[] = [
  { id: '1', title: 'The Way of Kings', author: 'Brandon Sanderson', genre: 'Fantasy', series: 'Stormlight Archive', position: 1, language: 'English', published_date: '2010-08-31', read_year: 2023, rating: 5, isbn: '9780765326355', cover_image: null, tags: 'epic, magic' },
  { id: '2', title: 'A Game of Thrones', author: 'George R.R. Martin', genre: 'Fantasy', series: 'ASOIAF', position: 1, language: 'English', published_date: '1996-08-06', read_year: 2022, rating: 5, isbn: '9780553103540', cover_image: null, tags: 'epic' },
  { id: '3', title: '1Q84', author: 'Haruki Murakami', genre: 'Mystery', series: null, position: null, language: 'Japanese', published_date: '2009-05-29', read_year: 2021, rating: 4, isbn: '9780307593313', cover_image: null, tags: null },
  { id: '4', title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy', series: null, position: null, language: 'English', published_date: '1937-09-21', read_year: 2020, rating: 5, isbn: '9780547928227', cover_image: null, tags: null },
  { id: '5', title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy', series: 'The Kingkiller Chronicle', position: 1, language: 'English', published_date: '2007-03-27', read_year: 2023, rating: 5, isbn: '9780756404741', cover_image: null, tags: null },
  { id: '6', title: 'The Catcher in the Rye', author: 'J.D. Salinger', genre: 'Fiction', series: null, position: null, language: 'English', published_date: '1951-07-16', read_year: 2022, rating: 4, isbn: '9780316769488', cover_image: null, tags: null },
  { id: '7', title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', series: null, position: null, language: 'English', published_date: '1960-07-11', read_year: 2021, rating: 5, isbn: '9780061120084', cover_image: null, tags: null },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBooks()
      .then(setBooks)
      .catch(() => setBooks(MOCK_BOOKS))
      .finally(() => setLoading(false));
  }, []);

  const totalBooks = books.length;
  const rated = books.filter(b => b.rating !== null);
  const avgRating =
    rated.length > 0
      ? (rated.reduce((sum, b) => sum + (b.rating ?? 0), 0) / rated.length).toFixed(1)
      : '—';
  const seriesCount = new Set(books.map(b => b.series).filter(Boolean)).size;

  const recentBooks = [...books]
    .sort((a, b) => (b.read_year ?? 0) - (a.read_year ?? 0))
    .slice(0, 5);

  const recommendations = getRecommendations(books);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.headerStart, colors.headerEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.greeting}>The Library</Text>
          <Text style={styles.subtitle}>Your personal reading world</Text>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.statCard1 }]}>
            <Text style={styles.statIcon}>📖</Text>
            <Text style={styles.statNumber}>{totalBooks}</Text>
            <Text style={styles.statLabel}>Books Read</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.statCard2 }]}>
            <Text style={styles.statIcon}>📚</Text>
            <Text style={styles.statNumber}>{seriesCount}</Text>
            <Text style={styles.statLabel}>Series</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.statCard3 }]}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statNumber}>{avgRating}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Section: Recently Read */}
        <View style={styles.sectionDivider} />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Read</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('../../assets/book-loading.json')}
              autoPlay
              loop
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <FlatList
            data={recentBooks}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <BookCard book={item} />}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bookList}
            snapToInterval={144}
            decelerationRate="fast"
            snapToAlignment="start"
          />
        )}

        {/* Section: Recommended For You */}
        {!loading && recommendations.length > 0 && (
          <>
            <View style={styles.sectionDivider} />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended For You</Text>
            </View>
            <FlatList
              data={recommendations}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <BookCard book={item} />}
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bookList}
              snapToInterval={144}
              decelerationRate="fast"
              snapToAlignment="start"
            />
          </>
        )}
      </ScrollView>

      {/* Floating Dragon FAB */}
      <TouchableOpacity
        style={styles.dragonFAB}
        onPress={() => navigation.navigate('Dragon')}
        activeOpacity={0.85}
      >
        <View style={styles.fabBubble}>
          <Text style={styles.fabBubbleText}>Give me Books!</Text>
        </View>
        <View style={styles.fabDot1} />
        <View style={styles.fabDot2} />
        <Image
          source={require('../../assets/dragon.png')}
          style={styles.fabDragon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  //  Header 
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 20,
  },
  scaleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    opacity: 0.35,
  },
  scaleEmoji: {
    fontSize: 14,
  },
  greeting: {
    fontSize: 48,
    fontFamily: fonts.extraBold,
    color: '#ffffff',
    letterSpacing: -0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    textAlign: 'center',
  },
  //  Stats 
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 22,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: fonts.extraBold,
    color: colors.primaryText,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.subText,
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  //  Section headers 
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 14,
    gap: 8,
  },
  sectionDragon: {
    fontSize: 16,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryText,
    textAlign: 'center',
  },
  sectionDivider: {
    marginHorizontal: 40,
    marginVertical: 24,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  //  Book lists 
  loadingContainer: {
    width: 280,
    height: 280,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  bookList: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  //  Floating Dragon FAB 
  dragonFAB: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    alignItems: 'center',
  },
  fabBubble: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: colors.accentPurple,
    shadowColor: colors.accentPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  fabBubbleText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.accentPurple,
    fontStyle: 'italic',
  },
  fabDot1: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accentPurple,
    opacity: 0.6,
    marginTop: 4,
  },
  fabDot2: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accentPurple,
    opacity: 0.4,
    marginTop: 3,
  },
  fabDragon: {
    width: 72,
    height: 72,
    marginTop: 2,
  },
});
