package com.vendormarket.vendor_marketplace.dto;

import lombok.*;
import java.util.List;

@Data
@AllArgsConstructor
public class CartResponse {
    private Long cartId;
    private String userEmail;
    private List<CartItemResponse> items;
    private double totalAmount;
}