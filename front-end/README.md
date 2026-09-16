# Front-end: Keycloak + vanilla TypeScript

## Wymagania

- Node.js LTS i npm
- uruchomiony Docker Desktop

Sprawdzenie instalacji:

```powershell
node --version
npm --version
```

Jeżeli Node.js nie jest zainstalowany, pobierz wersję LTS z https://nodejs.org/.

## Uruchomienie Keycloak

W katalogu głównym projektu:

```powershell
docker compose up -d
```

Otwórz `http://localhost:8080`, zaloguj się jako `admin` / `admin`, utwórz realm `some-project`, a następnie klienta:

- Client ID: `my-local-app`
- Client authentication: `Off` (klient publiczny)
- Standard flow: włączony
- Valid redirect URIs: `http://localhost:3000/redirect`
- Web origins: `http://localhost:3000`

Utwórz też użytkownika w tym realmie i ustaw mu hasło.

## Uruchomienie front-endu

W katalogu `front-end`:

```powershell
npm install
npm run dev
```

Otwórz `http://localhost:3000` i kliknij **Zaloguj**. Aplikacja:

1. kieruje przeglądarkę do endpointu autoryzacji Keycloak,
2. odbiera `code` na `/redirect` i wysyła go do endpointu tokenu,
3. zapisuje `access_token` jako `keycloak_access_token` w `localStorage`.

PKCE chroni kod autoryzacyjny bez używania sekretu klienta w kodzie przeglądarkowym. W produkcji przechowywanie tokenów w `localStorage` ma ryzyko przy XSS; tutaj jest użyte wyłącznie zgodnie z celem przykładu.