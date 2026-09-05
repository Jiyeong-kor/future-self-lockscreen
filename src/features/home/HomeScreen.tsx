import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import {
  SqlCaptureRepository,
  type CaptureRepository,
  type CaptureSummary,
} from '../../repositories';

export interface HomeScreenProps {
  repository?: CaptureRepository;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function HomeScreen({repository}: HomeScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const captureRepository = useMemo(
    () => repository ?? new SqlCaptureRepository(),
    [repository],
  );
  const [content, setContent] = useState('');
  const [recent, setRecent] = useState<CaptureSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const colors = isDark ? darkColors : lightColors;

  const loadRecent = useCallback(async () => {
    try {
      const records = await captureRepository.getRecent(8);
      setRecent(records);
      setErrorMessage(null);
    } catch {
      setErrorMessage('최근 기록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [captureRepository]);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  const save = useCallback(async () => {
    if (content.trim().length === 0 || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await captureRepository.create({content});
      setContent('');
      await loadRecent();
    } catch {
      setErrorMessage('기록을 저장하지 못했습니다. 입력한 내용은 그대로 두었습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [captureRepository, content, isSaving, loadRecent]);

  return (
    <View style={[styles.screen, {backgroundColor: colors.background}]}>
      <FlatList
        data={recent}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text style={[styles.eyebrow, {color: colors.secondaryText}]}>Future Self</Text>
            <Text style={[styles.title, {color: colors.text}]}>지금의 생각</Text>

            <View
              style={[
                styles.captureCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}>
              <TextInput
                accessibilityLabel="빠른 기록"
                multiline
                placeholder="지금 떠오르는 생각"
                placeholderTextColor={colors.placeholder}
                value={content}
                onChangeText={setContent}
                style={[styles.input, {color: colors.text}]}
                textAlignVertical="top"
                maxLength={4000}
              />
              <View style={styles.captureActions}>
                <Text style={[styles.hint, {color: colors.secondaryText}]}>적고 바로 닫을 수 있어요</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="기록 저장"
                  disabled={content.trim().length === 0 || isSaving}
                  onPress={() => void save()}
                  style={({pressed}) => [
                    styles.saveButton,
                    {
                      backgroundColor:
                        content.trim().length === 0 || isSaving
                          ? colors.disabled
                          : colors.accent,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.buttonText} />
                  ) : (
                    <Text style={[styles.saveButtonText, {color: colors.buttonText}]}>저장</Text>
                  )}
                </Pressable>
              </View>
            </View>

            {errorMessage !== null ? (
              <Text accessibilityRole="alert" style={[styles.error, {color: colors.error}]}>
                {errorMessage}
              </Text>
            ) : null}

            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.secondaryText} />
              </View>
            ) : recent.length > 0 ? (
              <Text style={[styles.sectionTitle, {color: colors.text}]}>최근 기록</Text>
            ) : null}
          </View>
        }
        renderItem={({item}) => (
          <View
            style={[
              styles.recordCard,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Text style={[styles.recordText, {color: colors.text}]} numberOfLines={4}>
              {item.content}
            </Text>
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
  placeholder: '#9A9A96',
  border: '#E7E7E2',
  accent: '#222222',
  disabled: '#C9C9C4',
  buttonText: '#FFFFFF',
  error: '#B42318',
};

const darkColors = {
  background: '#111210',
  card: '#1B1C19',
  text: '#F4F4F0',
  secondaryText: '#A9AAA4',
  placeholder: '#767771',
  border: '#30312D',
  accent: '#F1F1ED',
  disabled: '#464742',
  buttonText: '#151613',
  error: '#FFB4AB',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: 20,
  },
  captureCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 16,
  },
  input: {
    minHeight: 96,
    fontSize: 17,
    lineHeight: 25,
    padding: 0,
  },
  captureActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 14,
  },
  hint: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 70,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  error: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  loadingRow: {
    alignItems: 'flex-start',
    paddingVertical: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 28,
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
