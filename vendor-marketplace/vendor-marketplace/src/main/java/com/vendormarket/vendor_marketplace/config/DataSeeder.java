package com.vendormarket.vendor_marketplace.config;

import com.vendormarket.vendor_marketplace.model.User;
import com.vendormarket.vendor_marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        if (admins.isEmpty()) {
            User admin = User.builder()
                    .name("Super Admin")
                    .email("admin@vendormarket.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(User.Role.ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            System.out.println("Default Admin created: admin@vendormarket.com / admin123");
        }
    }
}
