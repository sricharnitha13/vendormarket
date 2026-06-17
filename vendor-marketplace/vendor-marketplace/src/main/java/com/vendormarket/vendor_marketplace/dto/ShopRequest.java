package com.vendormarket.vendor_marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ShopRequest {

    @NotBlank(message = "Shop name is required")
    private String name;

    private String description;
    private String address;
    private String category;
}