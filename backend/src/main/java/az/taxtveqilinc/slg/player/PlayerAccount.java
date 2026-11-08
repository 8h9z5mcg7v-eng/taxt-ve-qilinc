package az.taxtveqilinc.slg.player;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "player_accounts")
public class PlayerAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 24)
    private String nickname;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected PlayerAccount() {}

    public PlayerAccount(String nickname) {
        this.nickname = nickname;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getNickname() { return nickname; }
    public Instant getCreatedAt() { return createdAt; }
}