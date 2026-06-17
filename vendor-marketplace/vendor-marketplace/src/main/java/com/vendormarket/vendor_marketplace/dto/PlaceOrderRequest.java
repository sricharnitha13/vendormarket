package com.vendormarket.vendor_marketplace.dto;

import com.vendormarket.vendor_marketplace.model.PaymentMethod;
import lombok.Data;
import java.util.List;

@Data
public class PlaceOrderRequest {
    private List<Long> cartItemIds;
    private PaymentMethod paymentMethod = PaymentMethod.COD;
    private String couponCode;
}