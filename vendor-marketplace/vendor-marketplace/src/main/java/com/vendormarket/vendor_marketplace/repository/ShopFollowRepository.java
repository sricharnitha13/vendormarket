package com.vendormarket.vendor_marketplace.repository;

import com.vendormarket.vendor_marketplace.model.Shop;
import com.vendormarket.vendor_marketplace.model.ShopFollow;
import com.vendormarket.vendor_marketplace.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShopFollowRepository extends JpaRepository<ShopFollow, Long> {

    Optional<ShopFollow> findByCustomerAndShop(User customer, Shop shop);

    List<ShopFollow> findByCustomer(User customer);

    List<ShopFollow> findByShop(Shop shop);

    boolean existsByCustomerAndShop(User customer, Shop shop);
}