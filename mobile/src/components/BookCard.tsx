import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Book } from '../types/book';
import { colors, fonts } from '../theme';

interface Props {
  book: Book;
}

export default function BookCard({ book }: Props) {
  const stars = book.rating ? Math.floor(book.rating) : 0;
  const coverUrl = book.cover_url
  ?? (book.isbn
    ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`
    : null);

  const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);

  return (
    <View style={styles.card}>
      <View style={styles.cover}>
        {coverUrl || book.cover_image ? (
          <Image
            source={
              coverUrl
                ? { uri: coverUrl }
                : { uri: `data:image/jpeg;base64,${book.cover_image}` }
            }
            style={styles.coverImage}
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverEmoji}>📖</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        <Text style={styles.stars}>{starStr}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 130,
    marginRight: 14,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: 170,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a1a3e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: {
    fontSize: 48,
  },
  info: {
    padding: 10,
  },
  title: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primaryText,
    marginBottom: 3,
    
  },
  author: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.subText,
    marginBottom: 5,
  },
  stars: {
    fontSize: 12,
    color: colors.gold,
    letterSpacing: 1,
  },
});
