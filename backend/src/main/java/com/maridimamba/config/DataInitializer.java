package com.maridimamba.config;

import com.maridimamba.entity.User;
import com.maridimamba.enums.Role;
import com.maridimamba.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initOrUpdateUser("leader", "admin123", "Rama Krishna (Leader)", Role.LEADER, "9876543210");
        initOrUpdateUser("member", "member123", "Sita Devi (Member View)", Role.MEMBER, "9876543211");
        log.info("Default users initialized: 'leader' (admin123) and 'member' (member123)");
    }

    private void initOrUpdateUser(String username, String rawPassword, String fullName, Role role, String phone) {
        userRepository.findByUsername(username).ifPresentOrElse(
                user -> {
                    user.setPasswordHash(passwordEncoder.encode(rawPassword));
                    user.setRole(role);
                    user.setActive(true);
                    userRepository.save(user);
                },
                () -> {
                    User newUser = User.builder()
                            .username(username)
                            .passwordHash(passwordEncoder.encode(rawPassword))
                            .fullName(fullName)
                            .role(role)
                            .phone(phone)
                            .active(true)
                            .build();
                    userRepository.save(newUser);
                }
        );
    }
}
