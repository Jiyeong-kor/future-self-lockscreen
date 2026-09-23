import React, {useCallback, useMemo, useRef, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useColorScheme, View} from 'react-native';
import {
  SqlMeaningRepository,
  type MeaningCursor,
  type MeaningRepository,
  type MeaningSummary,
} from '../../repositories/MeaningRepository';
import {MeaningComposer} from './MeaningComposer';
import {MeaningDetails} from './MeaningDetails';

export interface MeaningScreenProps {
  repository?: MeaningRepository;
}

export function MeaningScreen({repository}: MeaningScreenProps) {
  const dark = useColorScheme() === 'dark';
  const color = dark ? '#F4F4F0' : '#191919';
  const meaningRepository = useMemo(() => repository ?? new SqlMeaningRepository(), [repository]);
  const [items, setItems] = useState<MeaningSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [composing, setComposing] = useState(false);
  const [selected, setSelected] = useState<MeaningSummary>();
  const cursor = useRef<MeaningCursor>();
  const request = useRef(0);
  const busy = useRef(false);

  const load = useCallback(async (append = false) => {
    if (append && (busy.current || cursor.current === undefined)) { return; }
    const after = append ? cursor.current : undefined;
    const version = ++request.current;
    busy.current = true;
    setLoading(true);
    setError(undefined);
    try {
      const page = await meaningRepository.getPage(20, after);
      if (version !== request.current) { return; }
      setItems(previous => {
        if (!append) { return page.items; }
        const seen = new Set(previous.map(item => item.id));
        return [...previous, ...page.items.filter(item => !seen.has(item.id))];
      });
      cursor.current = page.nextCursor;
      setHasMore(page.nextCursor !== undefined);
    } catch {
      if (version === request.current) {
        setError('의미 카드 목록을 불러오지 못했습니다.');
      }
    } finally {
      if (version === request.current) {
        busy.current = false;
        setLoading(false);
      }
    }
  }, [meaningRepository]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => {
      request.current += 1;
      busy.current = false;
    };
  }, [load]));

  return (
    <View style={[styles.screen, {backgroundColor: dark ? '#111210' : '#F7F7F5'}]}>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text accessibilityRole="header" style={[styles.title, {color}]}>의미</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="의미 카드 추가"
              onPress={() => { setNotice(undefined); setComposing(true); }} style={styles.button}>
              <Text style={{color}}>카드 추가</Text>
            </Pressable>
            {notice !== undefined ? <Text accessibilityLiveRegion="polite" style={[styles.message, {color}]}>{notice}</Text> : null}
            {error !== undefined ? <>
              <Text accessibilityRole="alert" style={[styles.message, {color}]}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.button}>
                <Text style={{color}}>목록 다시 불러오기</Text>
              </Pressable>
            </> : null}
          </View>
        }
        ListEmptyComponent={!loading && error === undefined ?
          <Text style={[styles.message, {color}]}>아직 저장한 의미 카드가 없습니다.</Text> : null}
        renderItem={({item}) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`의미 카드 보기: ${item.title}`}
            onPress={() => setSelected(item)} style={[styles.card, {backgroundColor: dark ? '#1B1C19' : '#FFFFFF'}]}>
            <Text style={[styles.cardTitle, {color}]}>{item.title}</Text>
            {item.description !== undefined ? <Text numberOfLines={3} style={[styles.body, {color}]}>{item.description}</Text> : null}
          </Pressable>
        )}
        ListFooterComponent={loading ? <ActivityIndicator accessibilityLabel="의미 카드 불러오는 중" /> :
          hasMore ? <Pressable accessibilityRole="button" onPress={() => void load(true)} style={styles.button}>
            <Text style={{color}}>더 보기</Text>
          </Pressable> : null}
      />
      {composing ? <MeaningComposer repository={meaningRepository}
        onCancel={() => setComposing(false)}
        onSaved={() => {
          setComposing(false);
          setNotice('저장했습니다.');
          void load();
        }} /> : null}
      {selected !== undefined ? <MeaningDetails card={selected} repository={meaningRepository}
        onClose={() => setSelected(undefined)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  content: {padding: 20, paddingTop: 28, paddingBottom: 48},
  title: {fontSize: 30, fontWeight: '700', letterSpacing: -0.8, marginBottom: 12},
  button: {minHeight: 48, minWidth: 80, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, marginBottom: 12},
  message: {fontSize: 15, lineHeight: 23, marginBottom: 16},
  card: {padding: 16, borderRadius: 15, marginBottom: 12},
  cardTitle: {fontSize: 18, lineHeight: 27, fontWeight: '600'},
  body: {fontSize: 15, lineHeight: 24, marginTop: 8},
});
