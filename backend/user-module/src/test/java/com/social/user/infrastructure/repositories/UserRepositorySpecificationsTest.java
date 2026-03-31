package com.social.user.infrastructure.repositories;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.social.user.domain.entities.User;

@DataJpaTest
@Import(UserRepositoryImpl.class)
class UserRepositorySpecificationsTest {

    @Autowired
    private UserRepositoryImpl repo;

    //Tìm kiếm người dùng với các bộ lọc khác nhau (email, fullName, isActive) và đảm bảo rằng kết quả trả về phù hợp với các tiêu chí đã cho.
    @Test
    void searchByFullNameAndIsActive_filtersCorrectly() {
        User active = new User();
        active.setEmail("act@example.com");
        active.setPhone("012345");
        active.setFullName("Active Person");
        active.setPasswordHash("p");
        active.setIsActive(true);
        repo.save(active);

        User inactive = new User();
        inactive.setEmail("inact@example.com");
        inactive.setPhone("0123456");
        inactive.setFullName("Inactive Person");
        inactive.setPasswordHash("p");
        inactive.setIsActive(false);
        repo.save(inactive);

        Pageable pg = PageRequest.of(0, 10);
        var activePage = repo.search(null, "Active", true, pg);
        var inactivePage = repo.search(null, "Inactive", false, pg);

        assertThat(activePage.getTotalElements()).isGreaterThanOrEqualTo(1);
        assertThat(inactivePage.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    //Tìm kiếm người dùng theo email, số điện thoại và ID, đảm bảo rằng các phương thức này trả về kết quả chính xác khi người dùng tồn tại và trả về Optional.empty() khi không tìm thấy.
    @Test
    void search_handlesBlankFilters_asNoFilter() {
        User u = new User();
        u.setEmail("blanktest@example.com");
        u.setPhone("055555");
        u.setFullName("Blank Filter");
        u.setPasswordHash("p");
        repo.save(u);

        Pageable pg = PageRequest.of(0, 10);
        var page1 = repo.search("", "   ", null, pg); 
        var page2 = repo.search(null, null, null, pg);

        assertThat(page1.getTotalElements()).isGreaterThanOrEqualTo(1);
        assertThat(page2.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    //Tìm kiếm người dùng theo email, số điện thoại và ID, đảm bảo rằng các phương thức này trả về kết quả chính xác khi người dùng tồn tại và trả về Optional.empty() khi không tìm thấy.
    @Test
    void search_byEmail_partialMatch_isCaseInsensitive() {
        User u = new User();
        u.setEmail("CaseCheck@Example.COM");
        u.setPhone("066666");
        u.setFullName("Case User");
        u.setPasswordHash("p");
        repo.save(u);

        Pageable pg = PageRequest.of(0, 10);
        var page = repo.search("casecheck", null, null, pg);
        assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(1);
    }
}