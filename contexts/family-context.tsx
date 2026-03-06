import React, { createContext, useContext, useEffect, useState } from 'react';
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
  hasFamily: boolean;
  loading: boolean;
  createFamily: (familyName: string) => Promise<void>;
  addChild: (displayName: string, ageGroup: AgeGroup, pin: string) => Promise<void>;
  refreshFamily: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
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

  const hasFamily = userProfile?.familyId != null;

  return (
    <FamilyContext.Provider value={{ family, userProfile, children, hasFamily, loading, createFamily, addChild, refreshFamily }}>
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
