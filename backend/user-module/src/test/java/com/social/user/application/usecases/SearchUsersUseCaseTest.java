package com.social.user.application.usecases;

import java.sql.Timestamp;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@ExtendWith(MockitoExtension.class)
class SearchUsersUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SearchUsersUseCase sut;

    private User sampleUser(long id, String email, boolean active) {
        return new User(id, email, "01", "h", "S", "", "", "", "USER", active, new Timestamp(0), new Timestamp(0));
    }

    //Trả về kết quả phân trang khi tìm kiếm bằng email
    @Test
    void returnsPagedResults() {
        User u = sampleUser(1L, "s@mail", true);
        Page<User> page = new PageImpl<>(List.of(u));
        when(userRepository.search(eq("s@mail"), eq(null), eq(true), eq(PageRequest.of(0, 10)))).thenReturn(page);

        var res = sut.execute("s@mail", null, true, PageRequest.of(0, 10));
        assertEquals(1, res.getTotalElements());
        verify(userRepository).search(eq("s@mail"), eq(null), eq(true), eq(PageRequest.of(0, 10)));
    }

    //Trả về kết quả rỗng khi không tìm thấy người dùng nào phù hợp với tiêu chí tìm kiếm
    @Test
    void returnsEmptyResults() {
        Page<User> page = Page.empty();
        when(userRepository.search(eq(null), eq(null), eq(null), eq(PageRequest.of(0, 20)))).thenReturn(page);

        var res = sut.execute(null, null, null, PageRequest.of(0, 20));
        assertEquals(0, res.getTotalElements());
    }

    //Lọc theo tên đầy đủ
    @Test
    void filterByFullName() {
        User u = sampleUser(2L, "a@mail", true);
        Page<User> page = new PageImpl<>(List.of(u));
        when(userRepository.search(eq(null), eq("Alice"), eq(null), eq(PageRequest.of(0, 10)))).thenReturn(page);

        var res = sut.execute(null, "Alice", null, PageRequest.of(0, 10));
        assertEquals(1, res.getTotalElements());
        verify(userRepository).search(eq(null), eq("Alice"), eq(null), eq(PageRequest.of(0, 10)));
    }

    //Lọc theo email và tên đầy đủ
    @Test
    void filterByEmailAndFullName() {
        User u = sampleUser(3L, "x@mail", false);
        Page<User> page = new PageImpl<>(List.of(u));
        when(userRepository.search(eq("x@mail"), eq("Xavier"), eq(false), eq(PageRequest.of(0, 5)))).thenReturn(page);

        var res = sut.execute("x@mail", "Xavier", false, PageRequest.of(0, 5));
        assertEquals(1, res.getTotalElements());
        verify(userRepository).search(eq("x@mail"), eq("Xavier"), eq(false), eq(PageRequest.of(0, 5)));
    }

    //Lọc theo trạng thái hoạt động
    @Test
    void filterByIsActiveFalse() {
        User u = sampleUser(4L, "b@mail", false);
        Page<User> page = new PageImpl<>(List.of(u));
        when(userRepository.search(eq(null), eq(null), eq(false), eq(PageRequest.of(0, 10)))).thenReturn(page);

        var res = sut.execute(null, null, false, PageRequest.of(0, 10));
        assertEquals(1, res.getTotalElements());
        verify(userRepository).search(eq(null), eq(null), eq(false), eq(PageRequest.of(0, 10)));
    }

    //Đảm bảo rằng thông tin phân trang được truyền chính xác đến repository
    @Test
    void paginationBehavior_capturesPageable() {
        User u = sampleUser(5L, "c@mail", true);
        Page<User> page = new PageImpl<>(List.of(u));
        when(userRepository.search(eq(null), eq("John"), eq(null), any(Pageable.class))).thenReturn(page);

        var res = sut.execute(null, "John", null, PageRequest.of(2, 5));
        assertEquals(1, res.getTotalElements());

        ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
        verify(userRepository).search(eq(null), eq("John"), eq(null), cap.capture());
        Pageable passed = cap.getValue();
        assertEquals(2, passed.getPageNumber());
        assertEquals(5, passed.getPageSize());
    }

    //Đảm bảo rằng các chuỗi đầu vào được chuẩn hóa đúng cách trước khi truyền đến repository
    @Test
    void normalizesInput_trimsAndEmptyToNull() {
        User u = sampleUser(6L, "d@mail", true);
        Page<User> page = new PageImpl<>(List.of(u));
        lenient().when(userRepository.search(any(), eq("John"), any(), any(Pageable.class))).thenReturn(page);

        var res = sut.execute("   ", "  John  ", null, PageRequest.of(0, 10));
        assertEquals(1, res.getTotalElements());

        ArgumentCaptor<String> emailCap = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> fullNameCap = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Boolean> activeCap = ArgumentCaptor.forClass(Boolean.class);
        ArgumentCaptor<Pageable> pgCap = ArgumentCaptor.forClass(Pageable.class);

        verify(userRepository).search(emailCap.capture(), fullNameCap.capture(), activeCap.capture(), pgCap.capture());
        assertNull(emailCap.getValue());
        assertEquals("John", fullNameCap.getValue());
    }

    //Đảm bảo rằng nếu repository ném ra một ngoại lệ, nó được bao bọc lại thành một RuntimeException và ném ra ngoài
    @Test
    void repoThrows_isRethrownAsRuntime() {
        when(userRepository.search(eq(null), eq(null), eq(null), any(Pageable.class)))
            .thenThrow(new DataAccessException("boom") {});
        assertThrows(RuntimeException.class, () -> sut.execute(null, null, null, PageRequest.of(0, 10)));
    }


    //Đảm bảo rằng repository được gọi đúng số lần (một lần) cho mỗi lần thực thi
    @Test
    void repositoryInteractionCount_oneCallPerExecution() {
        Page<User> page = Page.empty();
        when(userRepository.search(eq(null), eq(null), eq(null), eq(PageRequest.of(0, 10)))).thenReturn(page);

        sut.execute(null, null, null, PageRequest.of(0, 10));
        verify(userRepository).search(eq(null), eq(null), eq(null), eq(PageRequest.of(0, 10)));
    }

    //Đảm bảo rằng nếu pageable được truyền vào là null, một pageable mặc định (ví dụ: PageRequest.of(0, 20)) được sử dụng
    @Test
    void nullPageableUsesDefault() {
        Page<User> page = Page.empty();
        when(userRepository.search(eq(null), eq(null), eq(null), eq(PageRequest.of(0, 20)))).thenReturn(page);

        var res = sut.execute(null, null, null, null); // null pageable -> default
        assertEquals(0, res.getTotalElements());

        verify(userRepository).search(eq(null), eq(null), eq(null), eq(PageRequest.of(0, 20)));
    }

    //Đảm bảo rằng tổng số phần tử được trả về chính xác ngay cả khi số phần tử trong trang hiện tại ít hơn kích thước trang
    @Test
    void multipleResults_and_totalElements() {
        User u1 = sampleUser(10L, "a@x", true);
        User u2 = sampleUser(11L, "b@x", false);
        User u3 = sampleUser(12L, "c@x", true);
        List<User> users = List.of(u1, u2, u3);
        Page<User> page = new PageImpl<>(users, PageRequest.of(0, 10), users.size());
        when(userRepository.search(eq(null), eq(null), eq(null), eq(PageRequest.of(0, 10)))).thenReturn(page);

        var res = sut.execute(null, null, null, PageRequest.of(0, 10));
        assertEquals(3, res.getTotalElements());
        assertEquals(3, res.getContent().size());
        assertEquals("a@x", res.getContent().get(0).getEmail());
    }

    //Đảm bảo rằng thông tin sắp xếp được truyền chính xác đến repository
    @Test
    void sortPropagation_passesSortToRepository() {
        User u = sampleUser(20L, "sort@mail", true);
        Page<User> page = new PageImpl<>(List.of(u));
        Pageable sorted = PageRequest.of(0, 10, Sort.by("email").descending());

        when(userRepository.search(eq(null), eq(null), eq(null), eq(sorted))).thenReturn(page);

        var res = sut.execute(null, null, null, sorted);
        assertEquals(1, res.getTotalElements());

        ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
        verify(userRepository).search(eq(null), eq(null), eq(null), cap.capture());
        assertEquals(sorted.getSort(), cap.getValue().getSort());
    }

    //Đảm bảo rằng nếu trang được yêu cầu vượt quá số trang có sẵn, một trang rỗng được trả về nhưng tổng số phần tử vẫn chính xác
    @Test
    void pageBeyondEnd_returnsEmptyButKeepsTotalElements() {
        long total = 1L;
        Pageable requested = PageRequest.of(10, 5); 
        Page<User> page = new PageImpl<>(List.of(), requested, total);

        when(userRepository.search(eq(null), eq(null), eq(null), eq(requested))).thenReturn(page);

        var res = sut.execute(null, null, null, requested);
        assertEquals(0, res.getContent().size());
        assertEquals(total, res.getTotalElements());
    }
}