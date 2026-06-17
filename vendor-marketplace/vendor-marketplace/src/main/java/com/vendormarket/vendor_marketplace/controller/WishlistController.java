package com.vendormarket.vendor_marketplace.controller;

import com.vendormarket.vendor_marketplace.dto.WishlistItemResponse;
import com.vendormarket.vendor_marketplace.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<List<WishlistItemResponse>> getWishlist(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(wishlistService.getWishlist(userDetails.getUsername()));
    }

    @PostMapping("/add/{productId}")
    public ResponseEntity<List<WishlistItemResponse>> addToWishlist(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long productId) {
        return ResponseEntity.ok(wishlistService.addToWishlist(userDetails.getUsername(), productId));
    }

    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<List<WishlistItemResponse>> removeFromWishlist(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long productId) {
        return ResponseEntity.ok(wishlistService.removeFromWishlist(userDetails.getUsername(), productId));
    }
}