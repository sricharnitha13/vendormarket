package com.vendormarket.vendor_marketplace.service;

import com.vendormarket.vendor_marketplace.dto.CategoryRequest;
import com.vendormarket.vendor_marketplace.dto.CategoryResponse;
import com.vendormarket.vendor_marketplace.model.Category;
import com.vendormarket.vendor_marketplace.repository.CategoryRepository;
import com.vendormarket.vendor_marketplace.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName())) {
            throw new IllegalStateException("A category with this name already exists");
        }
        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
        return toResponse(categoryRepository.save(category));
    }

    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));

        if (!category.getName().equalsIgnoreCase(request.getName())
                && categoryRepository.existsByNameIgnoreCase(request.getName())) {
            throw new IllegalStateException("A category with this name already exists");
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        return toResponse(categoryRepository.save(category));
    }

    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));

        long productCount = productRepository.countByCategory(category);
        if (productCount > 0) {
            throw new IllegalStateException(
                    "Can't delete a category that's still assigned to " + productCount + " product(s)");
        }
        categoryRepository.delete(category);
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .productCount(productRepository.countByCategory(category))
                .build();
    }
}