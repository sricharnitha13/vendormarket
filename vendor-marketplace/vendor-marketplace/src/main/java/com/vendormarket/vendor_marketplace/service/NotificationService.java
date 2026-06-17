package com.vendormarket.vendor_marketplace.service;

import com.vendormarket.vendor_marketplace.dto.NotificationResponse;
import com.vendormarket.vendor_marketplace.model.Notification;
import com.vendormarket.vendor_marketplace.model.Notification.NotificationType;
import com.vendormarket.vendor_marketplace.model.User;
import com.vendormarket.vendor_marketplace.model.User.Role;
import com.vendormarket.vendor_marketplace.repository.NotificationRepository;
import com.vendormarket.vendor_marketplace.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void notify(User recipient, NotificationType type, String title, String message,
                       String relatedEntityType, Long relatedEntityId) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyAllAdmins(NotificationType type, String title, String message,
                                String relatedEntityType, Long relatedEntityId) {
        // Requires a findByRole(Role) method on UserRepository — see the integration notes.
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            notify(admin, type, title, message, relatedEntityType, relatedEntityId);
        }
    }

    public List<NotificationResponse> getMyNotifications(String email) {
        User user = getUser(email);
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public long getUnreadCount(String email) {
        User user = getUser(email);
        return notificationRepository.countByRecipientAndReadFalse(user);
    }

    @Transactional
    public void markAsRead(String email, Long notificationId) {
        User user = getUser(email);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found"));
        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String email) {
        User user = getUser(email);
        notificationRepository.markAllAsReadForRecipient(user);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType().name())
                .title(n.getTitle())
                .message(n.getMessage())
                .read(n.isRead())
                .relatedEntityType(n.getRelatedEntityType())
                .relatedEntityId(n.getRelatedEntityId())
                .createdAt(n.getCreatedAt())
                .build();
    }
}