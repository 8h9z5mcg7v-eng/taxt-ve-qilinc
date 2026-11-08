package az.taxtveqilinc.slg.player;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/players")
public class PlayerController {
    private final PlayerService service;

    public PlayerController(PlayerService service) {
        this.service = service;
    }

    public record CreatePlayerRequest(
        @NotBlank @Size(min = 3, max = 24) String nickname
    ) {}

    public record PlayerResponse(UUID id, String nickname, Instant createdAt) {
        static PlayerResponse from(PlayerAccount player) {
            return new PlayerResponse(player.getId(), player.getNickname(), player.getCreatedAt());
        }
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlayerResponse create(@Valid @RequestBody CreatePlayerRequest request) {
        return PlayerResponse.from(service.create(request.nickname()));
    }
}