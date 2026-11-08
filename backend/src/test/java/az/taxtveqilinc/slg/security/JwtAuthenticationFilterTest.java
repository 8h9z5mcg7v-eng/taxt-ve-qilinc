package az.taxtveqilinc.slg.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtAuthenticationFilterTest {
    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void validBearerTokenAuthenticatesPlayer() throws Exception {
        JwtService jwt = mock(JwtService.class);
        UUID playerId = UUID.randomUUID();
        when(jwt.verifyAndGetPlayerId("valid-token")).thenReturn(playerId);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwt);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilterInternal(request, response, chain);

        assertEquals(playerId, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        assertEquals(200, response.getStatus());
        assertNotNull(chain.getRequest());
    }

    @Test
    void invalidBearerTokenReturnsUnauthorizedAndStopsChain() throws Exception {
        JwtService jwt = mock(JwtService.class);
        when(jwt.verifyAndGetPlayerId("broken-token")).thenThrow(new IllegalArgumentException("bad token"));
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwt);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer broken-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, chain);

        assertEquals(401, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(chain);
    }
}
