package az.taxtveqilinc.slg.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMinutes;

    public JwtService(
        @Value("${app.jwt.secret-base64}") String secret,
        @Value("${app.jwt.expiration-minutes:60}") long expirationMinutes
    ) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expirationMinutes = expirationMinutes;
    }

    public String issue(UUID playerId) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(playerId.toString())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(expirationMinutes * 60)))
            .signWith(key)
            .compact();
    }

    public UUID verifyAndGetPlayerId(String token) {
        String subject = Jwts.parser().verifyWith(key).build()
            .parseSignedClaims(token).getPayload().getSubject();
        return UUID.fromString(subject);
    }
}