import React from 'react';
import {StyleSheet, Text, useColorScheme, View} from 'react-native';

export function MeaningScreen() {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.screen, {backgroundColor: colors.background}]}>
      <Text style={[styles.title, {color: colors.text}]}>의미</Text>
      <Text style={[styles.description, {color: colors.secondaryText}]}>
        필요할 때 기록을 의미 카드로 남기고 서로 연결할 수 있습니다.
      </Text>
      <View
        style={[
          styles.infoCard,
          {backgroundColor: colors.card, borderColor: colors.border},
        ]}>
        <Text style={[styles.infoTitle, {color: colors.text}]}>분류 없이 남겨도 됩니다</Text>
        <Text style={[styles.infoText, {color: colors.secondaryText}]}>
          이유, 미래상, 목표, 실천, 원칙 중 하나로 정하지 않아도 의미 카드는 그대로 유지됩니다.
        </Text>
      </View>
    </View>
  );
}

const lightColors = {
  background: '#F7F7F5',
  card: '#FFFFFF',
  text: '#191919',
  secondaryText: '#686866',
  border: '#E7E7E2',
};

const darkColors = {
  background: '#111210',
  card: '#1B1C19',
  text: '#F4F4F0',
  secondaryText: '#A9AAA4',
  border: '#30312D',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  infoCard: {
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 24,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
});
