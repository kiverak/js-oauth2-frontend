const CLIENT_ID = "todoapp-client";
const SCOPE = "openid";
const GRANT_TYPE_AUTH_CODE = "authorization_code";
const RESPONSE_TYPE_CODE = "code";

const SHA_256 = "SHA-256";
const S256 = "S256";

const KEYCLOAK_URI = "https://localhost:8443/realms/todoapp-realm/protocol/openid-connect";
const AUTH_CODE_REDIRECT_URI = "https://localhost:8080/redirect";
const ACCESS_TOKEN_REDIRECT_URI = "https://localhost:8080/redirect";

function initValues() {

    var state = generateState(30);
    document.getElementById("originalState").innerHTML = state;
    console.log("state = " + state);

    var codeVerifier = generateCodeVerifier();
    document.getElementById("codeVerifier").innerHTML = codeVerifier;
    console.log("codeVerifier = " + codeVerifier);

    generateCodeChallenge(codeVerifier).then(codeChallenge => {
        console.log("codeChallenge = " + codeChallenge);
        requestAuthCode(state, codeChallenge);
    });
}

function generateState(length) {

    var state = "";
    var alphaNumericCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var alphaNumericCharactersLength = alphaNumericCharacters.length;
    for (var i = 0; i < length; i++) {
        state += alphaNumericCharacters.charAt(Math.floor(Math.random() * alphaNumericCharactersLength));
    }

    return state;
}

function generateCodeVerifier() {
    var randomByteArray = new Uint8Array(43);
    window.crypto.getRandomValues(randomByteArray);
    return base64urlencode(randomByteArray);
}

function base64urlencode(sourceValue) {
    var stringValue = String.fromCharCode.apply(null, sourceValue);
    var base64Encoded = btoa(stringValue);
    return base64Encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(codeVerifier) {
    var textEncoder = new TextEncoder('US-ASCII');
    var encodedValue = textEncoder.encode(codeVerifier);
    var digest = await window.crypto.subtle.digest(SHA_256, encodedValue);

    return base64urlencode(Array.from(new Uint8Array(digest)));
}

function requestAuthCode(state, codeChallenge) {
    var authUrl = KEYCLOAK_URI + "/auth";

    authUrl += "?response_type=" + RESPONSE_TYPE_CODE;
    authUrl += "&client_id=" + CLIENT_ID;
    authUrl += "&state=" + state;
    authUrl += "&scope=" + SCOPE;
    authUrl += "&code_challenge=" + codeChallenge;
    authUrl += "&code_challenge_method=" + S256;
    authUrl += "&redirect_uri=" + AUTH_CODE_REDIRECT_URI;

    window.open(authUrl, 'auth_window', 'width=800, height=600, left=350, top=200');
}

function requestTokens(stateFromAuthServer, authCode) {

    var originalState = document.getElementById("originalState").innerHTML;

    if (stateFromAuthServer === originalState) {
        var codeVerifier = document.getElementById("codeVerifier").innerHTML;

        var data = {
            "grant_type": GRANT_TYPE_AUTH_CODE,
            "client_id": CLIENT_ID,
            "code": authCode,
            "code_verifier": codeVerifier,
            "redirect_uri": ACCESS_TOKEN_REDIRECT_URI
        };

        $.ajax({
            beforeSend: function (request) {
                request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
            },
            type: "POST",
            url: KEYCLOAK_URI + "/token",
            data: data,
            success: accessTokenResponse,
            dataType: "json"
        });
    } else {
        alert("Error state value");
    }
}

function accessTokenResponse(data, status, jqXHR) {
    console.log("access_token = " + data["access_token"]);
}
