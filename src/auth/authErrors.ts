export function mapAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email sign-up is not available right now. Please use Continue with Google, or try again later.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/missing-password':
      return 'Please enter your password.';
    case 'auth/weak-password':
      return 'Use at least 8 characters with at least one letter and one number.';
    case 'auth/email-already-in-use':
      return 'An account already exists for this email. Log in instead, or use Continue with Google if you signed up with Google.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect. If you signed up with Google, use Continue with Google.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'You appear to be offline. Check your connection and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.';
    case 'auth/unauthorized-domain':
      return 'Google sign-in is not enabled for this web address yet.';
    case 'auth/account-exists-with-different-credential':
      return 'This email is linked to a different sign-in method. Try the other option.';
    case 'auth/requires-recent-login':
      return 'For security, please enter your current password again.';
    default:
      if (code) {
        console.warn('Unhandled Firebase auth error code:', code);
      }
      return 'Something went wrong. Please try again.';
  }
}

export function mapAuthErrorField(error: unknown): 'email' | 'password' | null {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-email':
    case 'auth/email-already-in-use':
      return 'email';
    case 'auth/missing-password':
    case 'auth/weak-password':
    case 'auth/wrong-password':
      return 'password';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
      // Can be either email or password, usually shown on password or both
      return 'password';
    default:
      return null;
  }
}
