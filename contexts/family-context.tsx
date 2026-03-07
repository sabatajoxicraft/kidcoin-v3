import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useAuth } from '@/hooks/use-auth';
import type { Family, UserProfile, ChildProfile, AgeGroup } from '@/src/types';
import {
  createFamily as createFamilyService,
  addChild as addChildService,
  getFamilyWithChildren,
  getUserProfile,
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

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setFamily(null);
      setChildren([]);
      setActiveChildId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getUserProfile(user.uid)
      .then(async (profile) => {
        setUserProfile(profile);
        if (profile?.familyId) {
          const { family: f, children: c } = await getFamilyWithChildren(profile.familyId);
          setFamily(f);
          setChildren(c);
        }
      })
      .catch((e) => console.error('[FamilyContext] load failed:', e))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    setActiveChildId(null);
  }, [family?.id, user?.uid, userProfile?.id, userProfile?.familyId, userProfile?.role]);

  useEffect(() => {
    if (activeChildId && !children.some((child) => child.id === activeChildId)) {
      setActiveChildId(null);
    }
  }, [activeChildId, children]);

  const createFamily = async (familyName: string) => {
    if (!user) throw new Error('No user');
    const f = await createFamilyService(user.uid, user.email ?? '', user.displayName ?? '', familyName);
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
