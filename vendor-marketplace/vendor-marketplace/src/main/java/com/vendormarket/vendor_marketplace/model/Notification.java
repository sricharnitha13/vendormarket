package com.vendormarket.vendor_marketplace.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private String title;

    @Column(length = 1000)
    private String message;

    @Builder.Default
    @Column(name = "is_read")
    private boolean read = false;

    // Lets the frontend deep-link a click straight to the shop/order/coupon in question.
    private String relatedEntityType;
    private Long relatedEntityId;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum NotificationType {
        SHOP_APPROVED,
        SHOP_REJECTED,
        ORDER_STATUS_CHANGED,
        NEW_COUPON,
        NEW_SHOP_REGISTERED
    }
}