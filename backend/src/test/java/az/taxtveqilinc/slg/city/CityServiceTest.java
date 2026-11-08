package az.taxtveqilinc.slg.city;

import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CityServiceTest {
    @Test
    void resourceBuildingCannotOutlevelKeepAndDoesNotSpendResources() {
        CityStateRepository repository = mock(CityStateRepository.class);
        UUID playerId = UUID.randomUUID();
        CityState city = new CityState(playerId, "Sərkərdə qalası");
        when(repository.findByPlayerIdForUpdate(playerId)).thenReturn(Optional.of(city));
        CityService service = new CityService(repository);

        long goldBefore = city.getGold();
        long woodBefore = city.getWood();
        long stoneBefore = city.getStone();
        long foodBefore = city.getFood();
        long ironBefore = city.getIron();

        IllegalArgumentException error = assertThrows(
            IllegalArgumentException.class,
            () -> service.startBuildingUpgrade(playerId, "WOODCUTTER")
        );

        assertEquals("Bu binanın növbəti səviyyəsi üçün əvvəlcə Baş Qalanı yüksəlt.", error.getMessage());
        assertEquals(1, city.getKeepLevel());
        assertEquals(1, city.getWoodcutterLevel());
        assertNull(city.getWoodcutterUpgradeEndsAt());
        assertEquals(goldBefore, city.getGold());
        assertEquals(woodBefore, city.getWood());
        assertEquals(stoneBefore, city.getStone());
        assertEquals(foodBefore, city.getFood());
        assertEquals(ironBefore, city.getIron());
        verify(repository).findByPlayerIdForUpdate(playerId);
    }
}
