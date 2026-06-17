package com.vendormarket.vendor_marketplace.controller;

import com.vendormarket.vendor_marketplace.dto.NotificationResponse;
import com.vendormarket.vendor_marketplace.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> getMyNotifications(Authentication auth) {
        return notificationService.getMyNotifications(auth.getName());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(Authentication auth) {
        return Map.of("count", notificationService.getUnreadCount(auth.getName()));
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id, Authentication auth) {
        notificationService.markAsRead(auth.getName(), id);
    }

    @PutMapping("/read-all")
    public void markAllAsRead(Authentication auth) {
        notificationService.markAllAsRead(auth.getName());
    }
}