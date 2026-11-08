package az.taxtveqilinc.slg.city;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class CityStateTest {
    @Test
    void keepUpgradeDeductsResourcesAndCompletesOnlyAfterDeadline() {
        CityState city = new CityState(UUID.randomUUID(), "Sərkərdə qalası");
        Instant start = Instant.parse("2026-01-01T00:00:00Z");
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
}
