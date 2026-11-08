package az.taxtveqilinc.slg.player;

import az.taxtveqilinc.slg.city.CityService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.util.Locale;

@Service
public class PlayerService {
    private final PlayerAccountRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final CityService cityService;

    public PlayerService(PlayerAccountRepository repository, PasswordEncoder passwordEncoder, CityService cityService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.cityService = cityService;
    }

    @Transactional
    public PlayerAccount register(String email, String nickname, String rawPassword) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        String normalizedNickname = nickname.trim();
        if (repository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Bu e-poçt artıq qeydiyyatdan keçib.");
        }
        if (repository.existsByNicknameIgnoreCase(normalizedNickname)) {
            throw new IllegalArgumentException("Bu oyunçu adı artıq istifadə olunur.");
        }
        PlayerAccount player = repository.save(new PlayerAccount(
            normalizedEmail, normalizedNickname, passwordEncoder.encode(rawPassword)
        ));
        cityService.createForPlayer(player.getId(), player.getNickname());
        return player;
    }

    @Transactional(readOnly = true)
    public PlayerAccount authenticate(String email, String rawPassword) {
        PlayerAccount player = repository.findByEmailIgnoreCase(email.trim())
            .orElseThrow(() -> new BadCredentialsException("E-poçt və ya şifrə yanlışdır."));
        if (!passwordEncoder.matches(rawPassword, player.getPasswordHash())) {
            throw new BadCredentialsException("E-poçt və ya şifrə yanlışdır.");
        }
        return player;
    }

    @Transactional(readOnly = true)
    public PlayerAccount getById(UUID id) {
        return repository.findById(id)
            .orElseThrow(() -> new BadCredentialsException("Oyunçu hesabı tapılmadı."));
    }

    @Transactional
    public PlayerAccount create(String nickname) {
        String normalized = nickname.trim();
        if (repository.existsByNicknameIgnoreCase(normalized)) {
            throw new IllegalArgumentException("Bu oyunçu adı artıq istifadə olunur.");
        }
        throw new IllegalStateException("Şifrəsiz oyunçu hesabı yaratmaq deaktiv edilib.");
    }
}