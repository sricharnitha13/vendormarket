package com.vendormarket.vendor_marketplace.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class WishlistItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String description;
    private Double price;
    private Integer stock;
    private String imageUrl;
    private LocalDateTime addedAt;
}