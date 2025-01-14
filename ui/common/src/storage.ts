import { defined } from './common';

export interface StoredProp<T> {
  (): string;
  (v: T): void;
}

export interface StoredBooleanProp {
  (): boolean;
  (v: boolean): void;
}

const storage = lichess.storage;

export function storedProp(k: string, defaultValue: boolean): StoredBooleanProp;
export function storedProp<T>(k: string, defaultValue: T): StoredProp<T>;
export function storedProp(k: string, defaultValue: any) {
  const sk = 'analyse.' + k,
    isBoolean = defaultValue === true || defaultValue === false;
  let value: any;
  return function (v: any) {
    if (defined(v) && v != value) {
      value = v + '';
      storage.set(sk, v);
    } else if (!defined(value)) {
      value = storage.get(sk);
      if (value === null) value = defaultValue + '';
    }
    return isBoolean ? value === 'true' : value;
  };
}

export interface StoredJsonProp<T> {
  (): T;
  (v: T): T;
}

export const storedJsonProp =
  <T>(key: string, defaultValue: () => T): StoredJsonProp<T> =>
  (v?: T) => {
    if (defined(v)) {
      storage.set(key, JSON.stringify(v));
      return v;
    }
    const ret = JSON.parse(storage.get(key)!);
    return ret !== null ? ret : defaultValue();
  };

export interface StoredMap<T> {
  (key: string): T;
  (key: string, value: T): void;
}

export const storedMap = <T>(propKey: string, maxSize: number, defaultValue: () => T): StoredMap<T> => {
  const prop = storedJsonProp<[string, T][]>(propKey, () => []);
  const map = new Map<string, T>(prop());
  return (key: string, v?: T) => {
    if (defined(v)) {
      map.delete(key); // update insertion order as old entries are culled
      map.set(key, v);
      prop(Array.from(map.entries()).slice(-maxSize));
    }
    const ret = map.get(key);
    return defined(ret) ? ret : defaultValue();
  };
};
