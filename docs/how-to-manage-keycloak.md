# How to manage Keycloak

## Start the local instance

From the repository root run:

```bash
docker compose up -d
```

The Compose file imports the realm configuration from
`keycloak/realm-export.json` automatically. It creates:

- realm: `some-project`
- client: `my-local-app`
- redirect URIs for `http://localhost:5173` and `http://localhost:3000`

Open `http://localhost:8080` and log in to the admin console with:

```text
admin / admin
```

## Create a local user

The realm and client are imported automatically, but users are not stored in
the repository. In the admin console:

1. Select the `some-project` realm.
2. Open **Users** and create a user.
3. Open the user's **Credentials** tab and set a password.

The frontend can then be started with:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` and click **Login**.

## Manual configuration

If you want to configure Keycloak from the admin console instead of using the
realm export:

1. Open `http://localhost:8080` and log in with `admin / admin`.
2. Open **Manage realms** and select **Create realm**.
3. Set the realm name to `some-project` and click **Create**.
4. Open **Clients** and click **Create client**.
5. Set **Client ID** to `my-local-app`.
6. Keep the protocol as `openid-connect` and enable **Standard Flow**.
7. Configure these redirect and origin values:

   ```text
   Valid redirect URIs: http://localhost:5173/*
   Web origins: http://localhost:5173
   ```

8. Keep client authentication disabled. The frontend is a public client and
   uses Authorization Code with PKCE.
9. In the `some-project` realm, open **Users**, create a user, and set the
   password in the user's **Credentials** tab.

For a manual authorization-code test, open this URL in the browser:

```text
http://localhost:8080/realms/some-project/protocol/openid-connect/auth?client_id=my-local-app&response_type=code&scope=openid&redirect_uri=http%3A%2F%2Flocalhost%3A5173
```

After login, copy the `code` query parameter from the redirect URL and use it
to request a token:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/realms/some-project/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body @{
	 client_id = "my-local-app"
	 grant_type = "authorization_code"
	 code = "THE_CODE"
	 redirect_uri = "http://localhost:5173"
  }
```

## Re-import after changing the export

Keycloak does not overwrite an already existing realm during import. To
recreate the local container from the current export:

```bash
docker compose down
docker compose up -d
```

If a persistent Keycloak volume is added later, remove that volume before
recreating the realm.
