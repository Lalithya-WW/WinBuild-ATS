import { PublicClientApplication } from "@azure/msal-browser";

// MSAL configuration
export const msalConfig = {
  auth: {
    clientId: "ae5a4dac-fce9-4a74-942f-71ca215d5ed7",
    authority: "https://login.microsoftonline.com/bdcfaa46-3f69-4dfd-b3f7-c582bdfbb820",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

// Add scopes for ID token to be used at Microsoft identity platform endpoints
export const loginRequest = {
  scopes: ["User.Read"]
};

// Create the main myMSALObj instance
export const msalInstance = new PublicClientApplication(msalConfig);
