import { describe, expect, it } from 'vitest';
import { indentNode, outdentNode, removeEmptyNode, splitNode, visibleNodes } from './outline';

const node = (id, depth, text = id, collapsed = false) => ({ id, depth, text, collapsed });

describe('outline operations', () => {
  it('hides all descendants of a collapsed node, keeping later siblings visible', () => {
    expect(visibleNodes([node('a', 0, 'a', true), node('b', 1), node('c', 2), node('d', 0)])
      .map(item => item.id)).toEqual(['a', 'd']);
  });
  it('indents a whole subtree under its previous sibling and reveals it', () => {
    const next = indentNode([node('a', 0, 'a', true), node('b', 0), node('c', 1)], 'b');
    expect(next.map(item => item.depth)).toEqual([0, 1, 2]);
    expect(next[0].collapsed).toBe(false);
  });
  it('does not indent a first child under its own parent', () => {
    const nodes = [node('a', 0), node('b', 1)];
    expect(indentNode(nodes, 'b')).toBe(nodes);
  });
  it('outdents a branch after the parent subtree so trailing siblings are not adopted', () => {
    const next = outdentNode([node('a', 0), node('b', 1), node('c', 2), node('d', 1), node('e', 0)], 'b');
    expect(next.map(item => [item.id, item.depth])).toEqual([['a', 0], ['d', 1], ['b', 0], ['c', 1], ['e', 0]]);
  });
  it('splits at the selection, preserving children on the original branch', () => {
    const next = splitNode([node('a', 0, 'hello world'), node('b', 1)], 'a', 5, 6, 'c');
    expect(next.map(item => [item.id, item.text, item.depth])).toEqual([['a', 'hello', 0], ['b', 'b', 1], ['c', 'world', 0]]);
  });
  it('promotes children when an empty parent is removed, keeping the final node', () => {
    expect(removeEmptyNode([node('a', 0, ''), node('b', 1), node('c', 2)], 'a')
      .map(item => item.depth)).toEqual([0, 1]);
    const last = [node('a', 0, '')];
    expect(removeEmptyNode(last, 'a')).toBe(last);
  });
});
