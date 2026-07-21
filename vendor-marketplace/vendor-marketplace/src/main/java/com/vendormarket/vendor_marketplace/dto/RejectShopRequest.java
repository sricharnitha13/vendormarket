package com.vendormarket.vendor_marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RejectShopRequest {

    @NotBlank(message = "Rejection reason is required")
    private String reason;
}