package com.vendormarket.vendor_marketplace.controller;

import com.vendormarket.vendor_marketplace.dto.ReviewRequest;
import com.vendormarket.vendor_marketplace.dto.ReviewResponse;
import com.vendormarket.vendor_marketplace.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewResponse>> getReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getReviews(productId));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<List<ReviewResponse>> addReview(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.addOrUpdateReview(userDetails.getUsername(), productId, request));
    }
    @GetMapping("/product/{productId}/mine")
    public ResponseEntity<ReviewResponse> getMyReview(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getMyReview(userDetails.getUsername(), productId));
    }
}