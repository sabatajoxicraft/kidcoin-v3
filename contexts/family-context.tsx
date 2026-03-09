import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useAuth } from '@/hooks/use-auth';
import type { Family, UserProfile, ChildProfile, AgeGroup } from '@/src/types';
import {
  createFamily as createFamilyService,
  addChild as addChildService,
  getFamilyWithChildren,
  getUserProfile,
  subscribeFamilyWithChildren,
  subscribeUserProfile,
} from '@/lib/family-service';

interface FamilyContextType {
  family: Family | null;
  userProfile: UserProfile | null;
  children: ChildProfile[];
  activeChildId: string | null;
  activeChild: ChildProfile | null;
  effectiveRole: 'parent' | 'child';
  effectiveUserProfile: UserProfile | ChildProfile | null;
  hasFamily: boolean;
  loading: boolean;
  error: string | null;
  createFamily: (familyName: string) => Promise<void>;
  addChild: (displayName: string, ageGroup: AgeGroup, pin: string) => Promise<void>;
  refreshFamily: () => Promise<void>;
  enterChildMode: (childId: string, pin: string) => Promise<void>;
  exitChildMode: () => void;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to the authenticated user's own profile.
  // When the profile has no familyId yet, we are done loading; otherwise we
  // wait for the family+children subscriber below to fire first.
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setFamily(null);
      setChildren([]);
      setActiveChildId(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let active = true;
    const unsubscribe = subscribeUserProfile(
      user.uid,
      (profile) => {
        if (!active) return;
        setUserProfile(profile);
        if (!profile?.familyId) {
          // New user with no family yet – nothing more to load
          setLoading(false);
        }
        // If familyId is present, loading stays true until the family+children
        // listener below fires for the first time.
      },
      (err) => {
        if (!active) return;
        console.error('[FamilyContext] user profile listener error:', err);
        setError(err.message);
        setLoading(false);
      },
    );
    return () => { active = false; unsubscribe(); };
  }, [user]); // Firebase auth user object is stable within a session

  // Subscribe to family document and children collection once familyId is known.
  // Re-subscribes automatically if the user's familyId changes.
  useEffect(() => {
    if (!userProfile?.familyId) {
      setFamily(null);
      setChildren([]);
      return;
    }
    setLoading(true);
    let active = true;
    const unsubscribe = subscribeFamilyWithChildren(
      userProfile.familyId,
      ({ family: f, children: c }) => {
        if (!active) return;
        setFamily(f);
        setChildren(c);
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        console.error('[FamilyContext] family listener error:', err);
        setError(err.message);
        setLoading(false);
      },
    );
    return () => { active = false; unsubscribe(); };
  }, [userProfile?.familyId]);

  // Reset activeChildId whenever the family or authenticated user changes so
  // stale child-mode sessions cannot persist across identity switches.
  useEffect(() => {
    setActiveChildId(null);
  }, [family?.id, user?.uid, userProfile?.id, userProfile?.familyId, userProfile?.role]);

  // Guard: if the active child is removed from the family, exit child mode.
  useEffect(() => {
    if (activeChildId && !children.some((child) => child.id === activeChildId)) {
      setActiveChildId(null);
    }
  }, [activeChildId, children]);

  // Explicit pull-to-refresh: one-time fetch for reassurance.
  // Listeners keep data fresh automatically; this is only needed when the
  // user explicitly requests a refresh gesture.
  const refreshFamily = async () => {
    if (!userProfile?.familyId) return;
    try {
      const { family: f, children: c } = await getFamilyWithChildren(userProfile.familyId);
      setFamily(f);
      setChildren(c);
    } catch (e) {
      console.error('[FamilyContext] refreshFamily failed:', e);
    }
  };

  const createFamily = async (familyName: string) => {
    if (!user) throw new Error('No user');
    const f = await createFamilyService(user.uid, user.email ?? '', user.displayName ?? '', familyName);
    // Eagerly update local state; the profile listener will also fire shortly.
    const profile = await getUserProfile(user.uid);
    setUserProfile(profile);
    setFamily(f);
    setChildren([]);
  };

  const addChild = async (displayName: string, ageGroup: AgeGroup, pin: string) => {
    if (!userProfile?.familyId) throw new Error('No family');
    await addChildService(userProfile.familyId, displayName, ageGroup, pin);
    await refreshFamily();
  };

  const enterChildMode = async (childId: string, pin: string) => {
    if (!userProfile?.familyId || userProfile.role !== 'parent') {
      throw new Error('Only parents can enter child mode');
    }

    const child = children.find((candidate) => candidate.id === childId);
    if (!child) throw new Error('Child not found');
    if (child.familyId !== userProfile.familyId) {
      throw new Error('Child does not belong to this family');
    }

    const pinHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
    if (pinHash !== child.pinHash) throw new Error('Invalid PIN');

    setActiveChildId(child.id);
  };

  const exitChildMode = () => {
    setActiveChildId(null);
  };

  const hasFamily = userProfile?.familyId != null;
  const activeChild = useMemo(
    () => children.find((child) => child.id === activeChildId) ?? null,
    [activeChildId, children],
  );
  const effectiveRole: 'parent' | 'child' = activeChild ? 'child' : (userProfile?.role ?? 'parent');
  const effectiveUserProfile = activeChild ?? userProfile ?? null;

  return (
    <FamilyContext.Provider
      value={{
        family,
        userProfile,
        children,
        activeChildId,
        activeChild,
        effectiveRole,
        effectiveUserProfile,
        hasFamily,
        loading,
        error,
        createFamily,
        addChild,
        refreshFamily,
        enterChildMode,
        exitChildMode,
      }}
    >
      {reactChildren}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
