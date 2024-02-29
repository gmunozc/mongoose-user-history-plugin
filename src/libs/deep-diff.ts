/**
 * Type definition for objects that can be compared.
 */
type ComparableObject = Record<string, any>;
type DiffOptions = {
  currentDocument: ComparableObject;
  oldDocument: ComparableObject;
  omitPaths?: string[];
  keepNewKeys?: boolean;
};
/**
 * Calculates the deep difference between two objects.
 *
 * @param currentDocument - The first object to compare.
 * @param oldDocument - The second object to compare.
 * @param keepNewKeys - Optional. Specifies whether to keep new keys found in oldDocument. Default is false.
 * @returns The deep difference between currentDocument and oldDocument, or null if there is no difference.
 * @throws {TypeError} If either currentDocument or oldDocument is not an object.
 */
function deepDiff({
  currentDocument,
  oldDocument,
  omitPaths = [],
  keepNewKeys = false,
}: DiffOptions): ComparableObject | null {
  // Check if currentDocument is an object
  if (typeof currentDocument !== 'object') {
    throw new TypeError('First parameter must be an object');
  }

  // Check if oldDocument is an object
  if (typeof oldDocument !== 'object') {
    throw new TypeError('Second parameter must be an object');
  }

  // Initialize the diff object
  const diff: ComparableObject = {};

  // Iterate over the keys of oldDocument
  Object.keys({ ...currentDocument, ...oldDocument }).forEach((key) => {
    // Skip the keys that are not relevant
    if (['_id', 'updatedAt', 'createdAt', ...omitPaths].includes(key)) {
      return;
    }

    const newValue = currentDocument[key] ?? null;
    const oldValue = oldDocument[key] ?? null;

    const areObjects = (val: any) => typeof val === 'object' && val !== null;

    // Handle cases where one or both values are null or undefined
    if (newValue === oldValue) return;

    if (!currentDocument.hasOwnProperty(key) && keepNewKeys) {
      if (keepNewKeys) {
        diff[key] = { new: newValue, old: oldValue };
      }
      return;
    }

    if (areObjects(newValue) && areObjects(oldValue)) {
      if (Array.isArray(newValue) && Array.isArray(oldValue)) {
        if (!arrayEquals(newValue, oldValue)) diff[key] = { new: newValue, old: oldValue };
      } else if (newValue instanceof Date && oldValue instanceof Date) {
        if (newValue.getTime() !== oldValue.getTime()) diff[key] = { new: newValue, old: oldValue };
      } else {
        const deeperDiff = deepDiff({
          currentDocument: newValue,
          oldDocument: oldValue,
          keepNewKeys,
        });
        if (deeperDiff) diff[key] = deeperDiff;
      }
    } else if (newValue !== oldValue) {
      diff[key] = { new: newValue, old: oldValue };
    }
  });

  return Object.keys(diff).length > 0 ? diff : null;
}

/**
 * Checks if two arrays are equal.
 *
 * @param arr1 - The first array to compare.
 * @param arr2 - The second array to compare.
 * @returns True if the arrays are equal, false otherwise.
 * @throws {TypeError} If either arr1 or arr2 is not an array.
 */
function arrayEquals(arr1: any[], arr2: any[]): boolean {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
    throw new TypeError('Both parameters must be arrays');
  }

  if (arr1.length !== arr2.length) return false;

  return arr1.every((item, index) => {
    const item2 = arr2[index];
    if (Array.isArray(item) && Array.isArray(item2)) {
      return arrayEquals(item, item2);
    } else if (typeof item === 'object' && typeof item2 === 'object') {
      return deepDiff({ currentDocument: item, oldDocument: item2, keepNewKeys: true }) === null;
    }
    return item === item2;
  });
}

export { deepDiff, arrayEquals };
export default deepDiff;
