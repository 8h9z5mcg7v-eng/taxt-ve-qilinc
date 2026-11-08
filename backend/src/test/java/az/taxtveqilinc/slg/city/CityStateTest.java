package az.taxtveqilinc.slg.city;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class CityStateTest {
    @Test
    void keepUpgradeDeductsResourcesAndCompletesOnlyAfterDeadline() {
        CityState city = new CityState(UUID.randomUUID(), "Sərkərdə qalası");
        Instant start = city.getLastResourceUpdateAt();
        Instant finish = start.plusSeconds(60);

        city.beginKeepUpgrade(1000, 1400, 1200, 800, 500, finish);

        assertEquals(0, city.getGold());
        assertEquals(100, city.getWood());
        assertEquals(1, city.getKeepLevel());
        assertEquals(finish, city.getKeepUpgradeEndsAt());
        assertFalse(city.completeKeepUpgradeIfReady(finish.minusSeconds(1)));
        assertEquals(1, city.getKeepLevel());
        assertTrue(city.completeKeepUpgradeIfReady(finish));
        assertEquals(2, city.getKeepLevel());
        assertNull(city.getKeepUpgradeEndsAt());
        assertFalse(city.completeKeepUpgradeIfReady(finish.plusSeconds(1)));
    }

    @Test
    void resourcesAccrueWhilePlayerIsOfflineAndRespectStorageCap() {
        CityState city = new CityState(UUID.randomUUID(), "Qala");
        Instant start = city.getLastResourceUpdateAt();

        city.accrueResources(start.plusSeconds(3600));

        assertEquals(1020, city.getGold());
        assertEquals(1545, city.getWood());
        assertEquals(1030, city.getStone());
        assertEquals(2060, city.getFood());
        assertEquals(512, city.getIron());

        city.accrueResources(start.plusSeconds(3600L * 10_000));
        assertEquals(CityState.RESOURCE_CAP, city.getGold());
        assertEquals(CityState.RESOURCE_CAP, city.getWood());
        assertEquals(CityState.RESOURCE_CAP, city.getStone());
        assertEquals(CityState.RESOURCE_CAP, city.getFood());
        assertEquals(CityState.RESOURCE_CAP, city.getIron());
    }

    @Test
    void fractionalProductionIsNotLostAcrossFrequentReads() {
        CityState city = new CityState(UUID.randomUUID(), "Qala");
        Instant start = city.getLastResourceUpdateAt();

        for (int minute = 1; minute <= 60; minute++) {
            city.accrueResources(start.plusSeconds(minute * 60L));
        }

        assertEquals(1020, city.getGold());
        assertEquals(1545, city.getWood());
        assertEquals(1030, city.getStone());
        assertEquals(2060, city.getFood());
        assertEquals(512, city.getIron());
    }

    @Test
    void backwardClockDoesNotReduceResourcesOrMoveTimestampBackwards() {
        CityState city = new CityState(UUID.randomUUID(), "Qala");
        Instant start = city.getLastResourceUpdateAt();

        city.accrueResources(start.plusSeconds(3600));
        city.accrueResources(start.plusSeconds(1200));

        assertEquals(1020, city.getGold());
        assertEquals(start.plusSeconds(3600), city.getLastResourceUpdateAt());
    }
    @Test
    void productionBonusStartsOnlyAfterKeepUpgradeCompletesWhileOffline() {
        CityState city = new CityState(UUID.randomUUID(), "Qala");
        Instant start = city.getLastResourceUpdateAt();
        Instant finish = start.plusSeconds(1800);
        city.beginKeepUpgrade(0, 0, 0, 0, 0, finish);

        city.accrueResources(start.plusSeconds(3600));

        // 30 minutes at level 1 + 30 minutes at level 2 (10% production bonus).
        assertEquals(1021, city.getGold());
        assertEquals(1547, city.getWood());
        assertEquals(1031, city.getStone());
        assertEquals(2063, city.getFood());
        assertEquals(512, city.getIron());
        assertEquals(2, city.getKeepLevel());
        assertNull(city.getKeepUpgradeEndsAt());
    }

    @Test
    void resourceBuildingUpgradeBoostBeginsAtItsCompletionTime() {
        CityState city = new CityState(UUID.randomUUID(), "Qala");
        Instant start = city.getLastResourceUpdateAt();
        Instant finish = start.plusSeconds(1800);
        city.deductBuildingUpgradeCost(0, 0, 0, 0, 0);
        city.startBuildingUpgrade("WOODCUTTER", finish);

        city.accrueResources(start.plusSeconds(3600));

        assertEquals(2, city.getWoodcutterLevel());
        assertNull(city.getWoodcutterUpgradeEndsAt());
        // Half an hour at level 1, then half an hour at level 2 (+25%).
        assertEquals(1550, city.getWood());
    }

}
