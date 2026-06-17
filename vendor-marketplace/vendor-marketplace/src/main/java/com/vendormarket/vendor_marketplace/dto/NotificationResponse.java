package com.vendormarket.vendor_marketplace.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String message;
    private boolean read;
    private String relatedEntityType;
    private Long relatedEntityId;
    private LocalDateTime createdAt;
}