import React from 'react';
import {StyleSheet, Text, useColorScheme, View} from 'react-native';

const sections = [
  ['개인정보 보호', '앱 잠금과 재노출 제외 설정'],
  ['데이터', '암호화 백업, 복원, 내보내기'],
  ['잠금화면', 'Widget과 공개 문장 설정'],
] as const;

export function SettingsScreen() {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.screen, {backgroundColor: colors.background}]}>
      <Text style={[styles.title, {color: colors.text}]}>설정</Text>
      <View style={styles.list}>
        {sections.map(([title, description]) => (
          <View
            key={title}
            style={[
              styles.row,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Text style={[styles.rowTitle, {color: colors.text}]}>{title}</Text>
            <Text style={[styles.rowDescription, {color: colors.secondaryText}]}>
              {description}
            </Text>
          </View>
        ))}
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
  list: {
    gap: 10,
    marginTop: 24,
  },
  row: {
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  rowDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
});
