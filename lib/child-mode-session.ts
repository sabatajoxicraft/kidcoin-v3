import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kidcoin/child_mode_session';

export interface ChildModeSession {
  parentUid: string;
  familyId: string;
  childId: string;
}

export async function saveChildModeSession(session: ChildModeSession): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export async function loadChildModeSession(): Promise<ChildModeSession | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ChildModeSession;
  } catch {
    return null;
  }
}

export async function clearChildModeSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
