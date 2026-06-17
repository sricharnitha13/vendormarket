package com.vendormarket.vendor_marketplace.controller;

import com.vendormarket.vendor_marketplace.dto.OrderResponse;
import com.vendormarket.vendor_marketplace.dto.PlaceOrderRequest;
import com.vendormarket.vendor_marketplace.dto.RevenueDataPoint;
import com.vendormarket.vendor_marketplace.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.vendormarket.vendor_marketplace.dto.VendorDashboardResponse;
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    @GetMapping("/vendor")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<OrderResponse>> getVendorOrders(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.getVendorOrders(userDetails.getUsername()));
    }
    // Place order (full cart or selected items)
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> placeOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody(required = false) PlaceOrderRequest request) {
        if (request == null) request = new PlaceOrderRequest();
        return ResponseEntity.ok(orderService.placeOrder(userDetails.getUsername(), request));
    }

    // Get all my orders
    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<OrderResponse>> getMyOrders(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.getMyOrders(userDetails.getUsername()));
    }

    // Get single order
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> getOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(userDetails.getUsername(), id));
    }

    // Cancel order (buyer)
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> cancelOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(userDetails.getUsername(), id));
    }

    // Update status (vendor or admin)
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateStatus(id, status));
    }
    @GetMapping("/vendor/dashboard")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<VendorDashboardResponse> getVendorDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.getVendorDashboard(userDetails.getUsername()));
    }
    @GetMapping("/vendor/revenue")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<RevenueDataPoint>> getVendorRevenue(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(orderService.getVendorRevenueOverTime(userDetails.getUsername(), days));
    }
}