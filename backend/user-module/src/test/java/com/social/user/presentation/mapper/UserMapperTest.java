package com.social.user.presentation.mapper;

import java.lang.reflect.Field;
import java.sql.Timestamp;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

import com.social.user.domain.entities.User;
import com.social.user.presentation.dto.UserViewDto;

class UserMapperTest {

    private final UserMapper mapper = new UserMapper();

    //Kiểm tra mapping từ User entity sang UserViewDto, đảm bảo tất cả các trường được map chính xác và null được xử lý an toàn.
    @Test
    void mapsEntityToDto() {
        User u = new User(1L, "x@example.com", "012345", "secret", "First Last",
                "bio", "avatar.png", "cover.png", "USER", true, null, null);
        UserViewDto dto = mapper.toDto(u);

        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getEmail()).isEqualTo("x@example.com");
        assertThat(dto.getFullName()).isEqualTo("First Last");
        assertThat(dto.getAvatarUrl()).isEqualTo("avatar.png");
    }

    //Kiểm tra rằng nếu truyền null vào phương thức toDto, nó sẽ trả về null thay vì ném ra lỗi.
    @Test
    void returnsNullWhenUserNull() {
        assertThat(mapper.toDto(null)).isNull();
    }

    //Kiểm tra rằng nếu một số trường trong User entity là null, phương thức toDto vẫn hoạt động mà không ném ra lỗi và các trường tương ứng trong UserViewDto cũng là null.
    @Test
    void mapsNullFieldsSafely() {
        User u = new User(2L, "n@example.com", null, "hash", null, null, null, null, "USER", null, null, null);
        UserViewDto dto = mapper.toDto(u);
        assertThat(dto).isNotNull();
        assertThat(dto.getPhone()).isNull();
        assertThat(dto.getFullName()).isNull();
        assertThat(dto.getBio()).isNull();
        assertThat(dto.getAvatarUrl()).isNull();
        assertThat(dto.getCoverUrl()).isNull();
        assertThat(dto.getCreatedAt()).isNull();
        assertThat(dto.getUpdatedAt()).isNull();
    }

    //Kiểm tra rằng nếu trường isActive trong User entity là null, phương thức toDto sẽ mặc định trả về false cho trường isActive trong UserViewDto.
    @Test
    void nullIsActiveDefaultsFalse() {
        User u = new User(3L, "a@example.com", "0123", "hash", "Name", "bio", "avatar", "cover", "USER", null, null, null);
        UserViewDto dto = mapper.toDto(u);
        assertThat(dto.isActive()).isFalse();
    }

    //Kiểm tra rằng tất cả các trường trong User entity được map chính xác sang UserViewDto, bao gồm cả các trường ngày tháng và boolean, và đảm bảo rằng không có trường nào bị bỏ sót hoặc map sai.
    @Test
    void mapsAllFields() {
        Timestamp now = new Timestamp(System.currentTimeMillis());
        User u = new User(4L, "full@example.com", "0999", "hash", "Full Name", "bio", "avatar.png", "cover.png", "ADMIN", true, now, now);
        UserViewDto dto = mapper.toDto(u);
        assertThat(dto.getId()).isEqualTo(4L);
        assertThat(dto.getEmail()).isEqualTo("full@example.com");
        assertThat(dto.getPhone()).isEqualTo("0999");
        assertThat(dto.getFullName()).isEqualTo("Full Name");
        assertThat(dto.getBio()).isEqualTo("bio");
        assertThat(dto.getAvatarUrl()).isEqualTo("avatar.png");
        assertThat(dto.getCoverUrl()).isEqualTo("cover.png");
        assertThat(dto.getRole()).isEqualTo("ADMIN");
        assertThat(dto.isActive()).isTrue();
        assertThat(dto.getCreatedAt()).isEqualTo(now);
        assertThat(dto.getUpdatedAt()).isEqualTo(now);
    }

    //Kiểm tra rằng UserViewDto không có trường passwordHash, đảm bảo rằng thông tin nhạy cảm này không bị lộ ra trong DTO.
    @Test
    void dtoDoesNotExposePasswordField() {
        List<String> fields = Arrays.stream(UserViewDto.class.getDeclaredFields()).map(Field::getName).toList();
        assertThat(fields).doesNotContain("passwordHash");
    }
}