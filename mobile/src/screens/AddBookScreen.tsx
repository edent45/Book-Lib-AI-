import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Image, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../theme';
import { searchBooks, createBook, BookSearchResult } from '../api/books';

const GENRES = ['Fantasy', 'Fiction', 'Sci-Fi', 'Mystery', 'Thriller', 'Historical', 'Non-Fiction', 'Romance', 'Classic', 'Other'];

export default function AddBookScreen() {
  // ── Stage 1: search ──────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);


  // ── Stage 2: form ────────────────────────────────────────────
  const [selected, setSelected] = useState<BookSearchResult | null>(null);
  const [rating, setRating] = useState(0);
  const [yearRead, setYearRead] = useState(String(new Date().getFullYear()));
  const [language, setLanguage] = useState('');
  const [series, setSeries] = useState('');
  const [position, setPosition] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setSearching(true);
    setSearchError(null);
    setResults([]);

  
    try {
      const data = await searchBooks(query.trim());
      setResults(data);
      if (data.length === 0) {
        setSearchError('No books found.');
      }
    } catch {
      setSearchError(
      'Book search is temporarily unavailable. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (book: BookSearchResult) => {
    setSelected(book);
    setResults([]);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await createBook({
        title: selected.title,
        author: selected.author,
        genre: selected.genre,
        isbn: selected.isbn,
        published_date: selected.published_date,
        cover_image: null,
        series: series || null,
        position: position ? parseInt(position) : null,
        language: language || null,
        read_year: yearRead ? parseInt(yearRead) : null,
        rating: rating || null,
        cover_url: selected.cover || null,
        notes: notes || null,
        tags: null,
      });
      setSaved(true);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────
  if (saved) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 56 }}>✅</Text>
        <Text style={styles.savedTitle}>{selected?.title}</Text>
        <Text style={styles.savedSub}>Added to your library!</Text>
        <TouchableOpacity style={styles.addAnother} onPress={() => {
          setSelected(null); setQuery(''); setRating(0);
          setYearRead(String(new Date().getFullYear()));
          setLanguage(''); setSeries(''); setPosition(''); setNotes('');
          setSaved(false);
        }}>
          <Text style={styles.addAnotherText}>Add Another</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Stage 2: form ─────────────────────────────────────────────
  if (selected) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Header */}
          <LinearGradient colors={[colors.headerStart, colors.headerEnd]} style={styles.formHeader}>
            <TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.formHeaderTitle}>Add to Library</Text>
          </LinearGradient>

          {/* Book preview */}
          <View style={styles.previewRow}>
            {selected.cover ? (
              <Image source={{ uri: selected.cover }} style={styles.coverImg} />
            ) : (
              <View style={styles.coverPlaceholder}><Text style={{ fontSize: 32 }}>📖</Text></View>
            )}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.previewTitle}>{selected.title}</Text>
              <Text style={styles.previewAuthor}>{selected.author}</Text>
              {selected.genre && <Text style={styles.previewGenre}>{selected.genre}</Text>}
            </View>
          </View>

          {/* Star rating */}
          <Text style={styles.label}>My Rating</Text>
          <View style={styles.starRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Text style={[styles.star, n <= rating && styles.starFilled]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Year read */}
          <Text style={styles.label}>Year Read</Text>
          <TextInput
            style={styles.input}
            value={yearRead}
            onChangeText={setYearRead}
            keyboardType="numeric"
            maxLength={4}
            placeholderTextColor={colors.mutedText}
          />

          {/* Language */}
          <Text style={styles.label}>Language</Text>
          <TextInput style={styles.input} value={language} onChangeText={setLanguage}
            placeholder="e.g. English" placeholderTextColor={colors.mutedText} />

          {/* Series */}
          <Text style={styles.label}>Series (optional)</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput style={[styles.input, { flex: 1 }]} value={series} onChangeText={setSeries}
              placeholder="Series name" placeholderTextColor={colors.mutedText} />
            <TextInput style={[styles.input, { width: 60 }]} value={position} onChangeText={setPosition}
              placeholder="#" keyboardType="numeric" placeholderTextColor={colors.mutedText} />
          </View>

          {/* Notes */}
          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            value={notes} onChangeText={setNotes} multiline
            placeholder="Your thoughts..." placeholderTextColor={colors.mutedText} />

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Add to Library</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Stage 1: search ───────────────────────────────────────────
  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.headerStart, colors.headerEnd]} style={styles.searchHeader}>
        <Text style={styles.searchHeaderTitle}>Add a Book</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            placeholder="Search by title or author..."
            placeholderTextColor={colors.mutedText}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Go</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {searching && <ActivityIndicator color={colors.accentPurple} style={{ marginTop: 40 }} />}
      {searchError && (<Text style={styles.searchError}>{searchError}</Text>)}

      <FlatList
        data={results}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(item)}>
            {item.cover
              ? <Image source={{ uri: item.cover }} style={styles.resultCover} />
              : <View style={styles.resultCoverPlaceholder}><Text>📖</Text></View>
            }
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.resultAuthor}>{item.author}</Text>
              {item.published_date && (
                <Text style={styles.resultDate}>{item.published_date.slice(0, 4)}</Text>
              )}
            </View>
            <Text style={{ color: colors.accentPurple, fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },

  // Search stage
  searchHeader: { paddingTop: 54, paddingBottom: 24, paddingHorizontal: 20 },
  searchHeaderTitle: { fontFamily: fonts.extraBold, fontSize: 28, color: '#fff', marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, color: colors.primaryText,
    fontFamily: fonts.regular, fontSize: 14,
  },
  searchBtn: {
    backgroundColor: colors.accentPurple, borderRadius: 12,
    paddingHorizontal: 18, justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontFamily: fonts.bold, fontSize: 14 },
  searchError: {
    color: '#c0392b',
    fontFamily: fonts.semiBold,
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 20,},

  // Results
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.cardBg, borderRadius: 12,
    padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  resultCover: { width: 44, height: 64, borderRadius: 4 },
  resultCoverPlaceholder: {
    width: 44, height: 64, borderRadius: 4,
    backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center',
  },
  resultTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.primaryText, marginBottom: 2 },
  resultAuthor: { fontFamily: fonts.regular, fontSize: 12, color: colors.subText },
  resultDate: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedText, marginTop: 2 },

  // Form stage
  formHeader: { paddingTop: 54, paddingBottom: 20, paddingHorizontal: 20 },
  backBtn: { marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.semiBold, fontSize: 14 },
  formHeaderTitle: { fontFamily: fonts.extraBold, fontSize: 24, color: '#fff' },
  previewRow: {
    flexDirection: 'row', padding: 16, margin: 16,
    backgroundColor: colors.cardBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
  },
  coverImg: { width: 70, height: 100, borderRadius: 6 },
  coverPlaceholder: {
    width: 70, height: 100, borderRadius: 6,
    backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center',
  },
  previewTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.primaryText, marginBottom: 4 },
  previewAuthor: { fontFamily: fonts.regular, fontSize: 13, color: colors.subText },
  previewGenre: {
    fontFamily: fonts.semiBold, fontSize: 11, color: colors.accentPurple,
    marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  label: {
    fontFamily: fonts.semiBold, fontSize: 12, color: colors.subText,
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.inputBg, borderRadius: 10, marginHorizontal: 16,
    paddingHorizontal: 14, paddingVertical: 10,
    color: colors.primaryText, fontFamily: fonts.regular, fontSize: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  starRow: { flexDirection: 'row', marginHorizontal: 16, gap: 8 },
  star: { fontSize: 32, color: colors.mutedText },
  starFilled: { color: colors.gold },
  saveBtn: {
    backgroundColor: colors.accentPurple, margin: 16, marginTop: 24,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { fontFamily: fonts.bold, fontSize: 16, color: '#fff' },

  // Success
  savedTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.primaryText, marginTop: 16 },
  savedSub: { fontFamily: fonts.regular, fontSize: 14, color: colors.subText, marginTop: 6 },
  addAnother: { marginTop: 24, borderWidth: 1, borderColor: colors.accentPurple, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  addAnotherText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.accentPurple },
});