package az.taxtveqilinc.slg.player;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlayerService {
    private final PlayerAccountRepository repository;

    public PlayerService(PlayerAccountRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public PlayerAccount create(String nickname) {
        String normalized = nickname.trim();
        if (repository.existsByNicknameIgnoreCase(normalized)) {
            throw new IllegalArgumentException("Bu oyunçu adı artıq istifadə olunur.");
        }
        return repository.save(new PlayerAccount(normalized));
    }
}