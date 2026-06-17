package com.vendormarket.vendor_marketplace.controller;

import com.vendormarket.vendor_marketplace.service.ShopFollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
public class ShopFollowController {

    private final ShopFollowService shopFollowService;

    @PostMapping("/{shopId}/follow")
    public void follow(@PathVariable Long shopId, Authentication auth) {
        shopFollowService.follow(auth.getName(), shopId);
    }

    @DeleteMapping("/{shopId}/follow")
    public void unfollow(@PathVariable Long shopId, Authentication auth) {
        shopFollowService.unfollow(auth.getName(), shopId);
    }

    @GetMapping("/{shopId}/following")
    public Map<String, Boolean> isFollowing(@PathVariable Long shopId, Authentication auth) {
        return Map.of("following", shopFollowService.isFollowing(auth.getName(), shopId));
    }

    @GetMapping("/followed")
    public List<Long> getFollowedShopIds(Authentication auth) {
        return shopFollowService.getFollowedShopIds(auth.getName());
    }
}