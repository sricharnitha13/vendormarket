package com.vendormarket.vendor_marketplace.dto;

import com.vendormarket.vendor_marketplace.model.DiscountType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CouponResponse {
    private Long id;
    private String code;
    private DiscountType discountType;
    private Double discountValue;
    private Double minOrderAmount;
    private Double maxDiscountAmount;
    private LocalDateTime expiryDate;
    private boolean active;
    private Long shopId;
    private String shopName;
    private LocalDateTime createdAt;
}