import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {MeaningRecord, MeaningRepository} from '../../repositories/MeaningRepository';
import {DomainRuleViolation} from '../../domain';

export interface MeaningComposerSource {
  revisionId: string;
  content: string;
}

export interface MeaningComposerProps {
  repository: Pick<MeaningRepository, 'createUnclassified'>;
  source?: MeaningComposerSource;
  onSaved: (record: MeaningRecord) => void;
  onCancel: () => void;
}

export function MeaningComposer({repository, source, onSaved, onCancel}: MeaningComposerProps) {
  const dark = useColorScheme() === 'dark';
  const foreground = dark ? '#F4F4F0' : '#191919';
  const background = dark ? '#111210' : '#F7F7F5';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const savingRef = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function cancel() {
    if (savingRef.current) { return; }
    if (title.length === 0 && description.length === 0) {
      onCancel();
      return;
    }
    Alert.alert('작성 취소', '저장하지 않은 내용은 사라집니다.', [
      {text: '계속 작성', style: 'cancel'},
      {text: '작성 취소', style: 'destructive', onPress: onCancel},
    ]);
  }

  async function save() {
    if (savingRef.current || title.trim().length === 0) { return; }
    savingRef.current = true;
    setSaving(true);
    setError(undefined);
    let record: MeaningRecord;
    try {
      record = await repository.createUnclassified({
        title,
        description: description || undefined,
        sourceCaptureRevisionId: source?.revisionId,
      });
    } catch (failure) {
      if (mounted.current) {
        setError(failure instanceof DomainRuleViolation ? failure.message :
          '카드를 저장하지 못했습니다. 입력한 내용은 그대로 두었습니다.');
      }
      return;
    } finally {
      savingRef.current = false;
      if (mounted.current) { setSaving(false); }
    }
    // 저장 후 목록 조회 실패를 저장 실패로 취급하거나 같은 카드를 다시 만들지 않는다.
    if (mounted.current) { onSaved(record); }
  }

  return (
    <Modal visible animationType="none" onRequestClose={cancel}>
      <SafeAreaView style={[styles.fill, {backgroundColor: background}]}>
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <View style={styles.toolbar}>
              <Pressable accessibilityRole="button" accessibilityLabel="의미 카드 작성 취소"
                disabled={saving} onPress={cancel} style={styles.button}>
                <Text style={{color: foreground}}>취소</Text>
              </Pressable>
              <Text accessibilityRole="header" style={[styles.heading, {color: foreground}]}>의미 카드</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="의미 카드 저장"
                accessibilityState={{disabled: saving || title.trim().length === 0, busy: saving}}
                disabled={saving || title.trim().length === 0} onPress={save} style={styles.button}>
                {saving ? <ActivityIndicator accessibilityLabel="저장 중" /> :
                  <Text style={{color: foreground}}>저장</Text>}
              </Pressable>
            </View>
            <Text style={[styles.label, {color: foreground}]}>남길 생각</Text>
            <TextInput accessibilityLabel="의미 카드 내용" multiline editable={!saving}
              value={title} onChangeText={setTitle} placeholder="기억하고 싶은 생각"
              placeholderTextColor={dark ? '#AAAAA4' : '#686866'} textAlignVertical="top"
              style={[styles.input, {color: foreground}]} />
            <Text style={[styles.label, {color: foreground}]}>덧붙일 내용 · 선택</Text>
            <TextInput accessibilityLabel="의미 카드 추가 메모" multiline editable={!saving}
              value={description} onChangeText={setDescription} textAlignVertical="top"
              style={[styles.input, {color: foreground}]} />
            {source !== undefined ? (
              <View style={styles.source}>
                <Text style={[styles.label, {color: foreground}]}>출처가 되는 기록</Text>
                <Text selectable style={[styles.body, {color: foreground}]}>{source.content}</Text>
              </View>
            ) : null}
            {error !== undefined ? <Text accessibilityRole="alert" style={{color: dark ? '#FFB4AB' : '#B42318'}}>{error}</Text> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {flex: 1},
  content: {padding: 20, paddingBottom: 48},
  toolbar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24},
  heading: {fontSize: 20, fontWeight: '700', flexShrink: 1},
  button: {minWidth: 60, minHeight: 48, alignItems: 'center', justifyContent: 'center'},
  label: {fontSize: 14, marginBottom: 8},
  input: {minHeight: 100, fontSize: 17, lineHeight: 26, borderWidth: 1, borderColor: '#858580', borderRadius: 12, padding: 12, marginBottom: 24},
  source: {marginBottom: 24},
  body: {fontSize: 16, lineHeight: 25},
});
