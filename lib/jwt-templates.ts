export interface JwtTemplate {
  id: string;
  name: string;
  description: string;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
}

const now = () => Math.floor(Date.now() / 1000);

export const JWT_TEMPLATES: JwtTemplate[] = [
  {
    id: "oauth2",
    name: "OAuth2 Access Token",
    description: "Typical OAuth2 bearer token for API access.",
    header: { alg: "HS256", typ: "JWT" },
    payload: {
      iss: "https://auth.example.com",
      sub: "user_123",
      aud: "api.example.com",
      scope: "read:profile write:profile",
      iat: now(),
      exp: now() + 3600,
      jti: "tok_" + Math.random().toString(36).slice(2, 10),
    },
  },
  {
    id: "oidc",
    name: "OpenID Connect ID Token",
    description: "OIDC identity token claims.",
    header: { alg: "RS256", typ: "JWT", kid: "key-1" },
    payload: {
      iss: "https://id.example.com",
      sub: "user_abc",
      aud: "your-client-id",
      exp: now() + 3600,
      iat: now(),
      auth_time: now(),
      nonce: "n-" + Math.random().toString(36).slice(2, 10),
      name: "Ada Lovelace",
      email: "ada@example.com",
      email_verified: true,
    },
  },
  {
    id: "firebase",
    name: "Firebase Auth Token",
    description: "Firebase-style ID token claims.",
    header: { alg: "RS256", typ: "JWT" },
    payload: {
      iss: "https://securetoken.google.com/your-project",
      aud: "your-project",
      auth_time: now(),
      user_id: "firebase_uid_123",
      sub: "firebase_uid_123",
      iat: now(),
      exp: now() + 3600,
      email: "user@example.com",
      email_verified: true,
      firebase: { identities: { email: ["user@example.com"] }, sign_in_provider: "password" },
    },
  },
  {
    id: "supabase",
    name: "Supabase Access Token",
    description: "Supabase-style JWT with role and user metadata.",
    header: { alg: "HS256", typ: "JWT" },
    payload: {
      aud: "authenticated",
      exp: now() + 3600,
      iat: now(),
      iss: "https://xyz.supabase.co/auth/v1",
      sub: "00000000-0000-0000-0000-000000000000",
      email: "user@example.com",
      role: "authenticated",
      app_metadata: { provider: "email" },
      user_metadata: {},
    },
  },
  {
    id: "aws-cognito",
    name: "AWS Cognito ID Token",
    description: "AWS Cognito identity token.",
    header: { alg: "RS256", kid: "cognito-key", typ: "JWT" },
    payload: {
      sub: "a1b2c3d4-e5f6-7890-abcd-ef0123456789",
      aud: "client_id_here",
      iss: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_pool",
      token_use: "id",
      auth_time: now(),
      "cognito:username": "ada.lovelace",
      email: "ada@example.com",
      email_verified: true,
      iat: now(),
      exp: now() + 3600,
    },
  },
];

export function curlWithToken(token: string, endpoint = "https://api.example.com/me"): string {
  return `curl -H "Authorization: Bearer ${token}" \\\n  ${endpoint}`;
}
