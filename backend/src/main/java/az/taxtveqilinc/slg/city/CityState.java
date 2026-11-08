package az.taxtveqilinc.slg.city;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "player_cities")
public class CityState {
    public static final long RESOURCE_CAP = 100_000L;

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

    @Column(nullable = false)
    private Instant lastResourceUpdateAt;

    @Column
    private Instant keepUpgradeEndsAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected CityState() {}

    public CityState(UUID playerId, String cityName) {
        Instant now = Instant.now();
        this.playerId = playerId;
        this.cityName = cityName;
        this.keepLevel = 1;
        this.gold = 1000;
        this.wood = 1500;
        this.stone = 1000;
        this.food = 2000;
        this.iron = 500;
        this.lastResourceUpdateAt = now;
        this.createdAt = now;
    }

    public void accrueResources(Instant now) {
        if (lastResourceUpdateAt == null) {
            lastResourceUpdateAt = now;
            return;
        }
        if (!now.isAfter(lastResourceUpdateAt)) return;

        long elapsedSeconds = java.time.Duration.between(lastResourceUpdateAt, now).getSeconds();
        if (elapsedSeconds <= 0) return;

        // Temporary development rates per hour at keep level 1; each keep level adds 10%.
        double multiplier = 1.0 + Math.max(0, keepLevel - 1) * 0.10;
        gold = addProduction(gold, 20, elapsedSeconds, multiplier);
        wood = addProduction(wood, 45, elapsedSeconds, multiplier);
        stone = addProduction(stone, 30, elapsedSeconds, multiplier);
        food = addProduction(food, 60, elapsedSeconds, multiplier);
        iron = addProduction(iron, 12, elapsedSeconds, multiplier);
        lastResourceUpdateAt = now;
    }

    private long addProduction(long current, long perHour, long elapsedSeconds, double multiplier) {
        if (current >= RESOURCE_CAP) return RESOURCE_CAP;
        double produced = perHour * multiplier * (elapsedSeconds / 3600.0);
        long wholeUnits = (long) Math.floor(produced);
        return Math.min(RESOURCE_CAP, current + wholeUnits);
    }

    public void beginKeepUpgrade(long goldCost, long woodCost, long stoneCost,
                                 long foodCost, long ironCost, Instant finishAt) {
        this.gold -= goldCost;
        this.wood -= woodCost;
        this.stone -= stoneCost;
        this.food -= foodCost;
        this.iron -= ironCost;
        this.keepUpgradeEndsAt = finishAt;
    }

    public boolean completeKeepUpgradeIfReady(Instant now) {
        if (keepUpgradeEndsAt == null || now.isBefore(keepUpgradeEndsAt)) return false;
        keepLevel += 1;
        keepUpgradeEndsAt = null;
        return true;
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
    public Instant getLastResourceUpdateAt() { return lastResourceUpdateAt; }
    public Instant getKeepUpgradeEndsAt() { return keepUpgradeEndsAt; }
    public Instant getCreatedAt() { return createdAt; }
}
