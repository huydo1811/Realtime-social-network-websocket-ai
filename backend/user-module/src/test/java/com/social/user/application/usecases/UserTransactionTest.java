package com.social.user.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.support.TransactionTemplate;

import com.social.user.domain.entities.User;
import com.social.user.infrastructure.repositories.JpaUserRepository;

@SpringBootTest
class UserTransactionTest {

    @Autowired
    private JpaUserRepository userRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void cleanup() {
        userRepository.deleteAll();
    }

    // Kiểm tra rằng khi một RuntimeException được ném ra trong một giao dịch, tất cả các thay đổi trong giao dịch đó sẽ bị rollback và không ảnh hưởng đến trạng thái của cơ sở dữ liệu.
    @Test
    void runtimeExceptionInTransaction_shouldRollbackChanges() {
        User u1 = new User();
        u1.setEmail("persisted@example.com");
        u1.setPhone("0910000001");
        userRepository.saveAndFlush(u1);

        long before = userRepository.count();

        RuntimeException thrown = assertThrows(RuntimeException.class, () ->
            transactionTemplate.execute(status -> {
                User u2 = new User();
                u2.setEmail("rolledback@example.com");
                u2.setPhone("0910000002");
                userRepository.saveAndFlush(u2);
                throw new RuntimeException("forced rollback");
            })
        );

        assertThat(thrown).hasMessageContaining("forced rollback");
        assertThat(userRepository.count()).isEqualTo(before);
        assertThat(userRepository.findAll())
            .extracting(User::getEmail)
            .doesNotContain("rolledback@example.com");
    }
}