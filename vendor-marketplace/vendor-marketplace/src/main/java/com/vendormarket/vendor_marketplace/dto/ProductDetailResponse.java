package com.vendormarket.vendor_marketplace.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ProductDetailResponse {
    private Long id;
    private String name;
    private String description;
    private Double price;
    private Integer stock;
    private String imageUrl;
    private Long shopId;
    private String shopName;
    private LocalDateTime createdAt;
    private Double averageRating;
    private Long reviewCount;
    private List<ReviewResponse> reviews;
}