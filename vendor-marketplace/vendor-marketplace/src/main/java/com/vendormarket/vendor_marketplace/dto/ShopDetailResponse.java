package com.vendormarket.vendor_marketplace.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ShopDetailResponse {
    private Long id;
    private String name;
    private String description;
    private String address;
    private String category;
    private String ownerName;
    private String ownerPhone;
    private LocalDateTime createdAt;
}