package com.vendormarket.vendor_marketplace.controller;

import com.vendormarket.vendor_marketplace.dto.AiSearchRequest;
import com.vendormarket.vendor_marketplace.dto.ProductResponse;
import com.vendormarket.vendor_marketplace.service.AiSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiSearchController {

    private final AiSearchService aiSearchService;

    public AiSearchController(AiSearchService aiSearchService) {
        this.aiSearchService = aiSearchService;
    }

    @PostMapping("/search")
    public ResponseEntity<List<ProductResponse>> search(@RequestBody AiSearchRequest request) {
        return ResponseEntity.ok(aiSearchService.search(request.getQuery()));
    }
}