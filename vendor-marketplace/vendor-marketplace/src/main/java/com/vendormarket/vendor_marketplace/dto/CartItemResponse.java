package com.vendormarket.vendor_marketplace.dto;

import lombok.*;

@Data
@AllArgsConstructor
public class CartItemResponse {
    private Long cartItemId;
    private Long productId;
    private String productName;
    private double price;
    private int quantity;
    private double subtotal;
    private Long shopId;
    private String shopName;
}