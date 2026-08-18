# How to manage Keycloak

1. Run `docker compose up -d`
2. In the browser open `http://localhost:8080` and login using `admin / admin`
3. Create a Realm (Context) e.g. `some-project`
4. Create a Client

- `Client ID`: e.g. `my-local-app`
- `Client Protocol`: `openid-connect`
- `Access Type / Capability Config`: Use `Standard Flow` (Code Grant)
- `Valid redirect URIs`