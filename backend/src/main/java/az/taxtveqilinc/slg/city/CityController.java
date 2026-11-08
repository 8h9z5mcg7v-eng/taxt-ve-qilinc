package az.taxtveqilinc.slg.city;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/city")
public class CityController {
    private final CityService cities;

    public CityController(CityService cities) {
        this.cities = cities;
    }

    public record CityResponse(UUID id, String cityName, int keepLevel,
                               long gold, long wood, long stone, long food, long iron,
                               Instant keepUpgradeEndsAt, Instant createdAt) {
        static CityResponse from(CityState city) {
            return new CityResponse(city.getId(), city.getCityName(), city.getKeepLevel(),
                city.getGold(), city.getWood(), city.getStone(), city.getFood(), city.getIron(),
                city.getKeepUpgradeEndsAt(), city.getCreatedAt());
        }
    }

    @GetMapping
    public CityResponse getMyCity(Authentication authentication) {
        UUID playerId = (UUID) authentication.getPrincipal();
        return CityResponse.from(cities.getForPlayer(playerId));
    }

    @PostMapping("/keep/upgrade")
    public CityResponse upgradeKeep(Authentication authentication) {
        UUID playerId = (UUID) authentication.getPrincipal();
        return CityResponse.from(cities.startKeepUpgrade(playerId));
    }
}
