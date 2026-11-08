package az.taxtveqilinc.slg.city;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class CityService {
    private final CityStateRepository repository;

    public CityService(CityStateRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public CityState createForPlayer(UUID playerId, String nickname) {
        return repository.save(new CityState(playerId, nickname + " qalası"));
    }

    @Transactional(readOnly = true)
    public CityState getForPlayer(UUID playerId) {
        return repository.findByPlayerId(playerId)
            .orElseThrow(() -> new IllegalArgumentException("Oyunçu şəhəri tapılmadı."));
    }
}