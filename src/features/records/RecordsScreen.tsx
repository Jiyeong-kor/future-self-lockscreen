import React, {useCallback, useMemo, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  SqlCaptureRepository,
  type CaptureRepository,
  type CaptureSummary,
} from '../../repositories';

export interface RecordsScreenProps {
  repository?: CaptureRepository;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function RecordsScreen({repository}: RecordsScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const captureRepository = useMemo(
    () => repository ?? new SqlCaptureRepository(),
    [repository],
  );
  const [records, setRecords] = useState<CaptureSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await captureRepository.getRecent(100);
      setRecords(result);
      setErrorMessage(null);
    } catch {
      setErrorMessage('기록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [captureRepository]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View style={[styles.screen, {backgroundColor: colors.background}]}>
      <FlatList
        data={records}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, {color: colors.text}]}>기록</Text>
            <Text style={[styles.description, {color: colors.secondaryText}]}>
              남긴 문장을 시간순으로 다시 볼 수 있습니다.
            </Text>
            {errorMessage !== null ? (
              <Text accessibilityRole="alert" style={[styles.error, {color: colors.error}]}>
                {errorMessage}
              </Text>
            ) : null}
            {isLoading ? (
              <ActivityIndicator
                style={styles.loading}
                size="small"
                color={colors.secondaryText}
              />
            ) : null}
          </View>
        }
        renderItem={({item}) => (
          <View
            style={[
              styles.recordCard,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Text style={[styles.recordText, {color: colors.text}]}>{item.content}</Text>
            <Text style={[styles.recordDate, {color: colors.secondaryText}]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const lightColors = {
  background: '#F7F7F5',
  card: '#FFFFFF',
  text: '#191919',
  secondaryText: '#686866',
  border: '#E7E7E2',
  error: '#B42318',
};

const darkColors = {
  background: '#111210',
  card: '#1B1C19',
  text: '#F4F4F0',
  secondaryText: '#A9AAA4',
  border: '#30312D',
  error: '#FFB4AB',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 22,
    marginTop: 8,
  },
  error: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  loading: {
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  recordCard: {
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
    padding: 15,
  },
  recordText: {
    fontSize: 16,
    lineHeight: 23,
  },
  recordDate: {
    fontSize: 12,
    marginTop: 10,
  },
});
