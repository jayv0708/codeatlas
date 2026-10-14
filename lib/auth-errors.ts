/**
 * Auth.js appends `?error=<code>` to the sign-in page on failure.
 * Map codes to clean, actionable messages. Never surface stack traces or
 * internal details (e.g. environment variable names) to users.
 */
const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already associated with a different sign-in method. Please sign in with the original provider.",
  OAuthSignin: "GitHub sign-in could not be started. Please try again.",
  OAuthCallback: "GitHub sign-in could not be completed. Please try again.",
  OAuthCreateAccount: "We could not create your account with GitHub. Please try again.",
  EmailCreateAccount: "We could not create your account. Please try again.",
  Callback: "Sign-in could not be completed. Please try again.",
  Configuration:
    "Sign-in is not configured yet. The administrator needs to set up authentication.",
  AccessDenied: "Sign-in was denied. Please try again.",
  Verification: "The sign-in link is invalid or has expired. Please try again.",
  CredentialsSignin: "Invalid email or password. Please try again.",
  Default: "Something went wrong while signing you in. Please try again.",
};

export function getAuthErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.Default;
}
