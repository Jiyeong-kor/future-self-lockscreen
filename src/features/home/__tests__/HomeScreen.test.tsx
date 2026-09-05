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
});
