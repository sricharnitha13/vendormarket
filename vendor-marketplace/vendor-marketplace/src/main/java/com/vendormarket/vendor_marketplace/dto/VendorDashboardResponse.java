package com.vendormarket.vendor_marketplace.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class VendorDashboardResponse {
    private Double totalRevenue;
    private Long totalOrders;
    private Long pendingOrders;
    private List<TopProduct> topProducts;

    @Data
    @Builder
    public static class TopProduct {
        private Long productId;
        private String productName;
        private Long quantitySold;
        private Double revenue;
    }
}