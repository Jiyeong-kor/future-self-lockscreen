import React from 'react';
import Renderer from 'react-test-renderer';
import {Alert, TextInput} from 'react-native';
import {MeaningComposer, type MeaningComposerProps} from '../MeaningComposer';
import type {MeaningRecord} from '../../../repositories/MeaningRepository';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));

const record: MeaningRecord = {
  node: {id: 'node-1', kind: 'unclassified', status: 'active', currentRevisionId: 'revision-1', createdAt: '2026-01-01T00:00:00.000Z'},
  revision: {id: 'revision-1', nodeId: 'node-1', revision: 1, title: '남기고 싶은 생각', createdAt: '2026-01-01T00:00:00.000Z'},
};

describe('MeaningComposer', () => {
  let tree: Renderer.ReactTestRenderer | undefined;
  let create: jest.Mock;
  let onSaved: jest.Mock;
  let onCancel: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    create = jest.fn().mockResolvedValue(record);
    onSaved = jest.fn();
    onCancel = jest.fn();
  });
  afterEach(async () => {
    await Renderer.act(async () => { tree?.unmount(); });
    await Renderer.act(async () => { jest.runOnlyPendingTimers(); });
    tree = undefined;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  async function render(extra: Partial<MeaningComposerProps> = {}) {
    await Renderer.act(async () => {
      tree = Renderer.create(<MeaningComposer repository={{createUnclassified: create}}
        onSaved={onSaved} onCancel={onCancel} {...extra} />);
    });
  }
  function input(label: string) {
    return tree!.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === label)!;
  }
  function button(label: string) {
    const matches = tree!.root.findAll(item =>
      item.props.accessibilityLabel === label && typeof item.props.onPress === 'function');
    if (matches.length === 0) { throw new Error(`버튼을 찾을 수 없습니다: ${label}`); }
    return matches[0];
  }
  async function type(text: string) {
    await Renderer.act(async () => { input('의미 카드 내용').props.onChangeText(text); });
  }

  it('분류나 행동 입력 없이 생각만 저장한다', async () => {
    await render();
    expect(tree!.root.findAllByType(TextInput)).toHaveLength(2);
    await type('남기고 싶은 생각');
    await Renderer.act(async () => { await button('의미 카드 저장').props.onPress(); });
    expect(create).toHaveBeenCalledWith({title: '남기고 싶은 생각', description: undefined, sourceCaptureRevisionId: undefined});
    expect(onSaved).toHaveBeenCalledWith(record);
  });

  it('사용자가 선택한 원본 버전만 출처로 전달한다', async () => {
    await render({source: {revisionId: 'capture-r1', content: '처음 남긴 기록'}});
    await type('나중에 떠오른 생각');
    await Renderer.act(async () => { await button('의미 카드 저장').props.onPress(); });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({sourceCaptureRevisionId: 'capture-r1'}));
  });

  it('저장이 실패하면 입력과 메모를 유지한다', async () => {
    create.mockRejectedValue(new Error('storage failure'));
    await render();
    await type('사라지면 안 되는 생각');
    await Renderer.act(async () => { input('의미 카드 추가 메모').props.onChangeText('추가 메모'); });
    await Renderer.act(async () => { await button('의미 카드 저장').props.onPress(); });
    expect(input('의미 카드 내용').props.value).toBe('사라지면 안 되는 생각');
    expect(input('의미 카드 추가 메모').props.value).toBe('추가 메모');
    expect(onSaved).not.toHaveBeenCalled();
    expect(button('의미 카드 저장').props.disabled).toBe(false);
  });

  it('빠르게 두 번 누르더라도 한 번만 저장하고 저장 중 입력을 보호한다', async () => {
    let resolve!: (value: MeaningRecord) => void;
    create.mockReturnValue(new Promise<MeaningRecord>(done => { resolve = done; }));
    await render();
    await type('한 번만 저장');
    let saving: Promise<void>;
    await Renderer.act(async () => {
      const save = button('의미 카드 저장').props.onPress;
      saving = save();
      await save();
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(input('의미 카드 내용').props.editable).toBe(false);
    expect(button('의미 카드 작성 취소').props.disabled).toBe(true);
    await Renderer.act(async () => { resolve(record); await saving; });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('빈 작성 화면은 아무 기록 없이 나갈 수 있다', async () => {
    await render();
    await Renderer.act(async () => { button('의미 카드 작성 취소').props.onPress(); });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('작성 중 취소하면 데이터 손실 확인 후에만 나간다', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await render();
    await type('작성 중');
    await Renderer.act(async () => { button('의미 카드 작성 취소').props.onPress(); });
    expect(onCancel).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0][2]!;
    expect(buttons[0].style).toBe('cancel');
    await Renderer.act(async () => { buttons[1].onPress?.(); });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  });
});
