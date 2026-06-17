package com.vendormarket.vendor_marketplace.dto;

import lombok.Data;

@Data
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private Double priceAtPurchase;
    private Double subtotal;
}