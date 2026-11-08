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

    @Test
    void sameBuildingCannotBeUpgradedTwiceAtTheSameTime() {
        CityStateRepository repository = mock(CityStateRepository.class);
        UUID playerId = UUID.randomUUID();
        CityState city = new CityState(playerId, "Sərkərdə qalası");
        city.beginKeepUpgrade(0, 0, 0, 0, 0, java.time.Instant.now().minusSeconds(1));
        city.startBuildingUpgrade("WOODCUTTER", java.time.Instant.now().plusSeconds(300));
        when(repository.findByPlayerIdForUpdate(playerId)).thenReturn(Optional.of(city));
        CityService service = new CityService(repository);

        long goldBefore = city.getGold();
        long woodBefore = city.getWood();
        long stoneBefore = city.getStone();
        long foodBefore = city.getFood();
        long ironBefore = city.getIron();
        java.time.Instant finishBefore = city.getWoodcutterUpgradeEndsAt();

        IllegalArgumentException error = assertThrows(
            IllegalArgumentException.class,
            () -> service.startBuildingUpgrade(playerId, "WOODCUTTER")
        );

        assertEquals("Bu binanın təkmilləşdirilməsi artıq davam edir.", error.getMessage());
        assertEquals(2, city.getKeepLevel());
        assertEquals(1, city.getWoodcutterLevel());
        assertEquals(finishBefore, city.getWoodcutterUpgradeEndsAt());
        assertEquals(goldBefore, city.getGold());
        assertEquals(woodBefore, city.getWood());
        assertEquals(stoneBefore, city.getStone());
        assertEquals(foodBefore, city.getFood());
        assertEquals(ironBefore, city.getIron());
        verify(repository).findByPlayerIdForUpdate(playerId);
    }

    @Test
    void buildingUpgradeDeductsServerCalculatedCostAndSchedulesCompletion() {
        CityStateRepository repository = mock(CityStateRepository.class);
        UUID playerId = UUID.randomUUID();
        CityState city = new CityState(playerId, "Sərkərdə qalası");
        city.beginKeepUpgrade(0, 0, 0, 0, 0, java.time.Instant.now().minusSeconds(1));
        when(repository.findByPlayerIdForUpdate(playerId)).thenReturn(Optional.of(city));
        CityService service = new CityService(repository);

        long goldBefore = city.getGold();
        long woodBefore = city.getWood();
        long stoneBefore = city.getStone();
        long foodBefore = city.getFood();
        long ironBefore = city.getIron();

        CityState result = service.startBuildingUpgrade(playerId, "WOODCUTTER");

        assertSame(city, result);
        assertEquals(2, city.getKeepLevel());
        assertEquals(1, city.getWoodcutterLevel(), "The building level changes only after its timer completes.");
        assertNotNull(city.getWoodcutterUpgradeEndsAt());
        assertTrue(city.getWoodcutterUpgradeEndsAt().isAfter(java.time.Instant.now()));
        assertEquals(goldBefore - 200, city.getGold());
        assertEquals(woodBefore - 500, city.getWood());
        assertEquals(stoneBefore - 300, city.getStone());
        assertEquals(foodBefore - 200, city.getFood());
        assertEquals(ironBefore - 100, city.getIron());
        verify(repository).findByPlayerIdForUpdate(playerId);
    }
}
