package az.taxtveqilinc.slg.city;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CityServiceTest {
    @Test
    void buildingCannotOutlevelKeep() {
        CityState city = new CityState(UUID.randomUUID(), "Qala");
        CityStateRepository repository = mock(CityStateRepository.class);
        when(repository.findByPlayerIdForUpdate(any())).thenReturn(Optional.of(city));
        CityService service = new CityService(repository);

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
            () -> service.startBuildingUpgrade(city.getPlayerId(), "WOODCUTTER"));

        assertTrue(error.getMessage().contains("Baş Qalanı"));
        assertEquals(1, city.getWoodcutterLevel());
        assertNull(city.getWoodcutterUpgradeEndsAt());
        assertEquals(1000, city.getGold());
    }

    @Test
    void buildingUpgradeCanStartAfterKeepUpgradeHasCompleted() {
        CityState city = new CityState(UUID.randomUUID(), "Qala");
        city.beginKeepUpgrade(0, 0, 0, 0, 0, Instant.now().minusSeconds(1));
        CityStateRepository repository = mock(CityStateRepository.class);
        when(repository.findByPlayerIdForUpdate(any())).thenReturn(Optional.of(city));
        CityService service = new CityService(repository);

        CityState updated = service.startBuildingUpgrade(city.getPlayerId(), "WOODCUTTER");

        assertEquals(2, updated.getKeepLevel());
        assertEquals(1, updated.getWoodcutterLevel());
        assertNotNull(updated.getWoodcutterUpgradeEndsAt());
        assertEquals(800, updated.getGold());
        assertEquals(1000, updated.getWood());
        assertEquals(700, updated.getStone());
        assertEquals(1800, updated.getFood());
        assertEquals(400, updated.getIron());
    }
}
