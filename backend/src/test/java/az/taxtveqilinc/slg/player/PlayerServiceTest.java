package az.taxtveqilinc.slg.player;

import az.taxtveqilinc.slg.city.CityService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PlayerServiceTest {
    @Test
    void registerNormalizesEmailAndNicknameAndStoresOnlyEncodedPassword() {
        PlayerAccountRepository repository = mock(PlayerAccountRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        CityService cities = mock(CityService.class);
        PlayerAccount saved = mock(PlayerAccount.class);
        UUID playerId = UUID.randomUUID();

        when(repository.save(any(PlayerAccount.class))).thenReturn(saved);
        when(saved.getId()).thenReturn(playerId);
        when(saved.getNickname()).thenReturn("Sərkərdə");
        when(encoder.encode("a-long-password")).thenReturn("bcrypt-hash");

        PlayerService service = new PlayerService(repository, encoder, cities);
        PlayerAccount result = service.register("  PLAYER@EXAMPLE.COM ", " Sərkərdə ", "a-long-password");

        assertSame(saved, result);
        verify(repository).existsByEmailIgnoreCase("player@example.com");
        verify(repository).existsByNicknameIgnoreCase("Sərkərdə");
        verify(repository).save(argThat(account ->
            account.getEmail().equals("player@example.com")
                && account.getNickname().equals("Sərkərdə")
                && account.getPasswordHash().equals("bcrypt-hash")
        ));
        verify(encoder).encode("a-long-password");
        verify(cities).createForPlayer(playerId, "Sərkərdə");
    }

    @Test
    void duplicateEmailPreventsAccountCreation() {
        PlayerAccountRepository repository = mock(PlayerAccountRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        CityService cities = mock(CityService.class);
        when(repository.existsByEmailIgnoreCase("player@example.com")).thenReturn(true);

        PlayerService service = new PlayerService(repository, encoder, cities);
        IllegalArgumentException error = assertThrows(
            IllegalArgumentException.class,
            () -> service.register("PLAYER@example.com", "Sərkərdə", "a-long-password")
        );

        assertEquals("Bu e-poçt artıq qeydiyyatdan keçib.", error.getMessage());
        verify(repository, never()).save(any());
        verifyNoInteractions(encoder, cities);
    }

    @Test
    void duplicateNicknamePreventsAccountCreation() {
        PlayerAccountRepository repository = mock(PlayerAccountRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        CityService cities = mock(CityService.class);
        when(repository.existsByNicknameIgnoreCase("Sərkərdə")).thenReturn(true);

        PlayerService service = new PlayerService(repository, encoder, cities);
        IllegalArgumentException error = assertThrows(
            IllegalArgumentException.class,
            () -> service.register("player@example.com", " Sərkərdə ", "a-long-password")
        );

        assertEquals("Bu oyunçu adı artıq istifadə olunur.", error.getMessage());
        verify(repository, never()).save(any());
        verifyNoInteractions(encoder, cities);
    }

    @Test
    void loginUsesPasswordEncoderAndReturnsPlayer() {
        PlayerAccountRepository repository = mock(PlayerAccountRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        CityService cities = mock(CityService.class);
        PlayerAccount player = new PlayerAccount("player@example.com", "Sərkərdə", "stored-hash");
        when(repository.findByEmailIgnoreCase("player@example.com")).thenReturn(Optional.of(player));
        when(encoder.matches("a-long-password", "stored-hash")).thenReturn(true);

        PlayerService service = new PlayerService(repository, encoder, cities);
        assertSame(player, service.authenticate(" player@example.com ", "a-long-password"));
    }

    @Test
    void loginRejectsWrongPasswordWithGenericMessage() {
        PlayerAccountRepository repository = mock(PlayerAccountRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        CityService cities = mock(CityService.class);
        PlayerAccount player = new PlayerAccount("player@example.com", "Sərkərdə", "stored-hash");
        when(repository.findByEmailIgnoreCase("player@example.com")).thenReturn(Optional.of(player));
        when(encoder.matches("wrong-password", "stored-hash")).thenReturn(false);

        PlayerService service = new PlayerService(repository, encoder, cities);
        BadCredentialsException error = assertThrows(
            BadCredentialsException.class,
            () -> service.authenticate("player@example.com", "wrong-password")
        );

        assertEquals("E-poçt və ya şifrə yanlışdır.", error.getMessage());
    }
}
