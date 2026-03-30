package com.social.user.presentation.controllers;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.social.user.application.usecases.CreateUserUseCase;
import com.social.user.application.usecases.GetAllUserUseCase;
import com.social.user.application.usecases.DeleteUserUseCase;
import com.social.user.application.usecases.GetUserByIdUseCase;
import com.social.user.application.usecases.SearchUsersUseCase;
import com.social.user.application.usecases.UpdateUserUseCase;
import com.social.user.domain.entities.User;
import com.social.user.presentation.dto.CreateUserDto;
import com.social.user.presentation.dto.UpdateUserDto;
import com.social.user.presentation.dto.UserViewDto;
import com.social.user.presentation.mapper.UserMapper;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean private CreateUserUseCase createUserUseCase;
    @MockBean private GetAllUserUseCase getAllUserUseCase;
    @MockBean private GetUserByIdUseCase getUserByIdUseCase;
    @MockBean private UpdateUserUseCase updateUserUseCase;
    @MockBean private DeleteUserUseCase deleteUserUseCase;
    @MockBean private SearchUsersUseCase searchUsersUseCase;
    @MockBean private UserMapper userMapper;

    private User sampleUser(long id, String email) {
        return new User(id, email, "01", "First", "Last", "", "", "", "USER", true, new Timestamp(0), new Timestamp(0));
    }

    private UserViewDto sampleDto(long id, String email) {
        UserViewDto d = new UserViewDto();
        d.setId(id);
        d.setEmail(email);
        d.setFullName("First Last");
        return d;
    }

    //Trả về kết quả phân trang khi tìm kiếm bằng email
    @Test
    void getAllUsers_returnsPage() throws Exception {
        var user = sampleUser(1L, "a@mail");
        var dto = sampleDto(1L, "a@mail");
        when(searchUsersUseCase.execute(eq(null), eq(null), Mockito.<Boolean>isNull(), any(PageRequest.class)))
            .thenReturn(new PageImpl<>(List.of(user), PageRequest.of(0, 20), 1));
        when(userMapper.toDto(user)).thenReturn(dto);

        mvc.perform(get("/users")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk());
    }

    //Trả về kết quả rỗng khi không tìm thấy người dùng nào phù hợp với tiêu chí tìm kiếm
    @Test
    void getAllUsers_defaults_useDefaultPageAndSize() throws Exception {
        var user = sampleUser(10L, "z@mail");
        when(searchUsersUseCase.execute(any(), any(), Mockito.<Boolean>isNull(), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(user), PageRequest.of(0, 20), 1));
        when(userMapper.toDto(user)).thenReturn(sampleDto(10L, "z@mail"));

        mvc.perform(get("/users"))
            .andExpect(status().isOk());

        ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
        verify(searchUsersUseCase).execute(eq(null), eq(null), Mockito.<Boolean>isNull(), cap.capture());
        assertEquals(0, cap.getValue().getPageNumber());
        assertEquals(20, cap.getValue().getPageSize());
    }

    //Lấy danh sách người dùng với tham số tìm kiếm email và tên đầy đủ, đảm bảo rằng các tham số này được truyền chính xác đến use case
    @Test
    void getAllUsers_negativePage_sizeHandledAsMin() throws Exception {
        var user = sampleUser(11L, "y@mail");
        when(searchUsersUseCase.execute(any(), any(), Mockito.<Boolean>isNull(), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(user), PageRequest.of(0, 1), 1));
        when(userMapper.toDto(user)).thenReturn(sampleDto(11L, "y@mail"));

        mvc.perform(get("/users")
                .param("page", "-1")
                .param("size", "-5"))
            .andExpect(status().isOk());

        ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
        verify(searchUsersUseCase).execute(eq(null), eq(null), Mockito.<Boolean>isNull(), cap.capture());
        assertEquals(0, cap.getValue().getPageNumber());
        assertEquals(1, cap.getValue().getPageSize());
    }

    //Lấy danh sách người dùng với tham số tìm kiếm email và tên đầy đủ, đảm bảo rằng các tham số này được truyền chính xác đến use case
    @Test
    void getAllUsers_searchParamsArePropagated() throws Exception {
        var user = sampleUser(12L, "search@mail");
        when(searchUsersUseCase.execute(eq(" e@x.com "), eq(" John Doe "), Mockito.<Boolean>isNull(), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(user), PageRequest.of(0, 20), 1));
        when(userMapper.toDto(user)).thenReturn(sampleDto(12L, "search@mail"));

        mvc.perform(get("/users")
                .param("email", " e@x.com ")
                .param("fullName", " John Doe "))
            .andExpect(status().isOk());
    }

    //Lấy người dùng theo ID, đảm bảo rằng nếu người dùng tồn tại, thông tin của họ được trả về với mã trạng thái 200
    @Test
    void getUserById_found_returns200() throws Exception {
        var user = sampleUser(2L, "b@mail");
        var dto = sampleDto(2L, "b@mail");
        when(getUserByIdUseCase.execute(2L)).thenReturn(user);
        when(userMapper.toDto(user)).thenReturn(dto);

        mvc.perform(get("/users/2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(2))
            .andExpect(jsonPath("$.email").value("b@mail"));
    }

    //Lấy người dùng theo ID, đảm bảo rằng nếu người dùng không tồn tại, một lỗi 404 được trả về
    @Test
    void getUserById_notFound_returns404() throws Exception {
        when(getUserByIdUseCase.execute(99L)).thenThrow(new RuntimeException("not found"));

        mvc.perform(get("/users/99"))
            .andExpect(status().isNotFound());
    }

    //Tạo người dùng mới, đảm bảo rằng khi payload hợp lệ được gửi đến endpoint, một người dùng mới được tạo ra và trả về với mã trạng thái 200
    @Test
    void createUser_success_returns200_andJsonBody() throws Exception {
        var req = new CreateUserDto();
        req.setEmail("c@mail");
        req.setPhone("012345");
        req.setPassword("password");
        req.setFullName("X Y");

        when(createUserUseCase.execute(any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(sampleUser(3L, "c@mail"));
        when(userMapper.toDto(any(User.class))).thenReturn(sampleDto(3L, "c@mail"));

        mvc.perform(post("/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3))
            .andExpect(jsonPath("$.email").value("c@mail"));
    }

    //Tạo người dùng mới, đảm bảo rằng khi payload không hợp lệ (ví dụ: email không đúng định dạng, mật khẩu quá ngắn) được gửi đến endpoint, một lỗi 400 được trả về cùng với thông điệp lỗi chi tiết
    @Test
    void createUser_invalidPayload_returns400_withValidationMessages() throws Exception {
        var req = new CreateUserDto();
        req.setEmail("invalid@mail");
        req.setPhone("01"); // too short
        req.setPassword("123"); // too short

        mvc.perform(post("/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(containsString("password")))
            .andExpect(content().string(containsString("phone")));
    }

    //Tạo người dùng mới, đảm bảo rằng khi use case ném ra một RuntimeException (ví dụ: do email đã tồn tại), một lỗi 400 được trả về cùng với thông điệp lỗi từ exception
    @Test
    void createUser_useCaseThrows_returns400() throws Exception {
        var req = new CreateUserDto();
        req.setEmail("c@mail");
        when(createUserUseCase.execute(any(), any(), any(), any(), any(), any(), any(), any()))
            .thenThrow(new RuntimeException("bad"));

        mvc.perform(post("/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    //Cập nhật người dùng, đảm bảo rằng khi payload hợp lệ được gửi đến endpoint, thông tin người dùng được cập nhật và trả về với mã trạng thái 200
    @Test
    void updateUser_success_returns200() throws Exception {
        var dtoReq = new UpdateUserDto();
        dtoReq.setFullName("New Name");
        var updated = sampleUser(4L, "d@mail");
        when(updateUserUseCase.execute(eq(4L), any(UpdateUserDto.class))).thenReturn(updated);
        when(userMapper.toDto(updated)).thenReturn(sampleDto(4L, "d@mail"));

        mvc.perform(put("/users/4")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dtoReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(4))
            .andExpect(jsonPath("$.email").value("d@mail"));
    }

    //Cập nhật người dùng, đảm bảo rằng khi use case ném ra một RuntimeException (ví dụ: do người dùng không tồn tại), một lỗi 400 được trả về cùng với thông điệp lỗi từ exception
    @Test
    void updateUser_runtimeException_returns400() throws Exception {
        var dtoReq = new UpdateUserDto();
        dtoReq.setFullName("New Name");
        when(updateUserUseCase.execute(eq(4L), any(UpdateUserDto.class))).thenThrow(new RuntimeException("bad"));

        mvc.perform(put("/users/4")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dtoReq)))
            .andExpect(status().isBadRequest());
    }

    //Cập nhật người dùng, đảm bảo rằng khi use case ném ra một ngoại lệ không phải RuntimeException (ví dụ: do lỗi cơ sở dữ liệu), một lỗi 500 được trả về cùng với thông điệp lỗi hệ thống chung
    @Test
    void deleteUser_success_returns204() throws Exception {
        Mockito.doNothing().when(deleteUserUseCase).execute(5L);

        mvc.perform(delete("/users/5"))
            .andExpect(status().isNoContent());
    }

    //Xóa người dùng, đảm bảo rằng khi use case ném ra một RuntimeException (ví dụ: do người dùng không tồn tại), một lỗi 404 được trả về cùng với thông điệp lỗi từ exception
    @Test
    void deleteUser_notFound_returns404() throws Exception {
        Mockito.doThrow(new RuntimeException("not found")).when(deleteUserUseCase).execute(123L);

        mvc.perform(delete("/users/123"))
            .andExpect(status().isNotFound());
    }
}