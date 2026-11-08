package az.taxtveqilinc.slg.player;

import az.taxtveqilinc.slg.security.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final PlayerService players;
    private final JwtService jwtService;

    public AuthController(PlayerService players, JwtService jwtService) {
        this.players = players;
        this.jwtService = jwtService;
    }

    public record RegisterRequest(
        @NotBlank @Email @Size(max = 190) String email,
        @NotBlank @Size(min = 3, max = 24) String nickname,
        @NotBlank @Size(min = 10, max = 72) String password
    ) {}

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 10, max = 72) String password
    ) {}

    public record AuthResponse(UUID playerId, String nickname, String accessToken,
                               String tokenType, Instant createdAt) {}

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        PlayerAccount player = players.register(request.email(), request.nickname(), request.password());
        return response(player);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return response(players.authenticate(request.email(), request.password()));
    }

    @GetMapping("/me")
    public AuthResponse me(Authentication authentication) {
        PlayerAccount player = players.getById((UUID) authentication.getPrincipal());
        return response(player);
    }

    private AuthResponse response(PlayerAccount player) {
        return new AuthResponse(player.getId(), player.getNickname(),
            jwtService.issue(player.getId()), "Bearer", player.getCreatedAt());
    }
}