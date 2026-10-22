/**
 * `drm_login` user administration.
 *
 * The legacy app created logins inline from the employee form
 * (`User.php: makeLogin`). This service keeps users separate so an
 * administrator can activate or deactivate a login without touching the
 * employee record.
 */

import { err, ok, type UsersApi } from '../contracts';
import { newId, store, timestamp } from '../store';
import { ROLES, type AppUser } from '../../types';
import { log } from './audit';

export const usersService: UsersApi = {
  async list() {
    return [...store.getState().users].sort((a, b) =>
      a.userName.localeCompare(b.userName, 'en-IN'),
    );
  },

  async create(input) {
    const userName = input.userName.trim().toLowerCase();
    if (!userName) return err('User name is required.', 'userName');
    if (!/^[a-z0-9._-]{3,32}$/.test(userName)) {
      return err('Use 3–32 characters: letters, digits, dot, dash or underscore.', 'userName');
    }
    if (store.getState().users.some((user) => user.userName.toLowerCase() === userName)) {
      return err(`${userName} already has a login.`, 'userName');
    }
    if (!input.displayName.trim()) return err('Display name is required.', 'displayName');
    if (input.password.length < 8) {
      return err('Password must be at least 8 characters.', 'password');
    }

    // The password is write-only and is deliberately not spread into the record:
    // an explicit field list is the only way to guarantee it cannot reach the
    // stored snapshot or the audit trail.
    const user: AppUser = {
      id: newId('user'),
      userName,
      displayName: input.displayName.trim(),
      role: input.role,
      employeeCode: input.employeeCode,
      active: input.active ?? true,
      lastLoginAt: timestamp(),
    };

    store.update((draft) => {
      draft.users.push(user);
      log(draft, {
        action: 'Create',
        entity: 'AppUser',
        entityId: user.id,
        before: '—',
        after: `${user.userName} · ${user.role}`,
        summary: `Login created for ${user.displayName}`,
      });
    });
    return ok(user);
  },

  async update(id, input) {
    const current = store.getState().users.find((user) => user.id === id);
    if (!current) return err('User not found.', 'id');
    if (input.userName && input.userName.trim().toLowerCase() !== current.userName) {
      const clash = store
        .getState()
        .users.some(
          (user) =>
            user.id !== id && user.userName.toLowerCase() === input.userName!.trim().toLowerCase(),
        );
      if (clash)
        return err(`${input.userName.trim().toLowerCase()} already has a login.`, 'userName');
    }
    if (input.active === false && current.role === 'Admin') {
      const otherAdmins = store
        .getState()
        .users.filter((user) => user.role === 'Admin' && user.active && user.id !== id);
      if (otherAdmins.length === 0) {
        return err('Keep at least one active administrator.', 'active');
      }
    }

    const updated: AppUser = { ...current, ...input };
    store.update((draft) => {
      const index = draft.users.findIndex((user) => user.id === id);
      if (index < 0) return;
      draft.users[index] = updated;
      log(draft, {
        action: 'Update',
        entity: 'AppUser',
        entityId: id,
        before: `${current.userName} · ${current.role} · active=${current.active}`,
        after: `${updated.userName} · ${updated.role} · active=${updated.active}`,
        summary: `Login updated for ${updated.displayName}`,
      });
    });
    return ok(updated);
  },

  async remove(id) {
    const current = store.getState().users.find((user) => user.id === id);
    if (!current) return err('User not found.', 'id');
    const state = store.getState();
    if (
      current.role === 'Admin' &&
      state.users.filter((user) => user.role === 'Admin' && user.active).length <= 1
    ) {
      return err('Keep at least one administrator.', 'id');
    }
    store.update((draft) => {
      draft.users = draft.users.filter((user) => user.id !== id);
      log(draft, {
        action: 'Delete',
        entity: 'AppUser',
        entityId: id,
        before: `${current.userName} · ${current.role}`,
        after: 'deleted',
        summary: `Login removed for ${current.displayName}`,
      });
    });
    return ok(true);
  },

  async roles() {
    return [...ROLES];
  },
};
