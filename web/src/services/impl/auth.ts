/**
 * `drm_login` + `login_history` + OTP/PIN/recovery flows.
 *
 * The legacy app stored MD5 password hashes in `drm_login.password` and ran
 * OTP/PIN recovery through `User.php: forgotpassword/enterotp/otpsubmit/
 * recoverpassword` and `Employee_reports: match_otp/match_pin`. This module
 * reproduces those *flows* with a fixed demo credential — there is no real
 * secret here, and `docs/SECURITY.md` requires the .NET 10 API to replace it.
 */

import { err, ok, type AuthApi } from '../contracts';
import { newId, store, timestamp } from '../store';
import type { AppUser } from '../../types';
import { appendLoginHistory, clientIp, log } from './audit';
import { session } from './session';

const DEMO_PASSWORD = 'demo1234';
const OTP_TTL_MINUTES = 5;

interface Challenge {
  id: string;
  userName: string;
  otp: string;
  expiresAt: string;
}

const challenges = new Map<string, Challenge>();
const otpByUser = new Map<string, Challenge>();

function findUser(userName: string): AppUser | undefined {
  const needle = userName.trim().toLowerCase();
  return store.getState().users.find((user) => user.userName.toLowerCase() === needle);
}

function issueOtp(user: AppUser): Challenge {
  const challenge: Challenge = {
    id: newId('otp'),
    userName: user.userName,
    // Demo only: the UI shows this so the mock flow can be completed.
    otp: String(100000 + Math.floor(Math.random() * 900000)),
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString(),
  };
  challenges.set(challenge.id, challenge);
  otpByUser.set(challenge.userName.toLowerCase(), challenge);
  return challenge;
}

function recordAttempt(
  userName: string,
  outcome: 'Success' | 'Failed',
  channel: 'Web' | 'Mobile',
  detail: string,
  userAgent: string,
) {
  const user = findUser(userName);
  store.update((draft) => {
    appendLoginHistory(draft, {
      userName: user?.userName ?? (userName.trim() || 'unknown'),
      role: user?.role ?? 'Employee',
      channel,
      ip: clientIp(),
      userAgent,
      loginAt: timestamp(),
      logoutAt: null,
      outcome,
      detail,
    });
    log(draft, {
      action: 'Login',
      entity: 'Session',
      entityId: user?.id ?? userName,
      before: 'session=anonymous',
      after: outcome === 'Success' ? 'session=active' : 'session=rejected',
      summary:
        outcome === 'Success'
          ? `${channel} login accepted for ${user?.userName ?? userName}`
          : `${channel} login rejected for ${userName || 'blank user name'}`,
    });
  });
}

function browserAgent(): string {
  if (typeof navigator === 'undefined') return 'unknown client';
  return navigator.userAgent.slice(0, 80);
}

function completeSignIn(user: AppUser): AppUser {
  const updated: AppUser = { ...user, lastLoginAt: timestamp() };
  store.update((draft) => {
    const index = draft.users.findIndex((row) => row.id === user.id);
    if (index >= 0) draft.users[index] = updated;
  });
  session.set(updated);
  return updated;
}

export const authService: AuthApi = {
  demoPassword: DEMO_PASSWORD,

  async signIn(userName, password) {
    const user = findUser(userName);
    if (!user) {
      recordAttempt(userName, 'Failed', 'Web', 'Unknown user name', browserAgent());
      return err('That user name is not registered.', 'userName');
    }
    if (!user.active) {
      recordAttempt(userName, 'Failed', 'Web', 'Account deactivated', browserAgent());
      return err('This account is deactivated. Ask an administrator to re-enable it.', 'userName');
    }
    if (password !== DEMO_PASSWORD) {
      recordAttempt(userName, 'Failed', 'Web', 'Password mismatch', browserAgent());
      return err('Incorrect password.', 'password');
    }
    recordAttempt(userName, 'Success', 'Web', 'Web login accepted', browserAgent());
    return ok(completeSignIn(user));
  },

  async requestOtp(userName) {
    const user = findUser(userName);
    if (!user)
      return err('Unknown user name. Mobile login needs a registered account.', 'userName');
    if (!user.active) return err('This account is deactivated.', 'userName');
    const challenge = issueOtp(user);
    return ok({ id: challenge.id, otp: challenge.otp, expiresAt: challenge.expiresAt });
  },

  async signInWithOtp(userName, otp) {
    const user = findUser(userName);
    if (!user) return err('Unknown user name.', 'userName');
    const challenge = otpByUser.get(user.userName.toLowerCase());
    if (!challenge) return err('Request a one-time password first.', 'otp');
    if (new Date(challenge.expiresAt).getTime() < Date.now()) {
      return err('That one-time password expired. Request a new one.', 'otp');
    }
    if (challenge.otp !== otp.trim()) {
      recordAttempt(userName, 'Failed', 'Mobile', 'OTP mismatch', browserAgent());
      return err('Incorrect one-time password.', 'otp');
    }
    challenges.delete(challenge.id);
    otpByUser.delete(user.userName.toLowerCase());
    recordAttempt(userName, 'Success', 'Mobile', 'Mobile OTP login accepted', browserAgent());
    return ok(completeSignIn(user));
  },

  async signInWithPin(userName, pin) {
    const user = findUser(userName);
    if (!user) return err('Unknown user name.', 'userName');
    // Legacy `match_pin` compared a 4-digit employee PIN. Demo value below.
    if (pin.trim() !== '1234') {
      recordAttempt(userName, 'Failed', 'Mobile', 'PIN mismatch', browserAgent());
      return err('Incorrect PIN.', 'pin');
    }
    recordAttempt(userName, 'Success', 'Mobile', 'Mobile PIN login accepted', browserAgent());
    return ok(completeSignIn(user));
  },

  async requestRecovery(userName) {
    const user = findUser(userName);
    if (!user) return err('Unknown user name.', 'userName');
    const challenge = issueOtp(user);
    return ok({ otp: challenge.otp });
  },

  async recoverPassword(userName, otp, password) {
    const user = findUser(userName);
    if (!user) return err('Unknown user name.', 'userName');
    const challenge = otpByUser.get(user.userName.toLowerCase());
    if (!challenge || challenge.otp !== otp.trim()) {
      return err('Recovery code does not match. Request a new one.', 'otp');
    }
    if (password.length < 8) {
      return err('Use at least 8 characters for the new password.', 'password');
    }
    otpByUser.delete(user.userName.toLowerCase());
    store.update((draft) => {
      log(draft, {
        action: 'Update',
        entity: 'AppUser',
        entityId: user.id,
        before: 'password=<redacted>',
        after: 'password=<rotated>',
        summary: `Password reset completed for ${user.userName}`,
      });
      appendLoginHistory(draft, {
        userName: user.userName,
        role: user.role,
        channel: 'Web',
        ip: clientIp(),
        userAgent: browserAgent(),
        loginAt: timestamp(),
        logoutAt: null,
        outcome: 'Success',
        detail: 'Password reset with recovery code',
      });
    });
    return ok(user);
  },

  async signOut() {
    const user = session.get();
    if (!user) return;

    // Cleared before the audit write, so the route guard redirects without
    // waiting for anything. The actor is captured above because the write needs
    // to know who is leaving.
    session.set(null);

    store.update((draft) => {
      const entry = draft.loginHistory.find(
        (row) =>
          row.userName === user.userName && row.logoutAt === null && row.outcome === 'Success',
      );
      if (entry) entry.logoutAt = timestamp();
      log(draft, {
        action: 'Logout',
        entity: 'Session',
        entityId: user.id,
        before: 'session=active',
        after: 'session=closed',
        summary: `${user.userName} signed out`,
      });
    });
  },

  currentUser: () => session.get(),
  setCurrentUser: (user) => session.set(user),
};
