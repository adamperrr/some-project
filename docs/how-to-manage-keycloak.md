# How to manage Keycloak

1. Run `docker compose up -d`
2. In the browser open `http://localhost:8080` and login using `admin / admin`
3. Create a Realm (Context) e.g. `some-project`

- Click `Manage realms`
- Click `Create realm`
- Set name
- Click `Create`

4. Create a Client

- Click `Clients`
- Click `Create client`
    - `Client ID`: e.g. `my-local-app`
    - `Client Protocol`: `openid-connect`
    - `Access Type / Capability Config`: Use `Standard Flow` (Code Grant)
    - `Valid redirect URIs`: `http://localhost:3000/redirect`

5. Create a user in the realm

- Make sure that current realm is `some-project` (in left upper corner)
- Click `Users`
- Create a user
- Go to user's `Credentials` tab and set a password

6. Login and get a token

- Go to the browser and go to: `http://localhost:8080/realms/some-project/protocol/openid-connect/auth?client_id=my-local-app&response_type=code&scope=openid&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fredirect`
- After logging in you will be redirected to `http://localhost:3000/redirect?session_state=1arzJOkswkvcjp_CDYRAIRWZ&iss=http%3A%2F%2Flocalhost%3A8080%2Frealms%2Fsome-project&code=2bc9de26-4d89-46f0-8139-e24413994f50.1arzJOkswkvcjp_CDYRAIRWZ.d13e90d5-d595-47da-a0b1-030999b28a5a` where value of `code` will be used to get a token.
- To get a token execute: 

    ```powershell
    Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:8080/realms/some-project/protocol/openid-connect/token" `
    -ContentType "application/x-www-form-urlencoded" `
    -Body @{
        client_id    = "my-local-app"
        grant_type   = "authorization_code"
        code         = "THE_CODE"
        redirect_uri = "http://localhost:3000/redirect"
    }
    ```