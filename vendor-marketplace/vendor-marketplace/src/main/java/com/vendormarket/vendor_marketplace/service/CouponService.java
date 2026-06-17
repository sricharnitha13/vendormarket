package com.vendormarket.vendor_marketplace.service;

import com.vendormarket.vendor_marketplace.dto.CouponRequest;
import com.vendormarket.vendor_marketplace.dto.CouponResponse;
import com.vendormarket.vendor_marketplace.model.Coupon;
import com.vendormarket.vendor_marketplace.model.Notification.NotificationType;
import com.vendormarket.vendor_marketplace.model.Shop;
import com.vendormarket.vendor_marketplace.model.ShopFollow;
import com.vendormarket.vendor_marketplace.model.User;
import com.vendormarket.vendor_marketplace.repository.CouponRepository;
import com.vendormarket.vendor_marketplace.repository.OrderRepository;
import com.vendormarket.vendor_marketplace.repository.ShopFollowRepository;
import com.vendormarket.vendor_marketplace.repository.ShopRepository;
import com.vendormarket.vendor_marketplace.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ShopFollowRepository shopFollowRepository;
    private final NotificationService notificationService;

    @Transactional
    public CouponResponse createCoupon(String email, CouponRequest request) {
        Shop shop = getMyShop(email);

        if (couponRepository.findByCodeIgnoreCase(request.getCode()).isPresent()) {
            throw new RuntimeException("Coupon code already exists. Please choose another.");
        }

        Coupon coupon = new Coupon();
        coupon.setCode(request.getCode().trim().toUpperCase());
        coupon.setShop(shop);
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinOrderAmount(request.getMinOrderAmount());
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setExpiryDate(request.getExpiryDate());
        coupon.setActive(true);

        Coupon saved = couponRepository.save(coupon);
        notifyCustomersOfNewCoupon(shop, saved);

        return toResponse(saved);
    }

    public List<CouponResponse> getMyCoupons(String email) {
        Shop shop = getMyShop(email);
        return couponRepository.findByShop(shop).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CouponResponse toggleActive(String email, Long couponId) {
        Coupon coupon = getOwnedCoupon(email, couponId);
        coupon.setActive(!coupon.isActive());
        return toResponse(couponRepository.save(coupon));
    }

    @Transactional
    public void deleteCoupon(String email, Long couponId) {
        Coupon coupon = getOwnedCoupon(email, couponId);
        couponRepository.delete(coupon);
    }

    public CouponResponse validateCoupon(String code) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

        if (!coupon.isActive()) {
            throw new RuntimeException("This coupon is no longer active");
        }
        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("This coupon has expired");
        }

        return toResponse(coupon);
    }

    /**
     * Notifies anyone who's previously ordered from this shop, plus anyone who explicitly
     * follows it, deduped so nobody gets pinged twice for the same coupon.
     */
    private void notifyCustomersOfNewCoupon(Shop shop, Coupon coupon) {
        Set<Long> notifiedIds = new HashSet<>();
        List<User> recipients = new ArrayList<>();

        // Requires findDistinctCustomersByShopId(Long) on OrderRepository — see integration notes.
        for (User customer : orderRepository.findDistinctCustomersByShopId(shop.getId())) {
            if (notifiedIds.add(customer.getId())) {
                recipients.add(customer);
            }
        }
        for (ShopFollow follow : shopFollowRepository.findByShop(shop)) {
            User customer = follow.getCustomer();
            if (notifiedIds.add(customer.getId())) {
                recipients.add(customer);
            }
        }

        String title = "New coupon from " + shop.getName();
        String message = shop.getName() + " just added a new coupon: " + coupon.getCode() + ".";
        for (User customer : recipients) {
            notificationService.notify(customer, NotificationType.NEW_COUPON, title, message, "COUPON", coupon.getId());
        }
    }

    private Shop getMyShop(String email) {
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Shop> shops = shopRepository.findByOwner(owner);
        if (shops.isEmpty()) {
            throw new RuntimeException("You need to create a shop first");
        }
        return shops.get(0);
    }

    private Coupon getOwnedCoupon(String email, Long couponId) {
        Shop shop = getMyShop(email);
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new EntityNotFoundException("Coupon not found"));
        if (!coupon.getShop().getId().equals(shop.getId())) {
            throw new RuntimeException("You do not own this coupon");
        }
        return coupon;
    }

    private CouponResponse toResponse(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .minOrderAmount(coupon.getMinOrderAmount())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .expiryDate(coupon.getExpiryDate())
                .active(coupon.isActive())
                .shopId(coupon.getShop().getId())
                .shopName(coupon.getShop().getName())
                .createdAt(coupon.getCreatedAt())
                .build();
    }

    public List<CouponResponse> getActiveCouponsForShops(List<Long> shopIds) {
        LocalDateTime now = LocalDateTime.now();
        return couponRepository.findByShopIdIn(shopIds).stream()
                .filter(Coupon::isActive)
                .filter(c -> c.getExpiryDate() == null || c.getExpiryDate().isAfter(now))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}