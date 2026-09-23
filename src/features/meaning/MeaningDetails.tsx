import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {MeaningCaptureSource, MeaningRepository, MeaningSummary} from '../../repositories/MeaningRepository';

interface MeaningDetailsProps {
  card: MeaningSummary;
  repository: Pick<MeaningRepository, 'getCaptureSources'>;
  onClose: () => void;
}

export function MeaningDetails({card, repository, onClose}: MeaningDetailsProps) {
  const dark = useColorScheme() === 'dark';
  const color = dark ? '#F4F4F0' : '#191919';
  const [sources, setSources] = useState<MeaningCaptureSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    setSources([]);
    void repository.getCaptureSources(card.currentRevisionId).then(result => {
      if (active) { setSources(result); }
    }).catch(() => {
      if (active) { setFailed(true); }
    }).finally(() => {
      if (active) { setLoading(false); }
    });
    return () => { active = false; };
  }, [repository, card.currentRevisionId, attempt]);

  return (
    <Modal visible animationType="none" onRequestClose={onClose}>
      <SafeAreaView style={[styles.screen, {backgroundColor: dark ? '#111210' : '#F7F7F5'}]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable accessibilityRole="button" accessibilityLabel="의미 카드 상세 닫기" onPress={onClose} style={styles.button}>
            <Text style={{color}}>닫기</Text>
          </Pressable>
          <Text accessibilityRole="header" selectable style={[styles.title, {color}]}>{card.title}</Text>
          {card.description !== undefined ? <Text selectable style={[styles.body, {color}]}>{card.description}</Text> : null}
          {loading ? <ActivityIndicator accessibilityLabel="출처 불러오는 중" /> : null}
          {failed ? <>
            <Text accessibilityRole="alert" style={{color}}>출처를 불러오지 못했습니다.</Text>
            <Pressable accessibilityRole="button" onPress={() => setAttempt(value => value + 1)} style={styles.button}>
              <Text style={{color}}>출처 다시 불러오기</Text>
            </Pressable>
          </> : null}
          {sources.length > 0 ? <Text accessibilityRole="header" style={[styles.section, {color}]}>연결 당시의 기록</Text> : null}
          {sources.map(source => (
            <React.Fragment key={source.revisionId}>
              <Text selectable style={[styles.body, {color}]}>{source.content}</Text>
              <Text style={[styles.date, {color}]}>
                {new Date(source.createdAt).toLocaleDateString('ko-KR')} · 저장 당시 버전 {source.revision}
              </Text>
            </React.Fragment>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  content: {padding: 20, paddingBottom: 48},
  button: {minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 12},
  title: {fontSize: 24, lineHeight: 34, fontWeight: '700', marginVertical: 16},
  body: {fontSize: 17, lineHeight: 27, marginBottom: 16},
  section: {fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 16},
  date: {fontSize: 13, marginBottom: 24},
});
