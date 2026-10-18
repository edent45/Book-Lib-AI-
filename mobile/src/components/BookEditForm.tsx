import React , {useState} from 'react';
import { ActivityIndicator,Text , TextInput, TouchableOpacity, View } from 'react-native';
import {colors} from '../theme';
import {Book} from '../types/book';


export type BookChanges = Pick<
  Book,
  | 'title'
  | 'author'
  | 'genre'
  | 'rating'
  | 'read_year'
  | 'language'
  | 'series'
  | 'position'
  | 'notes'
>;

type Props = {book: Book;
    onCancel: () => void;
    onSave: (changes: BookChanges) => Promise<void>;
};



export default function BookEditForm({ book, onCancel, onSave }: Props) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [genre, setGenre] = useState(book.genre ?? '');
  const [rating, setRating] = useState(book.rating ?? 0);
  const [yearRead, setYearRead] = useState(
    book.read_year == null ? '' : String(book.read_year)
  );
  const [language, setLanguage] = useState(book.language ?? '');
  const [series, setSeries] = useState(book.series ?? '');
  const [position, setPosition] = useState(
    book.position == null ? '' : String(book.position)
  );
  const [notes, setNotes] = useState(book.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        author: author.trim(),
        genre: genre.trim() || null,
        rating: rating || null,
        read_year: yearRead ? Number(yearRead) : null,
        language: language.trim() || null,
        series: series.trim() || null,
        position: position ? Number(position) : null,
        notes: notes.trim() || null,
      });
    } catch {
      setError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
};

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Text style={{ color: colors.primaryText, fontSize: 22, marginBottom: 16 }}>
        Edit Book
      </Text>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor={colors.mutedText}
        style={inputStyle}
      />
      <TextInput
        value={author}
        onChangeText={setAuthor}
        placeholder="Author"
        placeholderTextColor={colors.mutedText}
        style={inputStyle}
      />
      <TextInput
        value={genre}
        onChangeText={setGenre}
        placeholder="Genre"
        placeholderTextColor={colors.mutedText}
        style={inputStyle}
      />

      <Text style={{ color: colors.primaryText, marginTop: 8 }}>My Rating</Text>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => setRating(n)}>
            <Text style={{ color: n <= rating ? '#FFC83D' : '#666', fontSize: 28 }}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        value={yearRead}
        onChangeText={setYearRead}
        placeholder="Year read"
        keyboardType="numeric"
        maxLength={4}
        placeholderTextColor={colors.mutedText}
        style={inputStyle}
      />
      <TextInput
        value={language}
        onChangeText={setLanguage}
        placeholder="Language"
        placeholderTextColor={colors.mutedText}
        style={inputStyle}
      />
      <TextInput
        value={series}
        onChangeText={setSeries}
        placeholder="Series"
        placeholderTextColor={colors.mutedText}
        style={inputStyle}
      />
      <TextInput
        value={position}
        onChangeText={setPosition}
        placeholder="Position in series"
        keyboardType="numeric"
        placeholderTextColor={colors.mutedText}
        style={inputStyle}
      />
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes"
        multiline
        placeholderTextColor={colors.mutedText}
        style={[inputStyle, { height: 90, textAlignVertical: 'top' }]}
      />

      {error && <Text style={{ color: '#ff6b6b', marginBottom: 12 }}>{error}</Text>}

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={onCancel} style={buttonStyle}>
          <Text style={{ color: '#fff' }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={buttonStyle}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff' }}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}


const inputStyle = {
  backgroundColor: colors.cardBg,
  color: colors.primaryText,
  borderRadius: 10,
  padding: 12,
  marginBottom: 10,
};

const buttonStyle = {
  backgroundColor: colors.accentPurple,
  padding: 12,
  borderRadius: 10,
  alignItems: 'center' as const,
  flex: 1,
};