package az.taxtveqilinc.slg.city;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class CityService {
    public static final int MAX_KEEP_LEVEL = 30;
    private final CityStateRepository repository;

    public CityService(CityStateRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public CityState createForPlayer(UUID playerId, String nickname) {
        return repository.save(new CityState(playerId, nickname + " qalası"));
    }

    @Transactional
    public CityState getForPlayer(UUID playerId) {
        CityState city = repository.findByPlayerIdForUpdate(playerId)
            .orElseThrow(() -> new IllegalArgumentException("Oyunçu şəhəri tapılmadı."));
        Instant now = Instant.now();
        city.accrueResources(now);
        city.completeKeepUpgradeIfReady(now);
        city.completeBuildingUpgrades(now);
        return city;
    }


    @Transactional
    public CityState startBuildingUpgrade(UUID playerId, String building) {
        CityState city = repository.findByPlayerIdForUpdate(playerId)
            .orElseThrow(() -> new IllegalArgumentException("Oyunçu şəhəri tapılmadı."));
        Instant now = Instant.now();
        city.accrueResources(now);
        city.completeKeepUpgradeIfReady(now);
        city.completeBuildingUpgrades(now);

        int currentLevel = city.getBuildingLevel(building);
        if (currentLevel >= 20) throw new IllegalArgumentException("Bu bina maksimum səviyyəyə çatıb.");
        if (city.getBuildingUpgradeEndsAt(building) != null)
            throw new IllegalArgumentException("Bu binanın təkmilləşdirilməsi artıq davam edir.");

        int target = currentLevel + 1;
        long gold = 100L * target;
        long wood = 250L * target;
        long stone = 150L * target;
        long food = 100L * target;
        long iron = 50L * target;
        if (city.getGold() < gold || city.getWood() < wood || city.getStone() < stone
                || city.getFood() < food || city.getIron() < iron)
            throw new IllegalArgumentException("Binanı təkmilləşdirmək üçün resurslar kifayət etmir.");

        city.deductBuildingUpgradeCost(gold, wood, stone, food, iron);
        city.startBuildingUpgrade(building, now.plus(Duration.ofSeconds(20L * target)));
        return city;
    }

    @Transactional
    public CityState startKeepUpgrade(UUID playerId) {
        CityState city = repository.findByPlayerIdForUpdate(playerId)
            .orElseThrow(() -> new IllegalArgumentException("Oyunçu şəhəri tapılmadı."));
        Instant now = Instant.now();
        city.accrueResources(now);
        city.completeKeepUpgradeIfReady(now);
        city.completeBuildingUpgrades(now);

        if (city.getKeepUpgradeEndsAt() != null) {
            throw new IllegalArgumentException("Qala təkmilləşdirilməsi artıq davam edir.");
        }
        if (city.getKeepLevel() >= MAX_KEEP_LEVEL) {
            throw new IllegalArgumentException("Qala maksimum səviyyəyə çatıb.");
        }

        int targetLevel = city.getKeepLevel() + 1;
        long gold = 500L * targetLevel;
        long wood = 700L * targetLevel;
        long stone = 600L * targetLevel;
        long food = 400L * targetLevel;
        long iron = 250L * targetLevel;

        if (city.getGold() < gold || city.getWood() < wood || city.getStone() < stone
                || city.getFood() < food || city.getIron() < iron) {
            throw new IllegalArgumentException("Qalanı yüksəltmək üçün resurslar kifayət etmir.");
        }

        // Development balance: 30 seconds per target level. Production timing will be tuned later.
        Instant finishAt = now.plus(Duration.ofSeconds(30L * targetLevel));
        city.beginKeepUpgrade(gold, wood, stone, food, iron, finishAt);
        return city;
    }
}
