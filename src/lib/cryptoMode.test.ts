import { describe, it as test } from 'node:test';
import { strict as assert } from 'node:assert';
import { modeHoldings, modeRoute } from './cryptoMode';

describe('global crypto-only mode', () => {
  const holdings = [{ symbol: 'BTC' }, { symbol: 'ETH' }, { symbol: 'AAPL' }, { symbol: 'TAMG', isTamg: true }];
  test('on shows only crypto holdings without deleting saved stocks or TAMG', () => {
    assert.deepEqual(modeHoldings(holdings, true).map(item => item.symbol), ['BTC', 'ETH']);
    assert.equal(holdings.length, 4);
  });
  test('off restores every original holding', () => {
    assert.deepEqual(modeHoldings(holdings, false), holdings);
  });
  test('on redirects direct stock access to crypto', () => {
    assert.equal(modeRoute('/stocks', true), '/crypto');
    assert.equal(modeRoute('/wallet', true), '/wallet');
  });
  test('off restores the stock route', () => {
    assert.equal(modeRoute('/stocks', false), '/stocks');
  });
});