import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateConversationId } from './schema.ts';

describe('Chat pure conversation logic', () => {
  test('generates identical conversation ID regardless of argument order', () => {
    const id1 = generateConversationId('user-alice', 'user-bob');
    const id2 = generateConversationId('user-bob', 'user-alice');
    assert.equal(id1, id2);
    assert.equal(id1, 'conv_user-alice_user-bob');
  });
});
