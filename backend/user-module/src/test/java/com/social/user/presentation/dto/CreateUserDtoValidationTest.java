package com.social.user.presentation.dto;

import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

class CreateUserDtoValidationTest {

    private static ValidatorFactory vf;
    private static Validator validator;

    @BeforeAll
    static void setup() {
        vf = Validation.buildDefaultValidatorFactory();
        validator = vf.getValidator();
    }

    @AfterAll
    static void tearDown() {
        vf.close();
    }

    // Kiểm tra rằng nếu tất cả các trường đều hợp lệ, thì không có lỗi nào được trả về.
    @Test
    void invalidPhoneAndPassword_shouldFailValidation() {
        CreateUserDto dto = new CreateUserDto();
        dto.setEmail("ok@example.com");
        dto.setPhone("01");
        dto.setPassword("123");
        dto.setFullName("Some Name");

        Set<ConstraintViolation<CreateUserDto>> violations = validator.validate(dto);
        Set<String> props = violations.stream().map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet());

        assertThat(props).contains("phone", "password");
    }

    // Kiểm tra rằng nếu email không đúng định dạng, thì lỗi sẽ được trả về cho trường email.
    @Test
    void validDto_hasNoViolations() {
        CreateUserDto dto = new CreateUserDto();
        dto.setEmail("ok@example.com");
        dto.setPhone("012345");
        dto.setPassword("strongpassword");
        dto.setFullName("Valid User");

        Set<ConstraintViolation<CreateUserDto>> violations = validator.validate(dto);
        assertThat(violations).isEmpty();
    }

    // Kiểm tra rằng nếu fullName là chuỗi rỗng hoặc chỉ chứa khoảng trắng, thì lỗi sẽ được trả về cho trường fullName.
    @Test
    void invalidEmail_shouldFailValidation() {
        CreateUserDto dto = new CreateUserDto();
        dto.setEmail("not-an-email");
        dto.setPhone("012345");
        dto.setPassword("strongpassword");
        dto.setFullName("Valid User");

        Set<ConstraintViolation<CreateUserDto>> violations = validator.validate(dto);
        Set<String> props = violations.stream().map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet());
        assertThat(props).contains("email");
    }

    // Kiểm tra rằng nếu phone có độ dài nhỏ hơn 6 hoặc lớn hơn 20, thì lỗi sẽ được trả về cho trường phone, và nếu password có độ dài nhỏ hơn 6, thì lỗi sẽ được trả về cho trường password.
    @Test
    void fullNameBlank_orWhitespace_shouldFailValidation() {
        CreateUserDto dto1 = new CreateUserDto();
        dto1.setEmail("ok@example.com");
        dto1.setPhone("012345");
        dto1.setPassword("strongpassword");
        dto1.setFullName("");
        Set<String> props1 = validator.validate(dto1).stream().map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet());
        assertThat(props1).contains("fullName");

        CreateUserDto dto2 = new CreateUserDto();
        dto2.setEmail("ok@example.com");
        dto2.setPhone("012345");
        dto2.setPassword("strongpassword");
        dto2.setFullName("   ");
        Set<String> props2 = validator.validate(dto2).stream().map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet());
        assertThat(props2).contains("fullName");
    }

    // Kiểm tra rằng nếu phone có độ dài nhỏ hơn 6 hoặc lớn hơn 20, thì lỗi sẽ được trả về cho trường phone, và nếu password có độ dài nhỏ hơn 6, thì lỗi sẽ được trả về cho trường password.
    @Test
    void phoneLengthBoundaries_and_passwordBoundaries() {

        CreateUserDto p1 = new CreateUserDto();
        p1.setEmail("ok@example.com"); p1.setPhone("12345"); p1.setPassword("strongpwd"); p1.setFullName("X");
        assertThat(validator.validate(p1).stream().map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet())).contains("phone");
        CreateUserDto p2 = new CreateUserDto();
        
        p2.setEmail("ok@example.com"); p2.setPhone("123456"); p2.setPassword("strongpwd"); p2.setFullName("X");
        assertThat(validator.validate(p2)).isEmpty();

        CreateUserDto p3 = new CreateUserDto();
        p3.setEmail("ok@example.com"); p3.setPhone("1".repeat(21)); p3.setPassword("strongpwd"); p3.setFullName("X");
        assertThat(validator.validate(p3).stream().map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet())).contains("phone");

        CreateUserDto pw1 = new CreateUserDto();
        pw1.setEmail("ok@example.com"); pw1.setPhone("012345"); pw1.setPassword("12345"); pw1.setFullName("X");
        assertThat(validator.validate(pw1).stream().map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet())).contains("password");

        CreateUserDto pw2 = new CreateUserDto();
        pw2.setEmail("ok@example.com"); pw2.setPhone("012345"); pw2.setPassword("123456"); pw2.setFullName("X");
        assertThat(validator.validate(pw2)).isEmpty();
    }

    // Kiểm tra rằng nếu các trường optional như bio, avatar, cover, role được để trống hoặc null, thì không có lỗi nào được trả về vì chúng là optional.
    @Test
    void optionalFields_canBeNull() {
        CreateUserDto dto = new CreateUserDto();
        dto.setEmail("ok@example.com");
        dto.setPhone("012345");
        dto.setPassword("strongpassword");
        dto.setFullName("Valid User");
        Set<ConstraintViolation<CreateUserDto>> violations = validator.validate(dto);
        assertThat(violations).isEmpty();
    }
}