import React from 'react';
import Renderer from 'react-test-renderer';
import {Alert, Pressable, Text, TextInput} from 'react-native';
import {MeaningScreen} from '../MeaningScreen';
import {MeaningComposer} from '../MeaningComposer';
import {MeaningDetails} from '../MeaningDetails';
import {RecordsScreen} from '../../records/RecordsScreen';
import type {MeaningRepository, MeaningRecord, MeaningSummary} from '../../../repositories/MeaningRepository';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => (() => void) | void) => {
    const react = jest.requireActual('react');
    react.useEffect(effect, [effect]);
  },
}));

const timestamp = '2026-01-01T00:00:00.000Z';
const card: MeaningSummary = {
  id: 'node-1', kind: 'unclassified', status: 'active', currentRevisionId: 'node-r1',
  title: '남겨 둔 생각', createdAt: timestamp,
};
const record: MeaningRecord = {
  node: {id: card.id, kind: card.kind, status: card.status, currentRevisionId: card.currentRevisionId, createdAt: timestamp},
  revision: {id: card.currentRevisionId, nodeId: card.id, revision: 1, title: card.title, createdAt: timestamp},
};

describe('Meaning card flows', () => {
  let tree: Renderer.ReactTestRenderer | undefined;
  let repository: MeaningRepository;
  let getPage: jest.Mock;
  let create: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    getPage = jest.fn().mockResolvedValue({items: []});
    create = jest.fn().mockResolvedValue(record);
    repository = {
      createUnclassified: create,
      getPage,
      getCurrent: jest.fn().mockResolvedValue([]),
      getCaptureSources: jest.fn().mockResolvedValue([]),
    };
  });
  afterEach(async () => {
    await Renderer.act(async () => { tree?.unmount(); jest.runOnlyPendingTimers(); });
    tree = undefined;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  async function render(element: React.ReactElement) {
    await Renderer.act(async () => { tree = Renderer.create(element); });
  }
  function button(label: string) {
    return tree!.root.findAllByType(Pressable).find(item => item.props.accessibilityLabel === label)!;
  }
  function hasText(text: string) {
    return tree!.root.findAllByType(Text).some(item => item.props.children === text);
  }
  function textButton(text: string) {
    return tree!.root.findAllByType(Pressable).find(item =>
      item.findAllByType(Text).some(child => child.props.children === text))!;
  }

  it('카드 추가는 명시적으로 선택하기 전에는 열리지 않는다', async () => {
    await render(<MeaningScreen repository={repository} />);
    expect(tree!.root.findAllByType(MeaningComposer)).toHaveLength(0);
    expect(create).not.toHaveBeenCalled();
    await Renderer.act(async () => { button('의미 카드 추가').props.onPress(); });
    expect(tree!.root.findAllByType(MeaningComposer)).toHaveLength(1);
  });

  it('저장 후 목록 조회가 실패해도 저장을 다시 요구하지 않는다', async () => {
    getPage.mockResolvedValueOnce({items: []}).mockRejectedValue(new Error('read failed'));
    await render(<MeaningScreen repository={repository} />);
    await Renderer.act(async () => { button('의미 카드 추가').props.onPress(); });
    const input = tree!.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === '의미 카드 내용')!;
    await Renderer.act(async () => { input.props.onChangeText('남겨 둔 생각'); });
    await Renderer.act(async () => { await button('의미 카드 저장').props.onPress(); });
    expect(create).toHaveBeenCalledTimes(1);
    expect(tree!.root.findAllByType(MeaningComposer)).toHaveLength(0);
    expect(hasText('저장했습니다.')).toBe(true);
    expect(hasText('의미 카드 목록을 불러오지 못했습니다.')).toBe(true);
    expect(hasText('아직 저장한 의미 카드가 없습니다.')).toBe(false);
  });

  it('목록 조회 실패를 빈 데이터로 오인하지 않는다', async () => {
    getPage.mockRejectedValue(new Error('read failed'));
    await render(<MeaningScreen repository={repository} />);
    expect(hasText('의미 카드 목록을 불러오지 못했습니다.')).toBe(true);
    expect(hasText('아직 저장한 의미 카드가 없습니다.')).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it('다음 페이지의 경계를 전달하고 기존 카드를 유지한다', async () => {
    const cursor = {createdAt: timestamp, id: card.id};
    getPage.mockResolvedValueOnce({items: [card], nextCursor: cursor})
      .mockResolvedValueOnce({items: [{...card, id: 'node-2', title: '다른 생각'}]});
    await render(<MeaningScreen repository={repository} />);
    await Renderer.act(async () => { textButton('더 보기').props.onPress(); });
    expect(getPage).toHaveBeenLastCalledWith(20, cursor);
    expect(hasText('남겨 둔 생각')).toBe(true);
    expect(hasText('다른 생각')).toBe(true);
  });

  it('카드를 열면 선택한 카드 버전의 출처를 읽는다', async () => {
    getPage.mockResolvedValue({items: [card]});
    await render(<MeaningScreen repository={repository} />);
    await Renderer.act(async () => { button('의미 카드 보기: 남겨 둔 생각').props.onPress(); });
    expect(tree!.root.findAllByType(MeaningDetails)).toHaveLength(1);
    expect(repository.getCaptureSources).toHaveBeenCalledWith('node-r1');
    expect(create).not.toHaveBeenCalled();
  });

  it('기록 메뉴에서 선택할 때만 원문 버전을 작성 화면에 연결한다', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const captureRepository = {
      create: jest.fn(),
      getRecent: jest.fn().mockResolvedValue([{
        id: 'capture-1', currentRevisionId: 'capture-r7', kind: 'thought',
        content: '사용자가 선택한 기록', createdAt: timestamp,
      }]),
    };
    await render(<RecordsScreen repository={captureRepository} meaningRepository={repository} />);
    expect(tree!.root.findAllByType(MeaningComposer)).toHaveLength(0);
    await Renderer.act(async () => { button('기록 메뉴').props.onPress(); });
    expect(tree!.root.findAllByType(MeaningComposer)).toHaveLength(0);
    const action = alert.mock.calls[0][2]!.find(item => item.text === '의미 카드로 남기기')!;
    await Renderer.act(async () => { action.onPress?.(); });
    expect(tree!.root.findByType(MeaningComposer).props.source).toEqual({
      revisionId: 'capture-r7', content: '사용자가 선택한 기록',
    });
    await Renderer.act(async () => { button('의미 카드 작성 취소').props.onPress(); });
    expect(create).not.toHaveBeenCalled();
    expect(captureRepository.create).not.toHaveBeenCalled();
  });
});
