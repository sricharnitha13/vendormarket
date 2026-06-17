package com.vendormarket.vendor_marketplace.service;

import com.vendormarket.vendor_marketplace.model.Shop;
import com.vendormarket.vendor_marketplace.model.ShopFollow;
import com.vendormarket.vendor_marketplace.model.User;
import com.vendormarket.vendor_marketplace.repository.ShopFollowRepository;
import com.vendormarket.vendor_marketplace.repository.ShopRepository;
import com.vendormarket.vendor_marketplace.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopFollowService {

    private final ShopFollowRepository shopFollowRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    @Transactional
    public void follow(String email, Long shopId) {
        User customer = getUser(email);
        Shop shop = getShop(shopId);
        if (shopFollowRepository.existsByCustomerAndShop(customer, shop)) {
            return;
        }
        shopFollowRepository.save(ShopFollow.builder().customer(customer).shop(shop).build());
    }

    @Transactional
    public void unfollow(String email, Long shopId) {
        User customer = getUser(email);
        Shop shop = getShop(shopId);
        shopFollowRepository.findByCustomerAndShop(customer, shop)
                .ifPresent(shopFollowRepository::delete);
    }

    public boolean isFollowing(String email, Long shopId) {
        User customer = getUser(email);
        Shop shop = getShop(shopId);
        return shopFollowRepository.existsByCustomerAndShop(customer, shop);
    }

    public List<Long> getFollowedShopIds(String email) {
        User customer = getUser(email);
        return shopFollowRepository.findByCustomer(customer)
                .stream().map(f -> f.getShop().getId()).collect(Collectors.toList());
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Shop getShop(Long shopId) {
        return shopRepository.findById(shopId)
                .orElseThrow(() -> new EntityNotFoundException("Shop not found"));
    }
}