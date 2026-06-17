package com.vendormarket.vendor_marketplace.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RevenueDataPoint {
    private String date; // e.g. "2026-06-10"
    private Double revenue;
    private Long orders;
}