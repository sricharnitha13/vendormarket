package com.vendormarket.vendor_marketplace.dto;

import com.vendormarket.vendor_marketplace.model.Shop.ShopStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ShopResponse {
    private Long id;
    private String name;
    private String description;
    private String address;
    private String category;
    private ShopStatus status;
    private String rejectionReason;
    private String ownerName;
    private LocalDateTime createdAt;

}