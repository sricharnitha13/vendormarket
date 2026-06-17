package com.vendormarket.vendor_marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectShopRequest {

    @NotBlank(message = "Rejection reason is required")
    private String reason;
}