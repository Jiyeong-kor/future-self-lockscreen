import React, {useCallback, useMemo, useRef, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, useColorScheme, View} from 'react-native';
import {SqlCaptureRepository, type CaptureRepository, type CaptureSummary} from '../../repositories/CaptureRepository';
import {SqlMeaningRepository, type MeaningRepository} from '../../repositories/MeaningRepository';
import {MeaningComposer} from '../meaning/MeaningComposer';

export interface RecordsScreenProps {
  repository?: CaptureRepository;
  meaningRepository?: MeaningRepository;
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('ko-KR', {year: 'numeric', month: 'short', day: 'numeric'}).format(new Date(isoDate));
}

export function RecordsScreen({repository, meaningRepository}: RecordsScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const captureRepository = useMemo(() => repository ?? new SqlCaptureRepository(), [repository]);
  const cardRepository = useMemo(() => meaningRepository ?? new SqlMeaningRepository(), [meaningRepository]);
  const [records, setRecords] = useState<CaptureSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>();
  const [source, setSource] = useState<CaptureSummary>();
  const request = useRef(0);

  const load = useCallback(async () => {
    const version = ++request.current;
    setIsLoading(true);
    try {
      const result = await captureRepository.getRecent(100);
      if (version === request.current) {
        setRecords(result);
        setErrorMessage(null);
      }
    } catch {
      if (version === request.current) { setErrorMessage('기록을 불러오지 못했습니다.'); }
    } finally {
      if (version === request.current) { setIsLoading(false); }
    }
  }, [captureRepository]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { request.current += 1; };
  }, [load]));

  function openRecordMenu(record: CaptureSummary) {
    Alert.alert('기록', undefined, [
      {text: '의미 카드로 남기기', onPress: () => { setNotice(undefined); setSource(record); }},
      {text: '취소', style: 'cancel'},
    ]);
  }

  return (
    <View style={[styles.screen, {backgroundColor: colors.background}]}>
      <FlatList data={records} keyExtractor={item => item.id} contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text accessibilityRole="header" style={[styles.title, {color: colors.text}]}>기록</Text>
            <Text style={[styles.description, {color: colors.secondaryText}]}>남긴 문장을 시간순으로 다시 볼 수 있습니다.</Text>
            {notice !== undefined ? <Text accessibilityLiveRegion="polite" style={[styles.description, {color: colors.text}]}>{notice}</Text> : null}
            {errorMessage !== null ? <>
              <Text accessibilityRole="alert" style={[styles.error, {color: colors.error}]}>{errorMessage}</Text>
              <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.button}>
                <Text style={{color: colors.text}}>기록 다시 불러오기</Text>
              </Pressable>
            </> : null}
            {isLoading ? <ActivityIndicator accessibilityLabel="기록 불러오는 중" style={styles.loading} color={colors.secondaryText} /> : null}
          </View>
        }
        ListEmptyComponent={!isLoading && errorMessage === null ?
          <Text style={{color: colors.secondaryText}}>아직 저장한 기록이 없습니다.</Text> : undefined}
        renderItem={({item}) => (
          <View style={[styles.recordCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Text selectable style={[styles.recordText, {color: colors.text}]}>{item.content}</Text>
            <Text style={[styles.recordDate, {color: colors.secondaryText}]}>{formatDate(item.createdAt)}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="기록 메뉴" testID={`record-menu-${item.id}`}
              onPress={() => openRecordMenu(item)} style={styles.button}>
              <Text style={{color: colors.secondaryText}}>더 보기</Text>
            </Pressable>
          </View>
        )}
      />
      {source !== undefined ? <MeaningComposer repository={cardRepository}
        source={{revisionId: source.currentRevisionId, content: source.content}}
        onCancel={() => setSource(undefined)}
        onSaved={() => { setSource(undefined); setNotice('의미 카드로 저장했습니다.'); }} /> : null}
    </View>
  );
}

const lightColors = {
  background: '#F7F7F5', card: '#FFFFFF', text: '#191919', secondaryText: '#686866', border: '#E7E7E2', error: '#B42318',
};
const darkColors = {
  background: '#111210', card: '#1B1C19', text: '#F4F4F0', secondaryText: '#A9AAA4', border: '#30312D', error: '#FFB4AB',
};
const styles = StyleSheet.create({
  screen: {flex: 1},
  content: {paddingHorizontal: 20, paddingTop: 28, paddingBottom: 36},
  title: {fontSize: 30, fontWeight: '700', letterSpacing: -0.8},
  description: {fontSize: 14, lineHeight: 20, marginBottom: 22, marginTop: 8},
  error: {fontSize: 13, lineHeight: 19, marginBottom: 12},
  loading: {alignSelf: 'flex-start', marginBottom: 18},
  recordCard: {borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10, padding: 15},
  recordText: {fontSize: 16, lineHeight: 23},
  recordDate: {fontSize: 12, marginTop: 10},
  button: {minHeight: 48, minWidth: 72, justifyContent: 'center', alignSelf: 'flex-start'},
});
