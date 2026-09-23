/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.webapp;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.Principal;
import java.security.PrivateKey;
import java.text.ParseException;
import java.util.Base64;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.checkerframework.checker.nullness.qual.MonotonicNonNull;
import org.checkerframework.checker.nullness.qual.Nullable;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.KeyType;
import com.nimbusds.oauth2.sdk.AuthorizationCode;
import com.nimbusds.oauth2.sdk.AuthorizationCodeGrant;
import com.nimbusds.oauth2.sdk.AuthorizationGrant;
import com.nimbusds.oauth2.sdk.GeneralException;
import com.nimbusds.oauth2.sdk.ResponseType;
import com.nimbusds.oauth2.sdk.Scope;
import com.nimbusds.oauth2.sdk.TokenRequest;
import com.nimbusds.oauth2.sdk.TokenResponse;
import com.nimbusds.oauth2.sdk.assertions.jwt.JWTAssertionDetails;
import com.nimbusds.oauth2.sdk.assertions.jwt.JWTAssertionFactory;
import com.nimbusds.oauth2.sdk.auth.ClientAuthentication;
import com.nimbusds.oauth2.sdk.auth.ClientSecretBasic;
import com.nimbusds.oauth2.sdk.auth.JWTAuthenticationClaimsSet;
import com.nimbusds.oauth2.sdk.auth.PrivateKeyJWT;
import com.nimbusds.oauth2.sdk.auth.Secret;
import com.nimbusds.oauth2.sdk.id.Audience;
import com.nimbusds.oauth2.sdk.id.ClientID;
import com.nimbusds.oauth2.sdk.id.Issuer;
import com.nimbusds.oauth2.sdk.id.State;
import com.nimbusds.openid.connect.sdk.AuthenticationRequest;
import com.nimbusds.openid.connect.sdk.Nonce;
import com.nimbusds.openid.connect.sdk.OIDCTokenResponseParser;
import com.nimbusds.openid.connect.sdk.UserInfoRequest;
import com.nimbusds.openid.connect.sdk.UserInfoResponse;
import com.nimbusds.openid.connect.sdk.claims.UserInfo;
import com.nimbusds.openid.connect.sdk.op.OIDCProviderMetadata;

import ch.unibe.germanistik.namenatlas.User;
import ch.unibe.germanistik.namenatlas.User.Role;
import ch.unibe.germanistik.namenatlas.persistence.QUserEntity;
import ch.unibe.germanistik.namenatlas.webapp.api.RestApi;
import ch.unibe.germanistik.namenatlas.webapp.api.Users;

/**
 * Handles user authentication and authorization for the application.
 *
 * Authentication is implemented via <a href="https://openid.net/connect/">OpenID Connect</a>
 * against the <a href="https://www.switch.ch/">https://www.switch.ch/</a> identity provider.
 *
 * Authorization is managed by looking up the email address returned in the OpenID Connect ID token in the lokal
 * {@link Users} table.
 *
 * Sucessfully authenticated users and their roles can be retrieved by the usual {@link HttpServletRequest#getUserPrincipal()}
 * and {@link HttpServletRequest#isUserInRole(String)} methods.
 *
 */
@WebFilter("/*")
public class LoginFilter extends HttpFilter {

    private @MonotonicNonNull Issuer issuer = null;
    private @MonotonicNonNull OIDCProviderMetadata oidcConfig = null;
    private @MonotonicNonNull ClientID clientID = null;
    private @MonotonicNonNull URI callbackURL = null;
    private @MonotonicNonNull String statePrefix = null;
    private @MonotonicNonNull JWK privateKey = null;
    private @MonotonicNonNull Secret sharedSecret = null;
    private final Scope scope = new Scope("openid", "email", "swissEduIDBase", "https://login.eduid.ch/authz/User.Read");
    private final ResponseType codeFlow = new ResponseType("code");

    private static final String SESSION_KEY_USER = LoginFilter.class.getName() + "#USER";

    private URI authorizationEndpoint() throws ServletException {
        return oidcConfig().getAuthorizationEndpointURI();
    }

    private Issuer issuer() {
        if (issuer == null) {
            issuer = new Issuer(getServletContext().getInitParameter("openid.issuer"));
        }
        return issuer;
    }

    @SuppressWarnings("nullness") // last three arguments to JWTAssertionFactory.create() should be null, but the nullness checker assumes @NonNull by default. TODO: Write a stub file instead
    private ClientAuthentication clientAuth() throws ServletException {
        if (privateKey == null && sharedSecret == null) {
            String rawKey = getServletContext().getInitParameter("openid.key");
            try {
              privateKey = JWK.parse(rawKey);
            } catch (ParseException e) {
                // If we can't parse the key as a JwT, assume it's a shared secret
                sharedSecret = new Secret(rawKey);
            }
        }
        if (sharedSecret != null) {
          return new ClientSecretBasic(clientID(), sharedSecret);
        } else {
            try {
                JWSAlgorithm jwsAlgorithm;
                PrivateKey key;
                if (KeyType.EC.equals(privateKey.getKeyType())) {
                    jwsAlgorithm = JWSAlgorithm.ES256;
                    key = privateKey.toECKey().toPrivateKey();
                } else if (KeyType.RSA.equals(privateKey.getKeyType())) {
                    jwsAlgorithm = JWSAlgorithm.RS256;
                    key = privateKey.toRSAKey().toPrivateKey();
                } else {
                    throw new ServletException("Unsupported key type: " + privateKey.getKeyType());
                };
                Audience audience = new Audience(oidcConfig().getTokenEndpointURI());
                JWTAuthenticationClaimsSet jwtAuthClaimsSet = new JWTAuthenticationClaimsSet(clientID, audience);

                return new PrivateKeyJWT(JWTAssertionFactory.create(
                    jwtAuthClaimsSet,
                    jwsAlgorithm,
                    key,
                    privateKey.getKeyID(),
                    null, null, null
                ));
            } catch (JOSEException e) {
                throw new ServletException(e);
            }
        }
    }
    private String statePrefix() {
        if (statePrefix == null) {
            statePrefix = getServletContext().getInitParameter("openid.state.prefix");
            if (statePrefix == null) { statePrefix = ""; }
            else { statePrefix = statePrefix + ":"; }
        }
        return statePrefix;
    }

    private OIDCProviderMetadata oidcConfig() throws ServletException {
        if (oidcConfig == null) {
            try {
                oidcConfig = OIDCProviderMetadata.resolve(issuer());
            } catch (GeneralException | IOException e) {
                throw new ServletException(e);
            }
        }
        return oidcConfig;
    }

    private URI callbackURL() {
        if (callbackURL == null) {
            try {
                callbackURL = new URI(getServletContext().getInitParameter("openid.callbackurl"));
            } catch (URISyntaxException e) {
                throw new IllegalStateException("Not a valid URI: " + e.getInput());
            }
        }
        return callbackURL;
    }

    private ClientID clientID() {
        if (clientID == null) {
            clientID = new ClientID(getServletContext().getInitParameter("openid.clientid"));
        }
        return clientID;
    }

    private static String path(HttpServletRequest req) {
        return req.getContextPath()
             + req.getServletPath()
             + (req.getPathInfo()==null?"":req.getPathInfo());
    }

    private static final class AuthenticatedRequest extends HttpServletRequestWrapper {
        private final User user;
        private final Principal principal;
        public AuthenticatedRequest(HttpServletRequest wrapped, User user) {
            super(wrapped);
            this.user = user;
            this.principal = new Principal() {
                @Override public String getName() { return user.getEmail(); }
            };
        }
        @Override public Principal getUserPrincipal() { return principal; }
        @Override public String getRemoteUser() { return user.getEmail(); }
        @Override public boolean isUserInRole(String roleName) {
            for (Role candidate: user.getRoles()) {
                if (candidate.name().equalsIgnoreCase(roleName)) {
                    return true;
                }
            }
            return false;
        }
        @Override public void login(String username, String password) throws ServletException {
            throw new ServletException("already authenticated");
        }
        @Override public void logout() throws ServletException {
            throw new ServletException("logout not supported");
        }
    }

    @Override
    protected void doFilter(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws IOException, ServletException
    {
        if (isOpenidCallbackRequest(req)) {
            handleOpenidCallbackRequest(req, res, chain);
        } else {
            @Nullable HttpSession session = req.getSession(false);
            if (session != null) {
                @Nullable User user = authenticatedUserFromSession(session);
                if (user == null) {
                    handleUnauthenticatedRequest(req, res, chain);
                } else {
                    handleAuthenticatedRequest(req, res, chain, user);
                }
            } else {
                handleUnauthenticatedRequest(req, res, chain);
            }
        }
    }

    private void handleAuthenticatedRequest(
        HttpServletRequest req,
        HttpServletResponse res,
        FilterChain chain,
        User user)
        throws IOException, ServletException
    {
        // Default to "Cache-Control: no-cache" to force revalidation on subsequent requests
        // so we can check for expired sessions.
        res.setHeader("Cache-Control", "no-cache");
        chain.doFilter(new AuthenticatedRequest(req, user), res);
    }

    private @Nullable User authenticatedUserFromSession(HttpSession session) {
        return (User)session.getAttribute(SESSION_KEY_USER);
    }

    private void handleOpenidCallbackRequest(
        HttpServletRequest req,
        HttpServletResponse res,
        FilterChain chain)
        throws ServletException, IOException
    {
        // We always expect a valid session for an openid callback, and
        // we expect that we have an original URL in that session with the
        // "state" parameter as attribute key.
        // If any of this is not the case, we send a 401 response.
        @Nullable HttpSession session = req.getSession(false);
        if (session == null) {
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        @Nullable String stateKey = req.getParameter("state");
        @Nullable String originalURL = stateKey == null ? null : session.getAttribute(stateKey).toString();
        if (originalURL == null) {
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        AuthorizationGrant codeGrant = new AuthorizationCodeGrant(
            new AuthorizationCode(req.getParameter("code")),
            callbackURL()
        );
        UserInfo userInfo;
        try {
            TokenRequest tokenRequest = new TokenRequest(
                oidcConfig().getTokenEndpointURI(),
                clientAuth(),
                codeGrant);
            TokenResponse tokenResponse = OIDCTokenResponseParser.parse(
                tokenRequest.toHTTPRequest().send()
            );
            if (!tokenResponse.indicatesSuccess()) {
                throw new ServletException(tokenResponse.toErrorResponse().toJSONObject().toJSONString());
            }
            UserInfoRequest userInfoRequest = new UserInfoRequest(
                oidcConfig().getUserInfoEndpointURI(),
                tokenResponse.toSuccessResponse().getTokens().getBearerAccessToken()
            );
            UserInfoResponse userInfoResponse = UserInfoResponse.parse(userInfoRequest.toHTTPRequest().send());
            if (!userInfoResponse.indicatesSuccess()) {
                throw new ServletException(userInfoResponse.toErrorResponse().getErrorObject().getDescription());
            }
            userInfo = userInfoResponse.toSuccessResponse().getUserInfo();
        } catch (com.nimbusds.oauth2.sdk.ParseException e) {
            throw new ServletException(e);
        }

        JPAUtil jpa = JPAUtil.get(req);
        @Nullable String email = userInfo.getEmailAddress();
        if (email == null) {
            // No email in the user info means no access
            res.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        @Nullable User user = jpa.find(query ->
            query.from(QUserEntity.userEntity)
                 .where(QUserEntity.userEntity.email.eq(email))
        );
        if (user == null) {
            // No user found that corresponds to the email from the ID token means no access
            res.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        session.setAttribute(SESSION_KEY_USER, user);
        res.sendRedirect(originalURL);
    }

    @SuppressWarnings("nullness") //

    private boolean isOpenidCallbackRequest(HttpServletRequest req) {
        String path = path(req);
        return (path.isEmpty() || "/index.html".equals(path) || "/".equals(path))
            && req.getParameter("code") != null
            && req.getParameter("state") != null;
    }

    private void handleUnauthenticatedRequest(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
        throws IOException, ServletException
    {
        String path = path(req);
        if (isAnonymousAccessAllowed(path)) {
            // Just pass on the request since we don't care about authentication
            chain.doFilter(req, res);
        } else if (RestApi.isApiPath(path) || isResourcePath(path) || !"GET".equals(req.getMethod())) {
            // Respond with a "401 unauthorized" code to signal that the user needs to authenticate.
            // TODO: Send ErrorMessage in body if the request accepts JSON
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
        } else {
            // Initiate interactive OpenID Connect login via switch.ch
            HttpSession session = req.getSession(true);
            StringBuffer originalURL = req.getRequestURL();
            if (req.getQueryString() != null) {
                originalURL.append("?").append(req.getQueryString());
            }
            String state = createStateParameter(session, originalURL.toString());
            session.setAttribute(state, originalURL);
            AuthenticationRequest request = new AuthenticationRequest
                .Builder(codeFlow, scope, clientID(), callbackURL())
                .endpointURI(authorizationEndpoint())
                .state(new State(state))
                .nonce(new Nonce(session.getId()))
                .build();
            res.sendRedirect(request.toURI().toASCIIString());
        }
    }

    private String createStateParameter(HttpSession session, String originalRequest) {
        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
        digest.update(session.getId().getBytes(StandardCharsets.UTF_8));
        digest.update(originalRequest.getBytes(StandardCharsets.UTF_8));
        byte[] uriHash = digest.digest();
        return statePrefix() + Base64.getEncoder().encodeToString(uriHash) + session.getId();
    }

    private boolean isResourcePath(String path) {
        // everything with a name that does not end in ".html" is considered as a resource
        return !path.endsWith(".html");
    }

    private boolean isAnonymousAccessAllowed(String path) {
        // only allow anonymous access to the page that informs the users that the
        // authorization for this session has expired.
        return path.equalsIgnoreCase("/logout.html");
    }

}
