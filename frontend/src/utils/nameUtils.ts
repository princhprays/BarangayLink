/**
 * Utility functions for consistent name handling across the application
 */

/**
 * Formats a user's full name consistently
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param fallback - Fallback text if both names are empty
 * @returns Formatted full name
 */
export const formatFullName = (
  firstName?: string | null, 
  lastName?: string | null, 
  fallback: string = 'User'
): string => {
  const first = firstName?.trim() || ''
  const last = lastName?.trim() || ''
  const fullName = `${first} ${last}`.trim()
  return fullName || fallback
}

/**
 * Formats a user's full name from a profile object
 * @param profile - Profile object with first_name and last_name
 * @param fallback - Fallback text if names are empty
 * @returns Formatted full name
 */
export const formatProfileName = (
  profile?: { first_name?: string | null; last_name?: string | null } | null,
  fallback: string = 'User'
): string => {
  if (!profile) return fallback
  return formatFullName(profile.first_name, profile.last_name, fallback)
}

/**
 * Formats a user's full name from user object
 * @param user - User object with first_name and last_name
 * @param fallback - Fallback text if names are empty
 * @returns Formatted full name
 */
export const formatUserName = (
  user?: { first_name?: string | null; last_name?: string | null } | null,
  fallback: string = 'User'
): string => {
  if (!user) return fallback
  return formatFullName(user.first_name, user.last_name, fallback)
}
