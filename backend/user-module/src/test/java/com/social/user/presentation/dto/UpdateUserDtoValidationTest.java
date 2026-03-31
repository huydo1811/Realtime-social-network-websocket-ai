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

class UpdateUserDtoValidationTest {

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

    //Kiểm tra rằng nếu fullName là chuỗi rỗng hoặc chỉ chứa khoảng trắng, thì lỗi sẽ được trả về cho trường fullName.
    @Test
    void emptyFullName_okIfOptional() {
        UpdateUserDto dto = new UpdateUserDto();
        Set<ConstraintViolation<UpdateUserDto>> violations = validator.validate(dto);
        assertThat(violations).isEmpty();
    }

    // Kiểm tra rằng nếu phone có độ dài nhỏ hơn 6 hoặc lớn hơn 20, thì lỗi sẽ được trả về cho trường phone.
    @Test
    void invalidPhone_onUpdate_shouldFail() {
        UpdateUserDto dto = new UpdateUserDto();
        dto.setPhone("0");
        Set<ConstraintViolation<UpdateUserDto>> violations = validator.validate(dto);
        assertThat(violations).isNotEmpty();
    }

    // Kiểm tra rằng nếu email không hợp lệ, thì lỗi sẽ được trả về cho trường email.
    @Test
    void invalidEmail_shouldFail() {
        UpdateUserDto dto = new UpdateUserDto();
        dto.setEmail("not-an-email");
        Set<String> props = validator.validate(dto).stream().map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet());
        assertThat(props).contains("email");
    }

    // Kiểm tra phone ở ranh giới 6 và 20 ký tự, đảm bảo rằng 6 ký tự là hợp lệ và 21 ký tự là không hợp lệ.
    @Test
    void phoneBoundary_checks() {
        UpdateUserDto p1 = new UpdateUserDto();
        p1.setPhone("12345");
        assertThat(validator.validate(p1).stream().map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet())).contains("phone");

        UpdateUserDto p2 = new UpdateUserDto();
        p2.setPhone("123456");
        assertThat(validator.validate(p2)).isEmpty();

        UpdateUserDto p3 = new UpdateUserDto();
        p3.setPhone("1".repeat(21));
        assertThat(validator.validate(p3).stream().map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet())).contains("phone");
    }

    //Kiểm tra email và phone có thể null khi cập nhật, đảm bảo rằng nếu chúng không được cung cấp, thì không có lỗi nào được trả về.
    @Test
    void emailAndPhone_canBeNull_onUpdate() {
        UpdateUserDto dto = new UpdateUserDto();
        dto.setFullName("Some");
        Set<ConstraintViolation<UpdateUserDto>> violations = validator.validate(dto);
        assertThat(violations).isEmpty();
    }

    //Kiểm tra rằng nếu tất cả các trường đều hợp lệ, thì không có lỗi nào được trả về.
    @Test
    void validUpdate_withAllFields_shouldPass() {
        UpdateUserDto dto = new UpdateUserDto();
        dto.setEmail("ok@example.com");
        dto.setPhone("012345");
        dto.setFullName("Updated Name");
        dto.setBio("bio");
        dto.setAvatarUrl("a.png");
        dto.setCoverUrl("c.png");
        dto.setRole("USER");
        dto.setIsActive(Boolean.TRUE);
        Set<ConstraintViolation<UpdateUserDto>> violations = validator.validate(dto);
        assertThat(violations).isEmpty();
    }

    //Kiểm tra rằng trường isActive có thể nhận giá trị true, false
    @Test
    void isActive_trueFalseAndNull_allowed() {
        UpdateUserDto t1 = new UpdateUserDto(); t1.setIsActive(Boolean.TRUE);
        UpdateUserDto t2 = new UpdateUserDto(); t2.setIsActive(Boolean.FALSE);
        UpdateUserDto t3 = new UpdateUserDto(); 
        assertThat(validator.validate(t1)).isEmpty();
        assertThat(validator.validate(t2)).isEmpty();
        assertThat(validator.validate(t3)).isEmpty();
    }
}