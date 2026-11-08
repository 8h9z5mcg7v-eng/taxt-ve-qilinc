package az.taxtveqilinc.slg.city;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

public interface CityStateRepository extends JpaRepository<CityState, UUID> {
    Optional<CityState> findByPlayerId(UUID playerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CityState c where c.playerId = :playerId")
    Optional<CityState> findByPlayerIdForUpdate(@Param("playerId") UUID playerId);
}
