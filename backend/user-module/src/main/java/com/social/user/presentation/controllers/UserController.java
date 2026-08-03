package com.social.user.presentation.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.user.application.usecases.CreateUserUseCase;
import com.social.user.application.usecases.DeleteUserUseCase;
import com.social.user.application.usecases.GetAllUserUseCase;
import com.social.user.application.usecases.GetUserByIdUseCase;
import com.social.user.application.usecases.SearchUsersUseCase;
import com.social.user.application.usecases.UpdateUserUseCase;
import com.social.user.domain.entities.User;
import com.social.user.presentation.dto.CreateUserDto;
import com.social.user.presentation.dto.UpdateUserDto;
import com.social.user.presentation.dto.UserViewDto;
import com.social.user.presentation.mapper.UserMapper;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/users")
public class UserController {
    private final CreateUserUseCase createUserUseCase;
    private final GetAllUserUseCase getAllUserUseCase;
    private final GetUserByIdUseCase getUserByIdUseCase;
    private final UpdateUserUseCase updateUserUseCase;
    private final DeleteUserUseCase deleteUserUseCase;
    private final UserMapper userMapper;
    private final SearchUsersUseCase searchUsersUseCase;

    public UserController(CreateUserUseCase createUserUseCase,
                          GetAllUserUseCase getAllUserUseCase,
                          GetUserByIdUseCase getUserByIdUseCase,
                          UpdateUserUseCase updateUserUseCase,
                          DeleteUserUseCase deleteUserUseCase,
                          UserMapper userMapper,
                          SearchUsersUseCase searchUsersUseCase) {
        this.createUserUseCase = createUserUseCase;
        this.getAllUserUseCase = getAllUserUseCase;
        this.getUserByIdUseCase = getUserByIdUseCase;
        this.updateUserUseCase = updateUserUseCase;
        this.deleteUserUseCase = deleteUserUseCase;
        this.userMapper = userMapper;
        this.searchUsersUseCase = searchUsersUseCase;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserDto dto) {
        try {
            User user = createUserUseCase.execute(
                dto.getEmail(),
                dto.getPhone(),
                dto.getPassword(),
                dto.getFullName(),
                dto.getBio(),
                dto.getAvatarUrl(),
                dto.getCoverUrl(),
                dto.getRole()
            );
            return ResponseEntity.ok(userMapper.toDto(user));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Đã xảy ra lỗi hệ thống");
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers(
        @RequestParam(name = "page", required = false, defaultValue = "0") int page,
        @RequestParam(name = "size", required = false, defaultValue = "20") int size,
        @RequestParam(name = "email", required = false) String email,
        @RequestParam(name = "fullName", required = false) String fullName,
        @RequestParam(name = "q", required = false) String q,
        @RequestParam(name = "isActive", required = false) Boolean isActive
    ) {
        try {
            Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
            Page<User> usersPage = searchUsersUseCase.execute(email, fullName, q, isActive, pageable);
            Page<UserViewDto> dtoPage = usersPage.map(userMapper::toDto);
            return ResponseEntity.ok(dtoPage);
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Đã xảy ra lỗi hệ thống");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            User user = getUserByIdUseCase.execute(id);
            return ResponseEntity.ok(userMapper.toDto(user));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Đã xảy ra lỗi hệ thống");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body("Unauthorized");
            }
            String principal = (String) auth.getPrincipal();
            Long userId = Long.valueOf(principal);
            User user = getUserByIdUseCase.execute(userId);
            return ResponseEntity.ok(userMapper.toDto(user));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Đã xảy ra lỗi hệ thống");
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserDto dto) {
        try {
            User updated = updateUserUseCase.executeAdmin(id, dto);
            return ResponseEntity.ok(userMapper.toDto(updated));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Đã xảy ra lỗi hệ thống");
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(@Valid @RequestBody UpdateUserDto dto) {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body("Unauthorized");
            }
            String principal = (String) auth.getPrincipal();
            Long userId = Long.valueOf(principal);
            User updated = updateUserUseCase.executeSelf(userId, dto);
            return ResponseEntity.ok(userMapper.toDto(updated));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Đã xảy ra lỗi hệ thống");
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            deleteUserUseCase.execute(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Đã xảy ra lỗi hệ thống");
        }
    }
}