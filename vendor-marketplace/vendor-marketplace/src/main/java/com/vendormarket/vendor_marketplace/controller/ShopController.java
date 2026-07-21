package com.vendormarket.vendor_marketplace.controller;

import com.vendormarket.vendor_marketplace.dto.RejectShopRequest;
import com.vendormarket.vendor_marketplace.dto.ShopDetailResponse;
import com.vendormarket.vendor_marketplace.dto.ShopRequest;
import com.vendormarket.vendor_marketplace.dto.ShopResponse;
import com.vendormarket.vendor_marketplace.service.ShopService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;

    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ShopResponse> createShop(@Valid @RequestBody ShopRequest request) {
        return ResponseEntity.ok(shopService.createShop(request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<ShopResponse>> getMyShops() {
        return ResponseEntity.ok(shopService.getMyShops());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ShopResponse>> getAllShops(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(shopService.getAllShops(status, search));
    }

    @GetMapping
    public ResponseEntity<List<ShopResponse>> getApprovedShops() {
        return ResponseEntity.ok(shopService.getApprovedShops());
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShopResponse> approveShop(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.approveShop(id));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShopResponse> rejectShop(@PathVariable Long id, @Valid @RequestBody RejectShopRequest request) {
        return ResponseEntity.ok(shopService.rejectShop(id, request.getReason()));
    }

    @PutMapping("/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShopResponse> suspendShop(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.suspendShop(id));
    }

    @PutMapping("/{id}/reactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShopResponse> reactivateShop(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.reactivateShop(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShopDetailResponse> getShopDetail(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.getShopDetail(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ShopResponse> updateShop(
            @PathVariable Long id,
            @Valid @RequestBody ShopRequest request) {
        return ResponseEntity.ok(shopService.updateShop(id, request));
    }
}