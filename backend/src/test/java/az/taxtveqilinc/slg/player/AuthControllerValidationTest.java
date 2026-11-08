package az.taxtveqilinc.slg.player;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuthControllerValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void registerRejectsPasswordLongerThanBcryptUtf8ByteLimit() {
        var request = new AuthController.RegisterRequest(
            "player@example.com", "Sərkərdə", "ə".repeat(40)
        );

        var violations = validator.validate(request);

        assertTrue(violations.stream().anyMatch(v ->
            v.getPropertyPath().toString().equals("passwordWithinBcryptLimit")
        ));
    }

    @Test
    void loginRejectsPasswordLongerThanBcryptUtf8ByteLimit() {
        var request = new AuthController.LoginRequest(
            "player@example.com", "ə".repeat(40)
        );

        var violations = validator.validate(request);

        assertTrue(violations.stream().anyMatch(v ->
            v.getPropertyPath().toString().equals("passwordWithinBcryptLimit")
        ));
    }

    @Test
    void asciiPasswordWithinBcryptLimitPassesByteCheck() {
        var request = new AuthController.RegisterRequest(
            "player@example.com", "Sərkərdə", "a-long-password"
        );

        assertTrue(validator.validate(request).stream().noneMatch(v ->
            v.getPropertyPath().toString().equals("passwordWithinBcryptLimit")
        ));
    }
}
