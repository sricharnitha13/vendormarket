package com.vendormarket.vendor_marketplace.service;

import com.vendormarket.vendor_marketplace.dto.ShopDetailResponse;
import com.vendormarket.vendor_marketplace.dto.ShopRequest;
import com.vendormarket.vendor_marketplace.dto.ShopResponse;
import com.vendormarket.vendor_marketplace.model.Notification.NotificationType;
import com.vendormarket.vendor_marketplace.model.Shop;
import com.vendormarket.vendor_marketplace.model.Shop.ShopStatus;
import com.vendormarket.vendor_marketplace.model.User;
import com.vendormarket.vendor_marketplace.repository.ShopRepository;
import com.vendormarket.vendor_marketplace.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ShopResponse createShop(ShopRequest request) {
        User owner = getCurrentUser();
        Shop shop = Shop.builder()
                .name(request.getName())
                .description(request.getDescription())
                .address(request.getAddress())
                .category(request.getCategory())
                .owner(owner)
                .build();
        Shop saved = shopRepository.save(shop);

        notificationService.notifyAllAdmins(
                NotificationType.NEW_SHOP_REGISTERED,
                "New shop awaiting review",
                owner.getName() + " submitted a new shop: \"" + saved.getName() + "\"",
                "SHOP",
                saved.getId()
        );

        return toResponse(saved);
    }

    public List<ShopResponse> getMyShops() {
        User owner = getCurrentUser();
        return shopRepository.findByOwner(owner)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ShopResponse> getApprovedShops() {
        return shopRepository.findByStatus(ShopStatus.APPROVED)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ShopResponse> getAllShops(String status, String search) {
        List<Shop> shops = shopRepository.findAll();

        if (status != null && !status.isBlank()) {
            ShopStatus parsedStatus;
            try {
                parsedStatus = ShopStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid status: " + status);
            }
            shops = shops.stream()
                    .filter(s -> s.getStatus() == parsedStatus)
                    .collect(Collectors.toList());
        }

        if (search != null && !search.isBlank()) {
            String term = search.toLowerCase();
            shops = shops.stream()
                    .filter(s -> s.getName().toLowerCase().contains(term)
                            || (s.getOwner() != null && s.getOwner().getEmail().toLowerCase().contains(term)))
                    .collect(Collectors.toList());
        }

        return shops.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ShopResponse approveShop(Long id) {
        Shop shop = getShopOrThrow(id);
        if (shop.getStatus() != ShopStatus.PENDING) {
            throw new IllegalStateException("Only pending shops can be approved");
        }
        shop.setStatus(ShopStatus.APPROVED);
        shop.setRejectionReason(null);
        Shop saved = shopRepository.save(shop);

        notificationService.notify(
                saved.getOwner(),
                NotificationType.SHOP_APPROVED,
                "Shop approved",
                "Your shop \"" + saved.getName() + "\" has been approved and is now live.",
                "SHOP",
                saved.getId()
        );

        return toResponse(saved);
    }

    public ShopResponse rejectShop(Long id, String reason) {
        Shop shop = getShopOrThrow(id);
        if (shop.getStatus() != ShopStatus.PENDING) {
            throw new IllegalStateException("Only pending shops can be rejected");
        }
        shop.setStatus(ShopStatus.REJECTED);
        shop.setRejectionReason(reason);
        Shop saved = shopRepository.save(shop);

        notificationService.notify(
                saved.getOwner(),
                NotificationType.SHOP_REJECTED,
                "Shop rejected",
                "Your shop \"" + saved.getName() + "\" was rejected: " + reason,
                "SHOP",
                saved.getId()
        );

        return toResponse(saved);
    }

    public ShopResponse suspendShop(Long id) {
        Shop shop = getShopOrThrow(id);
        if (shop.getStatus() != ShopStatus.APPROVED) {
            throw new IllegalStateException("Only approved shops can be suspended");
        }
        shop.setStatus(ShopStatus.SUSPENDED);
        return toResponse(shopRepository.save(shop));
    }

    public ShopResponse reactivateShop(Long id) {
        Shop shop = getShopOrThrow(id);
        if (shop.getStatus() != ShopStatus.SUSPENDED) {
            throw new IllegalStateException("Only suspended shops can be reactivated");
        }
        shop.setStatus(ShopStatus.APPROVED);
        return toResponse(shopRepository.save(shop));
    }

    private Shop getShopOrThrow(Long id) {
        return shopRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Shop not found"));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private ShopResponse toResponse(Shop shop) {
        return ShopResponse.builder()
                .id(shop.getId())
                .name(shop.getName())
                .description(shop.getDescription())
                .address(shop.getAddress())
                .category(shop.getCategory())
                .status(shop.getStatus())
                .rejectionReason(shop.getRejectionReason())
                .ownerName(shop.getOwner().getName())
                .createdAt(shop.getCreatedAt())
                .build();
    }

    public ShopDetailResponse getShopDetail(Long id) {
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Shop not found"));

        return ShopDetailResponse.builder()
                .id(shop.getId())
                .name(shop.getName())
                .description(shop.getDescription())
                .address(shop.getAddress())
                .category(shop.getCategory())
                .ownerName(shop.getOwner() != null ? shop.getOwner().getName() : null)
                .ownerPhone(shop.getOwner() != null ? shop.getOwner().getPhone() : null)
                .createdAt(shop.getCreatedAt())
                .build();
    }
}