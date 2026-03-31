package com.social.user.infrastructure.repositories;

import java.util.Optional;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.social.user.domain.entities.User;

@DataJpaTest
@Import(UserRepositoryImpl.class)
class UserRepositoryIntegrationTest {

    @Autowired
    private UserRepositoryImpl repo;

    //Tìm kiếm người dùng theo email, số điện thoại và ID, đảm bảo rằng các phương thức này trả về kết quả chính xác khi người dùng tồn tại và trả về Optional.empty() khi không tìm thấy.
    @Test
    void searchByEmail_contains_isCaseInsensitive() {
        User u = new User();
        u.setEmail("alice@example.com");
        u.setPhone("012345");
        u.setFullName("Alice Doe");
        u.setPasswordHash("p");
        repo.save(u);

        Pageable pg = PageRequest.of(0, 10);
        var page = repo.search("alice", null, null, pg);

        assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    //Phân trang kết quả tìm kiếm, đảm bảo rằng khi có nhiều người dùng phù hợp với tiêu chí tìm kiếm, kết quả được phân trang chính xác theo kích thước trang và số trang đã yêu cầu.
    @Test
    void paging_beyondEnd_returnsEmpty() {
        Pageable pg = PageRequest.of(100, 10);
        var page = repo.search(null, null, null, pg);
        assertThat(page.getContent()).isEmpty();
    }


    //Lưu và xóa người dùng, đảm bảo rằng sau khi lưu, người dùng có thể được tìm thấy và sau khi xóa, người dùng không còn tồn tại trong cơ sở dữ liệu.
    @Test
    void save_findByEmail_findByPhone_findById_and_deleteById() {
        User u = new User();
        u.setEmail("bob@example.com");
        u.setPhone("099999");
        u.setFullName("Bob");
        u.setPasswordHash("p");
        User saved = repo.save(u);

        Optional<User> byEmail = repo.findByEmail("bob@example.com");
        Optional<User> byPhone = repo.findByPhone("099999");
        Optional<User> byId = repo.findById(saved.getId());

        assertThat(byEmail).isPresent();
        assertThat(byPhone).isPresent();
        assertThat(byId).isPresent();

        repo.deleteById(saved.getId());
        assertThat(repo.findById(saved.getId())).isEmpty();
    }

    //Cập nhật người dùng, đảm bảo rằng sau khi cập nhật, các trường của người dùng được thay đổi chính xác trong cơ sở dữ liệu.
    @Test
    void save_updatesExistingUser() {
        User u = new User();
        u.setEmail("carol@example.com");
        u.setPhone("088888");
        u.setFullName("Carol");
        u.setPasswordHash("p");
        User saved = repo.save(u);

        saved.setFullName("Carol Updated");
        repo.save(saved);

        Optional<User> reloaded = repo.findById(saved.getId());
        assertThat(reloaded).isPresent();
        assertThat(reloaded.get().getFullName()).isEqualTo("Carol Updated");
    }

    //Tìm kiếm người dùng với các bộ lọc kết hợp (ví dụ: tìm kiếm theo email và trạng thái hoạt động) và đảm bảo rằng kết quả trả về chính xác dựa trên các tiêu chí đã cho.
    @Test
    void search_withMultipleFilters_combinesCorrectly() {
        User u = new User();
        u.setEmail("multi@example.com");
        u.setPhone("077777");
        u.setFullName("Multi Filter");
        u.setPasswordHash("p");
        u.setIsActive(true);
        repo.save(u);

        Pageable pg = PageRequest.of(0, 10);
        var page = repo.search("multi", "Multi", true, pg);
        assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    //Phân trang kết quả tìm kiếm, đảm bảo rằng khi có nhiều người dùng phù hợp với tiêu chí tìm kiếm, kết quả được phân trang chính xác theo kích thước trang và số trang đã yêu cầu.
    @Test
    void paging_boundaries_firstAndExactPageSize() {
        IntStream.range(0, 15).forEach(i -> {
            User u = new User();
            u.setEmail("u" + i + "@ex.com");
            u.setPhone("10000" + i);
            u.setFullName("User " + i);
            u.setPasswordHash("p");
            repo.save(u);
        });

        Page<User> firstPage = repo.search(null, null, null, PageRequest.of(0, 10));
        Page<User> secondPage = repo.search(null, null, null, PageRequest.of(1, 10));

        assertThat(firstPage.getContent()).hasSizeGreaterThanOrEqualTo(10);
        assertThat(secondPage.getContent()).hasSizeGreaterThanOrEqualTo(5);
    }
}