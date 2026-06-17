package com.vendormarket.vendor_marketplace.controller;

import com.vendormarket.vendor_marketplace.dto.ProductResponse;
import com.vendormarket.vendor_marketplace.service.AiRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/recommendations")
@RequiredArgsConstructor
public class AiRecommendationController {

    private final AiRecommendationService aiRecommendationService;

    @GetMapping("/similar/{productId}")
    public ResponseEntity<List<ProductResponse>> getSimilar(@PathVariable Long productId) {
        return ResponseEntity.ok(aiRecommendationService.getSimilarProducts(productId));
    }

    @GetMapping("/for-you")
    public ResponseEntity<List<ProductResponse>> getForYou(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(aiRecommendationService.getForYou(userDetails.getUsername()));
    }
}