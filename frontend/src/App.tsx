import { useEffect, useState } from "react";
import "./App.css";

const keycloakBaseUrl = "http://localhost:8080";
const keycloakRealm = "some-project";
const keycloakClientId = "my-local-app";
const redirectUri = window.location.origin;
const tokenStorageKey = "keycloak_token";
const verifierStorageKey = "keycloak_pkce_verifier";
const stateStorageKey = "keycloak_oauth_state";

type TokenResponse = {
  access_token: string;
};

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createPkceChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toBase64Url(new Uint8Array(digest));
}

function createRandomValue(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

async function startLogin(): Promise<void> {
  const verifier = createRandomValue();
  const state = createRandomValue();
  const challenge = await createPkceChallenge(verifier);

  sessionStorage.setItem(verifierStorageKey, verifier);
  sessionStorage.setItem(stateStorageKey, state);

  const authorizationUrl = new URL(
    `${keycloakBaseUrl}/realms/${keycloakRealm}/protocol/openid-connect/auth`,
  );
  authorizationUrl.search = new URLSearchParams({
    client_id: keycloakClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  window.location.assign(authorizationUrl.toString());
}

async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const verifier = sessionStorage.getItem(verifierStorageKey);
  const tokenUrl = `${keycloakBaseUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: keycloakClientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier ?? "",
    }),
  });

  if (!response.ok) throw new Error("Keycloak nie zwrócił tokenu.");
  return (await response.json()) as TokenResponse;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
}

function App() {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(tokenStorageKey),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error_description"))
      return params.get("error_description") ?? "";
    if (
      params.get("code") &&
      params.get("state") !== sessionStorage.getItem(stateStorageKey)
    ) {
      return "Nieprawidłowy stan logowania.";
    }
    return "";
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const returnedState = params.get("state");
    const savedState = sessionStorage.getItem(stateStorageKey);

    if (!code || !returnedState || returnedState !== savedState) return;

    exchangeCodeForToken(code)
      .then((tokenResponse) => {
        sessionStorage.setItem(tokenStorageKey, tokenResponse.access_token);
        setToken(tokenResponse.access_token);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      })
      .catch((tokenError: unknown) => setError(getErrorMessage(tokenError)))
      .finally(() => {
        sessionStorage.removeItem(verifierStorageKey);
        sessionStorage.removeItem(stateStorageKey);
      });
  }, []);

  function logout(): void {
    sessionStorage.removeItem(tokenStorageKey);
    setToken(null);
  }

  async function login(): Promise<void> {
    setIsLoading(true);
    try {
      await startLogin();
    } catch (loginError: unknown) {
      setError(getErrorMessage(loginError));
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-live="polite">
        <p className="eyebrow">Local identity</p>
        <h1>Welcome back</h1>
        <p className="description">
          Zaloguj się przez Keycloak, aby kontynuować.
        </p>

        {token ? (
          <>
            <p className="status">
              Zalogowano. Token jest zapisany w sessionStorage.
            </p>
            <button type="button" className="login-button" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <button
            type="button"
            className="login-button"
            onClick={login}
            disabled={isLoading}
          >
            {isLoading ? "Logowanie..." : "Login"}
          </button>
        )}

        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}

export default App;
