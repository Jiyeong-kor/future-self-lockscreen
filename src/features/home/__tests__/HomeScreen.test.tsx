import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import type {CaptureRepository} from '../../../repositories';
import {HomeScreen} from '../HomeScreen';

describe('HomeScreen', () => {
  it('saves one-line capture, clears the input, and reloads recent records', async () => {
    const create = jest.fn().mockResolvedValue({
      entry: {
        id: 'entry-1',
        currentRevisionId: 'revision-1',
        createdAt: '2026-09-05T08:00:00.000Z',
      },
      revision: {
        id: 'revision-1',
        entryId: 'entry-1',
        revision: 1,
        kind: 'thought',
        content: '지금 떠오른 생각',
        tags: [],
        createdAt: '2026-09-05T08:00:00.000Z',
      },
    });
    const getRecent = jest.fn().mockResolvedValue([]);
    const repository: CaptureRepository = {create, getRecent};

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen repository={repository} />);
      await Promise.resolve();
    });

    const input = renderer!.root.findByProps({accessibilityLabel: '빠른 기록'});
    await ReactTestRenderer.act(async () => {
      input.props.onChangeText('지금 떠오른 생각');
    });

    const saveButton = renderer!.root.findByProps({accessibilityLabel: '기록 저장'});
    await ReactTestRenderer.act(async () => {
      await saveButton.props.onPress();
    });

    expect(create).toHaveBeenCalledWith({content: '지금 떠오른 생각'});
    expect(getRecent).toHaveBeenCalledTimes(2);
    expect(
      renderer!.root.findByProps({accessibilityLabel: '빠른 기록'}).props.value,
    ).toBe('');
  });

  it('keeps typed content when saving fails', async () => {
    const repository: CaptureRepository = {
      create: jest.fn().mockRejectedValue(new Error('storage failed')),
      getRecent: jest.fn().mockResolvedValue([]),
    };

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen repository={repository} />);
      await Promise.resolve();
    });

    const input = renderer!.root.findByProps({accessibilityLabel: '빠른 기록'});
    await ReactTestRenderer.act(async () => {
      input.props.onChangeText('지우면 안 되는 내용');
    });

    const saveButton = renderer!.root.findByProps({accessibilityLabel: '기록 저장'});
    await ReactTestRenderer.act(async () => {
      await saveButton.props.onPress();
    });

    expect(
      renderer!.root.findByProps({accessibilityLabel: '빠른 기록'}).props.value,
    ).toBe('지우면 안 되는 내용');
    expect(
      renderer!.root.findByProps({accessibilityRole: 'alert'}).props.children,
    ).toContain('입력한 내용은 그대로 두었습니다');
  });

  it('does not erase text typed while an earlier save is still running', async () => {
    let resolveCreate: (() => void) | undefined;
    const create = jest.fn().mockImplementation(
      () => new Promise<void>(resolve => { resolveCreate = resolve; }),
    );
    const repository: CaptureRepository = {
      create: create as CaptureRepository['create'],
      getRecent: jest.fn().mockResolvedValue([]),
    };

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen repository={repository} />);
      await Promise.resolve();
    });

    let input = renderer!.root.findByProps({accessibilityLabel: '빠른 기록'});
    await ReactTestRenderer.act(async () => {
      input.props.onChangeText('먼저 저장할 내용');
    });

    const saveButton = renderer!.root.findByProps({accessibilityLabel: '기록 저장'});
    let savePromise: Promise<void> | undefined;
    await ReactTestRenderer.act(async () => {
      savePromise = saveButton.props.onPress();
      await Promise.resolve();
    });

    input = renderer!.root.findByProps({accessibilityLabel: '빠른 기록'});
    await ReactTestRenderer.act(async () => {
      input.props.onChangeText('저장 중 새로 적은 내용');
    });

    await ReactTestRenderer.act(async () => {
      resolveCreate?.();
      await savePromise;
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({content: '먼저 저장할 내용'});
    expect(
      renderer!.root.findByProps({accessibilityLabel: '빠른 기록'}).props.value,
    ).toBe('저장 중 새로 적은 내용');
  });

  it('blocks duplicate save calls before React state has re-rendered', async () => {
    let resolveCreate: (() => void) | undefined;
    const create = jest.fn().mockImplementation(
      () => new Promise<void>(resolve => { resolveCreate = resolve; }),
    );
    const repository: CaptureRepository = {
      create: create as CaptureRepository['create'],
      getRecent: jest.fn().mockResolvedValue([]),
    };

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen repository={repository} />);
      await Promise.resolve();
    });

    const input = renderer!.root.findByProps({accessibilityLabel: '빠른 기록'});
    await ReactTestRenderer.act(async () => {
      input.props.onChangeText('한 번만 저장');
    });

    const saveButton = renderer!.root.findByProps({accessibilityLabel: '기록 저장'});
    let first: Promise<void> | undefined;
    let second: Promise<void> | undefined;
    await ReactTestRenderer.act(async () => {
      first = saveButton.props.onPress();
      second = saveButton.props.onPress();
      await Promise.resolve();
    });

    expect(create).toHaveBeenCalledTimes(1);

    await ReactTestRenderer.act(async () => {
      resolveCreate?.();
      await Promise.all([first, second]);
    });
  });
});
