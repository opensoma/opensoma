export class AuthenticationError extends Error {
  constructor(message = 'Authentication required. Please login with: opensoma auth login') {
    super(message)
    this.name = 'AuthenticationError'
  }
}
