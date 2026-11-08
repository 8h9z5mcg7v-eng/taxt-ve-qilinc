package az.taxtveqilinc.slg.city;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "player_cities")
public class CityState {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID playerId;

    @Column(nullable = false, length = 48)
    private String cityName;

    @Column(nullable = false)
    private int keepLevel;

    @Column(nullable = false)
    private long gold;

    @Column(nullable = false)
    private long wood;

    @Column(nullable = false)
    private long stone;

    @Column(nullable = false)
    private long food;

    @Column(nullable = false)
    private long iron;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected CityState() {}

    public CityState(UUID playerId, String cityName) {
        this.playerId = playerId;
        this.cityName = cityName;
        this.keepLevel = 1;
        this.gold = 1000;
        this.wood = 1500;
        this.stone = 1000;
        this.food = 2000;
        this.iron = 500;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getPlayerId() { return playerId; }
    public String getCityName() { return cityName; }
    public int getKeepLevel() { return keepLevel; }
    public long getGold() { return gold; }
    public long getWood() { return wood; }
    public long getStone() { return stone; }
    public long getFood() { return food; }
    public long getIron() { return iron; }
    public Instant getCreatedAt() { return createdAt; }
}