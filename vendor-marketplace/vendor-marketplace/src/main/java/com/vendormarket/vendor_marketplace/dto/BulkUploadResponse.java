package com.vendormarket.vendor_marketplace.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class BulkUploadResponse {
    private int totalRows;
    private int successCount;
    private List<String> errors;
}