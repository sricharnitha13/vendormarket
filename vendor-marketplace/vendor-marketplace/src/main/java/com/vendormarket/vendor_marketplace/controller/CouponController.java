package com.vendormarket.vendor_marketplace.controller;

import com.vendormarket.vendor_marketplace.dto.CouponRequest;
import com.vendormarket.vendor_marketplace.dto.CouponResponse;
import com.vendormarket.vendor_marketplace.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<CouponResponse> createCoupon(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CouponRequest request) {
        return ResponseEntity.ok(couponService.createCoupon(userDetails.getUsername(), request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<CouponResponse>> getMyCoupons(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(couponService.getMyCoupons(userDetails.getUsername()));
    }

    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<CouponResponse> toggleActive(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(couponService.toggleActive(userDetails.getUsername(), id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> deleteCoupon(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        couponService.deleteCoupon(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/validate")
    public ResponseEntity<CouponResponse> validateCoupon(@RequestParam String code) {
        return ResponseEntity.ok(couponService.validateCoupon(code));
    }
    @GetMapping("/available")
    public ResponseEntity<List<CouponResponse>> getAvailableCoupons(@RequestParam List<Long> shopIds) {
        return ResponseEntity.ok(couponService.getActiveCouponsForShops(shopIds));
    }
}