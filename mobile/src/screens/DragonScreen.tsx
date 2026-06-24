import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getBooks } from '../api/books';
import { getMoodRecommendations, Mood } from '../utils/recommendations';
import { Book } from '../types/book';
import { colors, fonts } from '../theme';

interface Message {
  id: string;
  role: 'user' | 'dragon';
  text: string;
}

const MOOD_CHIPS: { label: string; mood: Mood; emoji: string }[] = [
  { label: 'Cozy',          mood: 'cozy',          emoji: '🌙' },
  { label: 'Epic',          mood: 'epic',           emoji: '⚔️' },
  { label: 'Thoughtful',    mood: 'thoughtful',     emoji: '🧠' },
  { label: 'Fun',           mood: 'fun',            emoji: '😂' },
  { label: 'Thriller',      mood: 'thriller',       emoji: '😱' },
  { label: 'Philosophical', mood: 'philosophical',  emoji: '💭' },
];

const WELCOME: Message = {
  id: '0',
  role: 'dragon',
  text: 'Greetings, reader! 🐉 Tell me your mood and I\'ll find your perfect next read — or just pick a vibe below!',
};

export default function DragonScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMood, setActiveMood] = useState<Mood | null>(null);

  useEffect(() => {
    getBooks().then(setBooks).catch(() => {});
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  function addDragonReply(text: string) {
    setLoading(true);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'dragon', text },
      ]);
      setLoading(false);
    }, 1000);
  }

  function handleMoodSelect(chip: typeof MOOD_CHIPS[0]) {
    setActiveMood(chip.mood);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: chip.emoji + " I'm in the mood for something " + chip.label.toLowerCase() + '.',
    };
    setMessages(prev => [...prev, userMsg]);
    const { message } = getMoodRecommendations(books, chip.mood);
    addDragonReply(message);
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text }]);
    setInput('');
    addDragonReply(
      '🔥 I hear you! Try tapping one of the mood chips and I\'ll match it to your reading history. Full conversational magic is brewing — check back soon!'
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <LinearGradient
        colors={[colors.headerStart, colors.headerEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Image
          source={require('../../assets/dragon.png')}
          style={styles.headerDragon}
          resizeMode="contain"
        />
        <Text style={styles.dragonName}>The Book Dragon</Text>
        <Text style={styles.dragonTagline}>Your personal reading guide 🐉</Text>
      </LinearGradient>

      <View style={styles.moodRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodScroll}>
          {MOOD_CHIPS.map(chip => (
            <TouchableOpacity
              key={chip.mood}
              style={[styles.moodChip, activeMood === chip.mood && styles.moodChipActive]}
              onPress={() => handleMoodSelect(chip)}
            >
              <Text style={styles.moodChipText}>{chip.emoji} {chip.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.dragonBubble]}
          >
            {msg.role === 'dragon' && (
              <Image
                source={require('../../assets/dragon.png')}
                style={styles.dragonAvatar}
                resizeMode="contain"
              />
            )}
            <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userText : styles.dragonText]}>
              {msg.text}
            </Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.bubble, styles.dragonBubble]}>
            <Image source={require('../../assets/dragon.png')} style={styles.dragonAvatar} resizeMode="contain" />
            <Text style={[styles.dragonText, styles.thinkingText]}>thinking… 🔥</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Tell me how you feel..."
          placeholderTextColor={colors.mutedText}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={300}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <Text style={styles.sendButtonText}>🔥</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 54,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerDragon: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  dragonName: {
    fontSize: 22,
    fontFamily: fonts.extraBold,
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dragonTagline: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  moodRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    backgroundColor: colors.cardBg,
  },
  moodScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  moodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodChipActive: {
    backgroundColor: colors.accentPurple,
    borderColor: colors.accentPurple,
  },
  moodChipText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.primaryText,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dragonBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.statCard2,
    borderWidth: 1,
    borderColor: colors.accentPurple,
  },
  dragonAvatar: {
    width: 28,
    height: 28,
    marginTop: 2,
    flexShrink: 0,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    lineHeight: 20,
    flex: 1,
  },
  dragonText: {
    color: colors.primaryText,
  },
  userText: {
    color: colors.primaryText,
  },
  thinkingText: {
    color: colors.subText,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 28,
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.primaryText,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.accentPurple,
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },
  sendButtonText: {
    fontSize: 20,
  },
});