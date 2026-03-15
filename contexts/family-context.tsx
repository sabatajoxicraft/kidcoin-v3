import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useAuth } from '@/hooks/use-auth';
import type { Family, FamilyMember, FamilyMemberRole, FamilySettings, UserProfile, ChildProfile, AgeGroup } from '@/src/types';
import {
  createFamily as createFamilyService,
  addChild as addChildService,
  getFamilyWithChildren,
  getUserProfile,
  subscribeFamilyMember,
  subscribeFamilyWithChildren,
  subscribeUserProfile,
  updateChildWeeklyAllowance as updateChildWeeklyAllowanceService,
  updateFamilySettings as updateFamilySettingsService,
} from '@/lib/family-service';
import {
  saveChildModeSession,
  loadChildModeSession,
  clearChildModeSession,
} from '@/lib/child-mode-session';

interface FamilyContextType {
  family: Family | null;
  userProfile: UserProfile | null;
  /** Membership record from families/{familyId}/members/{userId}, or null if not yet loaded / absent. */
  familyMember: FamilyMember | null;
  children: ChildProfile[];
  activeChildId: string | null;
  activeChild: ChildProfile | null;
  /** Base role resolved from membership record, falling back to legacy userProfile.role. */
  baseRole: 'parent' | 'child';
  effectiveRole: 'parent' | 'child';
  effectiveUserProfile: UserProfile | ChildProfile | null;
  hasFamily: boolean;
  loading: boolean;
  error: string | null;
  createFamily: (familyName: string, currencyCode?: string) => Promise<void>;
  addChild: (displayName: string, ageGroup: AgeGroup, pin: string) => Promise<void>;
  refreshFamily: () => Promise<void>;
  enterChildMode: (childId: string, pin: string) => Promise<void>;
  exitChildMode: () => Promise<void>;
  updateChildWeeklyAllowance: (childId: string, weeklyAllowancePoints: number) => Promise<void>;
  updateFamilySettings: (settings: Partial<FamilySettings>) => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

/** Map a membership role to the legacy app-level role used in routing and gates. */
function memberRoleToAppRole(memberRole: FamilyMemberRole): 'parent' | 'child' {
  return memberRole === 'child' ? 'child' : 'parent';
}

export function FamilyProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Stays true until the one-time child-mode restore attempt has completed,
  // preventing _layout.tsx from routing before we know whether to land in child mode.
  const [isRestoringChildMode, setIsRestoringChildMode] = useState(true);
  const [familyMember, setFamilyMember] = useState<FamilyMember | null>(null);
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

  // Subscribe to the signed-in user's own membership record so we can resolve
  // their base family role from the members sub-collection.
  useEffect(() => {
    if (!user || !userProfile?.familyId) {
      setFamilyMember(null);
      return;
    }
    let active = true;
    const unsubscribe = subscribeFamilyMember(
      userProfile.familyId,
      user.uid,
      (member) => {
        if (!active) return;
        setFamilyMember(member);
      },
      (err) => {
        if (!active) return;
        // Non-fatal: we fall back to userProfile.role when no member record exists.
        console.warn('[FamilyContext] member record listener error:', err);
        setFamilyMember(null);
      },
    );
    return () => { active = false; unsubscribe(); };
  }, [user, userProfile?.familyId]);

  // Reset activeChildId whenever the family or authenticated user changes so
  // stale child-mode sessions cannot persist across identity switches.
  // Re-arm isRestoringChildMode so the restore effect can run for the new identity.
  useEffect(() => {
    setActiveChildId(null);
    setIsRestoringChildMode(true);
  }, [family?.id, user?.uid, userProfile?.id, userProfile?.familyId, userProfile?.role]);

  // Guard: if the active child is removed from the family, exit child mode and
  // clear the persisted session so the stale child cannot be restored on next launch.
  useEffect(() => {
    if (activeChildId && !children.some((child) => child.id === activeChildId)) {
      setActiveChildId(null);
      clearChildModeSession().catch(console.error);
    }
  }, [activeChildId, children]);

  // Restore child mode from AsyncStorage on cold start.
  // Runs once per identity: after auth initialization and family + children data
  // are loaded, validates the persisted session against the current user/family
  // before restoring.  Keeps isRestoringChildMode true until the attempt
  // completes so that _layout.tsx (which gates on `loading`) cannot route
  // before restoration.
  //
  // The `initializing` guard is critical: during auth startup, user=null even
  // though auth has not yet rehydrated.  Without this guard the no-user branch
  // would clear (or prematurely dismiss) the persisted session before we know
  // whether a signed-in user exists.
  useEffect(() => {
    if (!isRestoringChildMode || loading || initializing) return;

    let cancelled = false;
    (async () => {
      try {
        if (!user || !userProfile?.familyId) {
          // Auth has fully resolved but there is no user or no family — any
          // persisted session is now invalid; clear it.
          await clearChildModeSession();
        } else {
          const session = await loadChildModeSession();
          if (cancelled) return;
          if (
            session &&
            session.parentUid === user.uid &&
            session.familyId === userProfile.familyId &&
            children.some((c) => c.id === session.childId)
          ) {
            setActiveChildId(session.childId);
          } else if (session) {
            // Session is stale (identity mismatch or child removed) — discard it.
            await clearChildModeSession();
          }
        }
      } catch (e) {
        console.error('[FamilyContext] child mode restore failed:', e);
      } finally {
        if (!cancelled) setIsRestoringChildMode(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isRestoringChildMode, loading, initializing, user, userProfile?.familyId, children]);

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

  const createFamily = async (familyName: string, currencyCode?: string) => {
    if (!user) throw new Error('No user');
    const f = await createFamilyService(user.uid, user.email ?? '', user.displayName ?? '', familyName, currencyCode);
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
    if (!user || !userProfile?.familyId || baseRole !== 'parent') {
      throw new Error('Only parents can enter child mode');
    }

    const child = children.find((candidate) => candidate.id === childId);
    if (!child) throw new Error('Child not found');
    if (child.familyId !== userProfile.familyId) {
      throw new Error('Child does not belong to this family');
    }

    const pinHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
    if (pinHash !== child.pinHash) throw new Error('Invalid PIN');

    // Persist first — only switch UI into child mode if storage succeeds.
    await saveChildModeSession({
      parentUid: user.uid,
      familyId: userProfile.familyId,
      childId: child.id,
    });
    setActiveChildId(child.id);
  };

  const exitChildMode = async () => {
    // Clear storage first — only update UI state once the clear has succeeded
    // so a failed clear cannot leave a stale session that restores on next launch.
    await clearChildModeSession();
    setActiveChildId(null);
  };

  const updateChildWeeklyAllowance = async (childId: string, weeklyAllowancePoints: number) => {
    if (!userProfile?.familyId) throw new Error('No family');
    if (baseRole !== 'parent' || activeChildId !== null) {
      throw new Error('Only parents can update weekly allowance');
    }
    await updateChildWeeklyAllowanceService(userProfile.familyId, childId, weeklyAllowancePoints);
  };

  const updateFamilySettings = async (settings: Partial<FamilySettings>) => {
    if (!family?.id) throw new Error('No family');
    if (baseRole !== 'parent' || activeChildId !== null) {
      throw new Error('Only parents can update family settings');
    }
    await updateFamilySettingsService(family.id, settings);
    // State updates automatically via the subscribeFamilyWithChildren listener
  };

  const hasFamily = userProfile?.familyId != null;
  const activeChild = useMemo(
    () => children.find((child) => child.id === activeChildId) ?? null,
    [activeChildId, children],
  );
  // Resolve base role: membership record first, legacy profile fallback.
  const baseRole: 'parent' | 'child' = familyMember
    ? memberRoleToAppRole(familyMember.role)
    : (userProfile?.role ?? 'parent');
  const effectiveRole: 'parent' | 'child' = activeChild ? 'child' : baseRole;
  const effectiveUserProfile = activeChild ?? userProfile ?? null;

  return (
    <FamilyContext.Provider
      value={{
        family,
        userProfile,
        familyMember,
        children,
        activeChildId,
        activeChild,
        baseRole,
        effectiveRole,
        effectiveUserProfile,
        hasFamily,
        loading: initializing || loading || isRestoringChildMode,
        error,
        createFamily,
        addChild,
        refreshFamily,
        enterChildMode,
        exitChildMode,
        updateChildWeeklyAllowance,
        updateFamilySettings,
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

/** Convenience hook to access just the membership record from FamilyContext. */
export function useFamilyMember() {
  const { familyMember } = useFamily();
  return familyMember;
}
