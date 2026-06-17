package com.vendormarket.vendor_marketplace.dto;

import com.vendormarket.vendor_marketplace.model.User.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 6)
    private String password;

    private String phone;

    private Role role; // CUSTOMER or VENDOR
}
