package com.social.user.infrastructure.repositories;

import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import com.social.user.domain.entities.User;

@DataJpaTest
class UserRepositoryConstraintsTest {

    @Autowired
    private JpaUserRepository userRepository;

    @Test
    void savingTwoUsersWithSamePhone_shouldThrowDataIntegrityViolation() {
        User u1 = new User();
        u1.setEmail("unique1@example.com");
        u1.setPhone("0900000001");
        userRepository.saveAndFlush(u1);

        User u2 = new User();
        u2.setEmail("unique2@example.com");
        u2.setPhone("0900000001"); 

        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.saveAndFlush(u2);
        });
    }

    @Test
    void savingTwoUsersWithSameEmail_shouldThrowDataIntegrityViolation() {
        User u1 = new User();
        u1.setEmail("dup@example.com");
        u1.setPhone("0900000002");
        userRepository.saveAndFlush(u1);

        User u2 = new User();
        u2.setEmail("dup@example.com"); 
        u2.setPhone("0900000003");

        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.saveAndFlush(u2);
        });
    }
}