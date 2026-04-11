/**
 * Error thrown when authentication is required but not valid.
 * Provides a clear message indicating the need to authenticate.
 */
export class AuthenticationError extends Error {
  constructor(message = 'Authentication required. Please login with: opensoma auth login or opensoma auth extract') {
    super(message)
    this.name = 'AuthenticationError'
  }
}
