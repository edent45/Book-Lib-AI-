import React from 'react';
import { View, Text, Image } from 'react-native';
import { colors, fonts } from '../theme';

const PX = 3; // size of one "pixel"

function BooksIcon() {
  return (
    <Image
      source={require('../../assets/book-stack.png')}
      style={{ width: 44, height: 44, marginRight: 8 }}
      resizeMode="contain"
    />
  );
}

export default function PixelProgressBar({ read, total }: { read: number; total: number }) {
  const ratio = total > 0 ? Math.min(read / total, 1) : 0;
  const label = `${read}/${total}`;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
      <BooksIcon />
      <View
        style={{
          flex: 1, height: 28,
          backgroundColor: colors.inputBg, borderWidth: PX, borderColor: colors.accentPurple,
          justifyContent: 'center',
        }}
      >
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, backgroundColor: colors.cardBg }} />
        <View style={{ marginHorizontal: 4, height: 16, borderWidth: PX, borderColor: colors.background, backgroundColor: colors.background }}>
          <View style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: colors.accentTeal }} />
        </View>
      </View>
      <Text style={{ marginLeft: 8, color: colors.accentTeal, fontFamily: fonts.extraBold, fontSize: 14 }}>
        {label}
      </Text>
    </View>
  );
}
