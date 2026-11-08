package az.taxtveqilinc.slg.player;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface PlayerAccountRepository extends JpaRepository<PlayerAccount, UUID> {
    boolean existsByNicknameIgnoreCase(String nickname);
    boolean existsByEmailIgnoreCase(String email);
    Optional<PlayerAccount> findByEmailIgnoreCase(String email);
}