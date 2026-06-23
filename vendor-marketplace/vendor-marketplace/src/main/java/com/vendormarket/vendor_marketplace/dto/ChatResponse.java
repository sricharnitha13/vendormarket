package com.vendormarket.vendor_marketplace.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ChatResponse {
    private String reply;
    private List<ProductResponse> products; // present for SEARCH / ADD_TO_CART results
    private List<OrderResponse> orders;     // present for ORDER_STATUS results
    private List<ShopResponse> shops;       // present for SHOP_LIST results
}