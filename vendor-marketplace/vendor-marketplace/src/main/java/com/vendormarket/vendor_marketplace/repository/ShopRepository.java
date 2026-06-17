package com.vendormarket.vendor_marketplace.repository;

import com.vendormarket.vendor_marketplace.model.Shop;
import com.vendormarket.vendor_marketplace.model.Shop.ShopStatus;
import com.vendormarket.vendor_marketplace.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShopRepository extends JpaRepository<Shop, Long> {
    List<Shop> findByOwner(User owner);
    List<Shop> findByStatus(ShopStatus status);
}