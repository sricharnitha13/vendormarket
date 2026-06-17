package com.vendormarket.vendor_marketplace.service;

import com.vendormarket.vendor_marketplace.dto.UserResponse;
import com.vendormarket.vendor_marketplace.model.User;
import com.vendormarket.vendor_marketplace.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<UserResponse> getAllUsers(String role, String search) {
        List<User> users = userRepository.findAll();

        if (role != null && !role.isBlank()) {
            User.Role parsedRole;
            try {
                parsedRole = User.Role.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid role: " + role);
            }
            users = users.stream().filter(u -> u.getRole() == parsedRole).collect(Collectors.toList());
        }

        if (search != null && !search.isBlank()) {
            String term = search.toLowerCase();
            users = users.stream()
                    .filter(u -> (u.getName() != null && u.getName().toLowerCase().contains(term))
                            || u.getEmail().toLowerCase().contains(term))
                    .collect(Collectors.toList());
        }

        return users.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public UserResponse setEnabled(Long id, boolean enabled) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (user.getRole() == User.Role.ADMIN) {
            throw new IllegalStateException("Admin accounts can't be disabled from here");
        }

        user.setEnabled(enabled);
        return toResponse(userRepository.save(user));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}