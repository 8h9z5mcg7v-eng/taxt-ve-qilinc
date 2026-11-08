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
        city.completeKeepUpgradeIfReady(Instant.now());
        return city;
    }

    @Transactional
    public CityState startKeepUpgrade(UUID playerId) {
        CityState city = repository.findByPlayerIdForUpdate(playerId)
            .orElseThrow(() -> new IllegalArgumentException("Oyunçu şəhəri tapılmadı."));
        Instant now = Instant.now();
        city.completeKeepUpgradeIfReady(now);

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
