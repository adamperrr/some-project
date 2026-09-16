const keycloakBaseUrl = "http://localhost:8080";
const realm = "some-project";
const clientId = "my-local-app";
const redirectUri = "http://localhost:3000/redirect";
const tokenStorageKey = "keycloak_access_token";
const verifierStorageKey = "keycloak_code_verifier";
const stateStorageKey = "keycloak_state";

const loginButton = document.querySelector<HTMLButtonElement>("#login-button")!;
const logoutButton = document.querySelector<HTMLButtonElement>("#logout-button")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;

const authorizationEndpoint = `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/auth`;
const tokenEndpoint = `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`;

function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function startLogin(): Promise<void> {
  const verifier = randomString(32);
  const state = randomString(16);
  const challenge = await createCodeChallenge(verifier);

  sessionStorage.setItem(verifierStorageKey, verifier);
  sessionStorage.setItem(stateStorageKey, state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid",
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });

  window.location.assign(`${authorizationEndpoint}?${params}`);
}

async function exchangeCodeForToken(code: string): Promise<void> {
  const verifier = sessionStorage.getItem(verifierStorageKey);
  if (!verifier) {
    throw new Error("Brak code verifier. Rozpocznij logowanie ponownie.");
  }

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    throw new Error(`Wymiana code na token nie powiodła się (${response.status}).`);
  }

  const tokenResponse: { access_token: string } = await response.json();
  localStorage.setItem(tokenStorageKey, tokenResponse.access_token);
  sessionStorage.removeItem(verifierStorageKey);
  sessionStorage.removeItem(stateStorageKey);
  window.history.replaceState({}, document.title, "/");
}

async function handleCallback(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  const code = params.get("code");

  if (error) {
    throw new Error(`Keycloak zwrócił błąd: ${error}`);
  }
  if (!code) {
    return;
  }

  if (params.get("state") !== sessionStorage.getItem(stateStorageKey)) {
    throw new Error("Nieprawidłowy parametr state.");
  }

  status.textContent = "Pobieranie tokenu...";
  await exchangeCodeForToken(code);
}

function updateUi(): void {
  const loggedIn = localStorage.getItem(tokenStorageKey) !== null;
  status.textContent = loggedIn ? "Zalogowano. Token jest w localStorage." : "Nie zalogowano";
  loginButton.hidden = loggedIn;
  logoutButton.hidden = !loggedIn;
}

loginButton.addEventListener("click", () => void startLogin());
logoutButton.addEventListener("click", () => {
  localStorage.removeItem(tokenStorageKey);
  updateUi();
});

void handleCallback()
  .catch((error: unknown) => {
    status.textContent = error instanceof Error ? error.message : "Logowanie nie powiodło się.";
  })
  .finally(updateUi);