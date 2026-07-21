package com.vendormarket.vendor_marketplace.repository;

import com.vendormarket.vendor_marketplace.model.Category;
import com.vendormarket.vendor_marketplace.model.Product;
import com.vendormarket.vendor_marketplace.model.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // Only return active (non-deleted) products
    List<Product> findByShopAndIsActiveTrue(Shop shop);
    List<Product> findByShopIdAndIsActiveTrue(Long shopId);
    long countByCategory(Category category);

    // Used for duplicate detection in bulk upload
    boolean existsByNameAndShopIdAndIsActiveTrue(String name, Long shopId);

    @Query("""
        SELECT p FROM Product p
        WHERE (:keywords IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keywords, '%'))
                                  OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keywords, '%')))
        AND (:minPrice IS NULL OR p.price >= :minPrice)
        AND (:maxPrice IS NULL OR p.price <= :maxPrice)
        AND p.isActive = true
        """)
    List<Product> searchWithFilters(
            @Param("keywords") String keywords,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice
    );
}