package az.taxtveqilinc.slg.city;

import jakarta.persistence.*;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "player_cities")
public class CityState {
    public static final long RESOURCE_CAP = 100_000L;

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, unique = true)
    private UUID playerId;
    @Column(nullable = false, length = 48)
    private String cityName;
    @Column(nullable = false)
    private int keepLevel;
    @Column(nullable = false) private long gold;
    @Column(nullable = false) private long wood;
    @Column(nullable = false) private long stone;
    @Column(nullable = false) private long food;
    @Column(nullable = false) private long iron;
    @Column(nullable = false) private Instant lastResourceUpdateAt;
    @Column(nullable = false) private double goldRemainder;
    @Column(nullable = false) private double woodRemainder;
    @Column(nullable = false) private double stoneRemainder;
    @Column(nullable = false) private double foodRemainder;
    @Column(nullable = false) private double ironRemainder;
    @Column private Instant keepUpgradeEndsAt;
    @Column(nullable = false) private int woodcutterLevel = 1;
    @Column(nullable = false) private int quarryLevel = 1;
    @Column(nullable = false) private int farmLevel = 1;
    @Column(nullable = false) private int ironMineLevel = 1;
    @Column private Instant woodcutterUpgradeEndsAt;
    @Column private Instant quarryUpgradeEndsAt;
    @Column private Instant farmUpgradeEndsAt;
    @Column private Instant ironMineUpgradeEndsAt;
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

        Instant upgradeFinish = keepUpgradeEndsAt;
        if (upgradeFinish != null && upgradeFinish.isAfter(lastResourceUpdateAt)
                && !upgradeFinish.isAfter(now)) {
            accrueSegment(upgradeFinish);
            keepLevel += 1;
            keepUpgradeEndsAt = null;
        }
        accrueSegment(now);
    }

    private void accrueSegment(Instant segmentEnd) {
        if (!segmentEnd.isAfter(lastResourceUpdateAt)) return;
        long elapsedSeconds = Duration.between(lastResourceUpdateAt, segmentEnd).getSeconds();
        if (elapsedSeconds > 0) {
            double multiplier = 1.0 + Math.max(0, keepLevel - 1) * 0.10;
            gold = addProduction(gold, 20, elapsedSeconds, multiplier, 0);
            wood = addProduction(wood, 45, elapsedSeconds, multiplier * buildingMultiplier(woodcutterLevel), 1);
            stone = addProduction(stone, 30, elapsedSeconds, multiplier * buildingMultiplier(quarryLevel), 2);
            food = addProduction(food, 60, elapsedSeconds, multiplier * buildingMultiplier(farmLevel), 3);
            iron = addProduction(iron, 12, elapsedSeconds, multiplier * buildingMultiplier(ironMineLevel), 4);
        }
        lastResourceUpdateAt = segmentEnd;
    }

    private long addProduction(long current, long perHour, long elapsedSeconds, double multiplier, int resource) {
        if (current >= RESOURCE_CAP) {
            setRemainder(resource, 0);
            return RESOURCE_CAP;
        }
        double produced = perHour * multiplier * (elapsedSeconds / 3600.0) + getRemainder(resource);
        long wholeUnits = (long) Math.floor(produced);
        long increment = Math.min(RESOURCE_CAP - current, wholeUnits);
        long updated = current + increment;
        setRemainder(resource, updated >= RESOURCE_CAP ? 0 : produced - wholeUnits);
        return updated;
    }

    private double getRemainder(int resource) {
        return switch (resource) {
            case 0 -> goldRemainder;
            case 1 -> woodRemainder;
            case 2 -> stoneRemainder;
            case 3 -> foodRemainder;
            case 4 -> ironRemainder;
            default -> throw new IllegalArgumentException("Unknown resource.");
        };
    }

    private void setRemainder(int resource, double value) {
        switch (resource) {
            case 0 -> goldRemainder = value;
            case 1 -> woodRemainder = value;
            case 2 -> stoneRemainder = value;
            case 3 -> foodRemainder = value;
            case 4 -> ironRemainder = value;
            default -> throw new IllegalArgumentException("Unknown resource.");
        }
    }


    private double buildingMultiplier(int level) { return 1.0 + Math.max(0, level - 1) * 0.25; }

    public int getBuildingLevel(String building) {
        return switch (building) {
            case "WOODCUTTER" -> woodcutterLevel;
            case "QUARRY" -> quarryLevel;
            case "FARM" -> farmLevel;
            case "IRON_MINE" -> ironMineLevel;
            default -> throw new IllegalArgumentException("Naməlum istehsal binası.");
        };
    }

    public Instant getBuildingUpgradeEndsAt(String building) {
        return switch (building) {
            case "WOODCUTTER" -> woodcutterUpgradeEndsAt;
            case "QUARRY" -> quarryUpgradeEndsAt;
            case "FARM" -> farmUpgradeEndsAt;
            case "IRON_MINE" -> ironMineUpgradeEndsAt;
            default -> throw new IllegalArgumentException("Naməlum istehsal binası.");
        };
    }

    public void startBuildingUpgrade(String building, Instant finishAt) {
        switch (building) {
            case "WOODCUTTER" -> woodcutterUpgradeEndsAt = finishAt;
            case "QUARRY" -> quarryUpgradeEndsAt = finishAt;
            case "FARM" -> farmUpgradeEndsAt = finishAt;
            case "IRON_MINE" -> ironMineUpgradeEndsAt = finishAt;
            default -> throw new IllegalArgumentException("Naməlum istehsal binası.");
        }
    }

    public void completeBuildingUpgrades(Instant now) {
        if (woodcutterUpgradeEndsAt != null && !now.isBefore(woodcutterUpgradeEndsAt)) { woodcutterLevel++; woodcutterUpgradeEndsAt = null; }
        if (quarryUpgradeEndsAt != null && !now.isBefore(quarryUpgradeEndsAt)) { quarryLevel++; quarryUpgradeEndsAt = null; }
        if (farmUpgradeEndsAt != null && !now.isBefore(farmUpgradeEndsAt)) { farmLevel++; farmUpgradeEndsAt = null; }
        if (ironMineUpgradeEndsAt != null && !now.isBefore(ironMineUpgradeEndsAt)) { ironMineLevel++; ironMineUpgradeEndsAt = null; }
    }

    public void deductBuildingUpgradeCost(long goldCost, long woodCost, long stoneCost, long foodCost, long ironCost) {
        gold -= goldCost; wood -= woodCost; stone -= stoneCost; food -= foodCost; iron -= ironCost;
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
    public int getWoodcutterLevel() { return woodcutterLevel; }
    public int getQuarryLevel() { return quarryLevel; }
    public int getFarmLevel() { return farmLevel; }
    public int getIronMineLevel() { return ironMineLevel; }
    public Instant getWoodcutterUpgradeEndsAt() { return woodcutterUpgradeEndsAt; }
    public Instant getQuarryUpgradeEndsAt() { return quarryUpgradeEndsAt; }
    public Instant getFarmUpgradeEndsAt() { return farmUpgradeEndsAt; }
    public Instant getIronMineUpgradeEndsAt() { return ironMineUpgradeEndsAt; }
    public Instant getCreatedAt() { return createdAt; }
}
