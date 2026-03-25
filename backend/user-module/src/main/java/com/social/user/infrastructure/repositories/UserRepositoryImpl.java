package com.social.user.infrastructure.repositories;

import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;
import org.springframework.stereotype.Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import java.util.Optional;
import java.util.List;

@Repository
public class UserRepositoryImpl implements UserRepository {
    @Autowired
    private JpaUserRepository jpaRepo;

    public User save(User user) {
        return jpaRepo.save(user);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpaRepo.findByEmail(email);
    }

    @Override
    public Optional<User> findByPhone(String phone) {
        return jpaRepo.findByPhone(phone);
    }

    @Override
    public Optional<User> findById(Long id) {
        return jpaRepo.findById(id);
    }

    @Override
    public List<User> findAll() {
        return jpaRepo.findAll();
    }

    @Override
    public void deleteById(Long id) {
        jpaRepo.deleteById(id);
    }

    @Override
    public Page<User> search(String email, String fullName, Boolean isActive, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> cb.conjunction();
        if (email != null && !email.isBlank()) spec = spec.and(UserSpecifications.hasEmailLike(email));
        if (fullName != null && !fullName.isBlank()) spec = spec.and(UserSpecifications.hasFullNameLike(fullName));
        if (isActive != null) spec = spec.and(UserSpecifications.hasIsActive(isActive));
        return jpaRepo.findAll(spec, pageable);
    }
}
