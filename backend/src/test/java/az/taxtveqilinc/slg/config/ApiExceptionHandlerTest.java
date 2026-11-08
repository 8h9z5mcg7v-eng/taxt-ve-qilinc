package az.taxtveqilinc.slg.config;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.junit.jupiter.api.Assertions.*;

class ApiExceptionHandlerTest {
    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void validationErrorsReturnFieldSpecificSafeMessage() {
        Object target = new Object();
        BeanPropertyBindingResult binding = new BeanPropertyBindingResult(target, "request");
        binding.addError(new FieldError("request", "email", "düzgün e-poçt daxil edin"));
        MethodArgumentNotValidException exception =
            new MethodArgumentNotValidException(null, binding);

        assertEquals("email: düzgün e-poçt daxil edin",
            handler.invalidRequest(exception).get("error"));
    }

    @Test
    void databaseUniquenessRaceReturnsGenericConflictMessage() {
        DataIntegrityViolationException exception =
            new DataIntegrityViolationException("private database constraint detail");

        String message = handler.duplicateConstraint(exception).get("error");
        assertTrue(message.contains("artıq istifadə olunur"));
        assertFalse(message.contains("private database"));
    }
}
