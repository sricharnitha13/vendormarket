package com.vendormarket.vendor_marketplace.dto;

import com.vendormarket.vendor_marketplace.model.DiscountType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CouponRequest {

    @NotBlank(message = "Coupon code is required")
    private String code;

    @NotNull(message = "Discount type is required")
    private DiscountType discountType;

    @NotNull(message = "Discount value is required")
    @Positive(message = "Discount value must be positive")
    private Double discountValue;

    private Double minOrderAmount;
    private Double maxDiscountAmount;
    private LocalDateTime expiryDate;
}