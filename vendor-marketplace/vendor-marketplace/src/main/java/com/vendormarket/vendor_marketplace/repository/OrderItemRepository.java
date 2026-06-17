package com.vendormarket.vendor_marketplace.repository;

import com.vendormarket.vendor_marketplace.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}