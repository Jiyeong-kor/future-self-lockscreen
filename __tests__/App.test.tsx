/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/repositories', () => ({
  SqlCaptureRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockResolvedValue(undefined),
    getRecent: jest.fn().mockResolvedValue([]),
  })),
}));

import App from '../App';

test('renders the Future Self app shell', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });

  expect(renderer?.toJSON()).not.toBeNull();
});
