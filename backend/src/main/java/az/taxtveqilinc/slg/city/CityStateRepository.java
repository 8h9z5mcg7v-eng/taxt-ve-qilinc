package az.taxtveqilinc.slg.city;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface CityStateRepository extends JpaRepository<CityState, UUID> {
    Optional<CityState> findByPlayerId(UUID playerId);
}