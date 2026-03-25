package com.social.user.application.usecases;

import java.sql.Timestamp;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;
import com.social.user.presentation.dto.UpdateUserDto;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UpdateUserUseCaseTest {
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UpdateUserUseCase sut;

    //Khi email mới trùng với email của user khác thì lỗi được ném ra
    @Test
    void whenEmailConflict_thenThrow() {
        User existing = new User(2L, "other@mail", "99", "h", "Other", "", "", "", "USER", true, new Timestamp(0), new Timestamp(0));
        User target = new User(1L, "a@mail", "01", "h", "A", "", "", "", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));
        when(userRepository.findByEmail("other@mail")).thenReturn(Optional.of(existing));

        UpdateUserDto dto = new UpdateUserDto();
        dto.setEmail("other@mail");

        assertThrows(RuntimeException.class, () -> sut.execute(1L, dto));
        verify(userRepository, never()).save(any());
    }

    //Khi số điện thoại mới trùng với số điện thoại của user khác thì lỗi được ném ra
    @Test
    void whenPhoneConflict_thenThrow() {
        User existing = new User(3L, "x@mail", "99", "h", "Other", "", "", "", "USER", true, new Timestamp(0), new Timestamp(0));
        User target = new User(1L, "a@mail", "01", "h", "A", "", "", "", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));
        when(userRepository.findByPhone("99")).thenReturn(Optional.of(existing));

        UpdateUserDto dto = new UpdateUserDto();
        dto.setPhone("99");

        assertThrows(RuntimeException.class, () -> sut.execute(1L, dto));
        verify(userRepository, never()).save(any());
    }

    //Khi user không tồn tại thì lỗi được ném ra
    @Test
    void whenUserNotFound_thenThrow() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        UpdateUserDto dto = new UpdateUserDto();
        dto.setFullName("No one");

        assertThrows(RuntimeException.class, () -> sut.execute(999L, dto));
        verify(userRepository, never()).save(any());
    }

    //Khi email mới trùng với email của chính user đó thì vẫn cho phép cập nhật và lưu
    @Test
    void whenEmailSameAsCurrent_thenAllowAndSave() {
        User target = new User(1L, "a@mail", "01", "h", "A", "bio", "av", "cv", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));
        when(userRepository.findByEmail("a@mail")).thenReturn(Optional.of(target));
        when(userRepository.findByPhone(any())).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserDto dto = new UpdateUserDto();
        dto.setEmail("a@mail");
        dto.setFullName("Same Email Name");

        var updated = sut.execute(1L, dto);
        assertEquals("Same Email Name", updated.getFullName());
        assertEquals("a@mail", updated.getEmail());
        assertTrue(updated.getUpdatedAt().getTime() > 0);
        verify(userRepository).save(any());
    }
    
    //Khi số điện thoại mới trùng với số điện thoại của chính user đó thì vẫn cho phép cập nhật và lưu
    @Test
    void whenPhoneSameAsCurrent_thenAllowAndSave() {
        User target = new User(1L, "a@mail", "01", "h", "A", "bio", "av", "cv", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));
        when(userRepository.findByPhone("01")).thenReturn(Optional.of(target));
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserDto dto = new UpdateUserDto();
        dto.setPhone("01");
        dto.setFullName("Same Phone Name");

        var updated = sut.execute(1L, dto);
        assertEquals("Same Phone Name", updated.getFullName());
        assertEquals("01", updated.getPhone());
        assertTrue(updated.getUpdatedAt().getTime() > 0);
        verify(userRepository).save(any());
    }

    //Khi cập nhật email mới không trùng với email của user khác thì cập nhật và lưu thành công
    @Test
    void whenUpdateEmailToNew_thenUpdateAndSave() {
        User target = new User(1L, "old@mail", "01", "h", "A", "bio", "av", "cv", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));
        when(userRepository.findByEmail("new@mail")).thenReturn(Optional.empty());
        when(userRepository.findByPhone(any())).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserDto dto = new UpdateUserDto();
        dto.setEmail("new@mail");

        var updated = sut.execute(1L, dto);
        assertEquals("new@mail", updated.getEmail());
        verify(userRepository).save(any());
    }

    //Khi cập nhật số điện thoại mới không trùng với số điện thoại của user khác thì cập nhật và lưu thành công
    @Test
    void whenUpdatePhoneToNew_thenUpdateAndSave() {
        User target = new User(1L, "a@mail", "01", "h", "A", "bio", "av", "cv", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));
        when(userRepository.findByPhone("09")).thenReturn(Optional.empty());
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserDto dto = new UpdateUserDto();
        dto.setPhone("09");

        var updated = sut.execute(1L, dto);
        assertEquals("09", updated.getPhone());
        verify(userRepository).save(any());
    }

    //Khi cập nhật avatar, cover và role mới thì cập nhật và lưu thành công
    @Test
    void whenUpdateAvatarCoverRole_thenSave() {
        User target = new User(1L, "a@mail", "01", "h", "A", "bio", "oldAv", "oldCv", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.findByPhone(any())).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserDto dto = new UpdateUserDto();
        dto.setAvatarUrl("newAv");
        dto.setCoverUrl("newCv");
        dto.setRole("ADMIN");

        var updated = sut.execute(1L, dto);
        assertEquals("newAv", updated.getAvatarUrl());
        assertEquals("newCv", updated.getCoverUrl());
        assertEquals("ADMIN", updated.getRole());
        verify(userRepository).save(any());
    }


    //Khi cập nhật nhiều trường cùng lúc thì tất cả được cập nhật và lưu thành công
    @Test
    void whenUpdateMultipleFields_thenSave() {
        User target = new User(1L, "old@mail", "01", "h", "Old", "bio", "av", "cv", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));
        when(userRepository.findByEmail("multi@mail")).thenReturn(Optional.empty());
        when(userRepository.findByPhone("77")).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserDto dto = new UpdateUserDto();
        dto.setFullName("Multi");
        dto.setEmail("multi@mail");
        dto.setPhone("77");
        dto.setAvatarUrl("a2");
        dto.setRole("MOD");

        var updated = sut.execute(1L, dto);
        assertEquals("Multi", updated.getFullName());
        assertEquals("multi@mail", updated.getEmail());
        assertEquals("77", updated.getPhone());
        assertEquals("a2", updated.getAvatarUrl());
        assertEquals("MOD", updated.getRole());
        verify(userRepository).save(any());
    }


    //Khi cập nhật full name thành chuỗi rỗng thì full name được lưu là chuỗi rỗng
    @Test
    void whenSetEmptyFullName_thenSaveEmpty() {
        User target = new User(1L, "a@mail", "01", "h", "Old", "bio", "av", "cv", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.findByPhone(any())).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserDto dto = new UpdateUserDto();
        dto.setFullName("");

        var updated = sut.execute(1L, dto);
        assertEquals("", updated.getFullName());
        verify(userRepository).save(any());
    }


    //Khi cập nhật nhiều trường cùng lúc với một số trường có giá trị mới trùng với giá trị cũ thì các trường có giá trị mới khác giá trị cũ vẫn được cập nhật và lưu thành công
    @Test
    void whenValid_thenUpdateAndSave() {
        User target = new User(1L, "a@mail", "01", "h", "A", "bio", "av", "cv", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.findByPhone(any())).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserDto dto = new UpdateUserDto();
        dto.setFullName("New Name");
        dto.setBio("New bio");
        dto.setIsActive(false);

        var updated = sut.execute(1L, dto);
        assertEquals("New Name", updated.getFullName());
        assertEquals("New bio", updated.getBio());
        assertFalse(Boolean.TRUE.equals(updated.getIsActive()));
        assertTrue(updated.getUpdatedAt().getTime() > 0);
        verify(userRepository).save(any());
    }


    //Khi userRepository.save() ném lỗi thì lỗi được propagate ra ngoài
    @Test
    void whenSaveThrows_thenPropagates() {
        User target = new User(1L, "a@mail", "01", "h", "A", "bio", "av", "cv", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.findByPhone(any())).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenThrow(new RuntimeException("db"));

        UpdateUserDto dto = new UpdateUserDto();
        dto.setFullName("Will Fail");

        assertThrows(RuntimeException.class, () -> sut.execute(1L, dto));
        verify(userRepository).save(any());
    }
}