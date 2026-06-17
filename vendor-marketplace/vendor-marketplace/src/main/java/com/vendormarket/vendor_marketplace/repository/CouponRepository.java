package com.vendormarket.vendor_marketplace.repository;

import com.vendormarket.vendor_marketplace.model.Coupon;
import com.vendormarket.vendor_marketplace.model.Shop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeIgnoreCase(String code);
    List<Coupon> findByShop(Shop shop);
    List<Coupon> findByShopIdIn(List<Long> shopIds);
}