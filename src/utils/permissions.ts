import { UserRole } from '../types';

/**
 * Role-based permission helpers.
 *
 * Access rules:
 *  - owner : full access (including delete & settings)
 *  - admin : no settings, no direct delete (must request owner approval)
 *  - mechanic : no delete, no settings
 *  - cashier : no delete, no settings
 *  - user : customer portal, limited access
 */

/** Can this role access the Settings tab? Only owner. */
export function canAccessSettings(role: UserRole): boolean {
  return role === 'owner';
}

/**
 * Can this role delete records directly (without approval)?
 * Only owner.  Admin may *request* a deletion, but cannot execute it alone.
 */
export function canDeleteDirectly(role: UserRole): boolean {
  return role === 'owner';
}

export const canDirectDelete = canDeleteDirectly;

/**
 * Does this role need owner approval before a deletion is executed?
 * True for admin; mechanic / cashier / user cannot delete at all.
 */
export function needsDeletionApproval(role: UserRole): boolean {
  return role === 'admin';
}

/** Whether the role is allowed to trigger any kind of delete (direct or request). */
export function canTriggerDelete(role: UserRole): boolean {
  return canDeleteDirectly(role) || needsDeletionApproval(role);
}
