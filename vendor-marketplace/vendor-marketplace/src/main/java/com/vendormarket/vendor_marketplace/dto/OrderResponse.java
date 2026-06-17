package com.vendormarket.vendor_marketplace.dto;

import com.vendormarket.vendor_marketplace.model.OrderStatus;
import com.vendormarket.vendor_marketplace.model.PaymentMethod;
import com.vendormarket.vendor_marketplace.model.PaymentStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private Long id;
    private OrderStatus status;
    private Double subtotal;
    private Double discountAmount;
    private String couponCode;
    private Double totalAmount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}