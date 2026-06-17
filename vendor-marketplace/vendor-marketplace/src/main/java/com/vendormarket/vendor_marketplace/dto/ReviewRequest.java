package com.vendormarket.vendor_marketplace.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private Integer rating; // 1-5
    private String comment;
}