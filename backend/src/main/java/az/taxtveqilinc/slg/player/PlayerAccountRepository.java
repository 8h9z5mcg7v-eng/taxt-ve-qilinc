package az.taxtveqilinc.slg.player;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PlayerAccountRepository extends JpaRepository<PlayerAccount, UUID> {
    boolean existsByNicknameIgnoreCase(String nickname);
}