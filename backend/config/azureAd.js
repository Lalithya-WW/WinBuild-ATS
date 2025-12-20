// Azure AD Configuration
const azureAdConfig = {
  identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
  clientID: process.env.AZURE_CLIENT_ID,
  clientSecret: process.env.AZURE_CLIENT_SECRET,
  responseType: 'code id_token',
  responseMode: 'form_post',
  redirectUrl: process.env.AZURE_REDIRECT_URL || 'http://localhost:5000/auth/callback',
  allowHttpForRedirectUrl: process.env.NODE_ENV !== 'production',
  validateIssuer: true,
  passReqToCallback: false,
  scope: ['profile', 'email', 'openid'],
  loggingLevel: process.env.NODE_ENV === 'production' ? 'error' : 'info',
  nonceLifetime: 3600,
  nonceMaxAmount: 5,
  useCookieInsteadOfSession: false,
  cookieEncryptionKeys: [
    { key: process.env.COOKIE_ENCRYPTION_KEY || '12345678901234567890123456789012', iv: '123456789012' }
  ],
  clockSkew: 300
};

module.exports = azureAdConfig;
