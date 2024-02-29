import deepDiff, { arrayEquals } from '../../../src/libs/deep-diff';

describe('deepDiff', () => {
  test('should return null for identical objects', () => {
    const obj1 = { name: 'John', age: 30 };
    const obj2 = { name: 'John', age: 30 };
    expect(deepDiff({ currentDocument: obj1, oldDocument: obj2 })).toBeNull();
  });

  test('should detect basic differences', () => {
    const current = { name: 'John', age: 30 };
    const old = { name: 'Jane', age: 25 };
    expect(deepDiff({ currentDocument: current, oldDocument: old })).toEqual({
      name: { new: 'John', old: 'Jane' },
      age: { new: 30, old: 25 },
    });
  });

  test('should respect keepNewKeys option', () => {
    const current = { name: 'John', age: 30, location: 'City' };
    const old = { name: 'John', age: 30 };
    expect(deepDiff({ currentDocument: current, oldDocument: old, keepNewKeys: true })).toEqual({
      location: { new: 'City', old: null },
    });
  });

  test('should handle deep differences', () => {
    const current = { person: { name: 'John', age: 30 } };
    const old = { person: { name: 'Jane', age: 25 } };
    expect(deepDiff({ currentDocument: current, oldDocument: old })).toEqual({
      person: { name: { new: 'John', old: 'Jane' }, age: { new: 30, old: 25 } },
    });
  });
});

describe('arrayEquals', () => {
  test('should return true for equal arrays', () => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 3];
    expect(arrayEquals(arr1, arr2)).toBeTruthy();
  });

  test('should return false for different arrays', () => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 4];
    expect(arrayEquals(arr1, arr2)).toBeFalsy();
  });

  test('throws TypeError if inputs are not arrays', () => {
    expect(() => arrayEquals({} as any[], {} as any[])).toThrow(TypeError);
  });
});
