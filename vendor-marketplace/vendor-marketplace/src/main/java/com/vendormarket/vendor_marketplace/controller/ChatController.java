package com.vendormarket.vendor_marketplace.controller;

import com.vendormarket.vendor_marketplace.dto.ChatRequest;
import com.vendormarket.vendor_marketplace.dto.ChatResponse;
import com.vendormarket.vendor_marketplace.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ChatResponse chat(@RequestBody ChatRequest request, Authentication auth) {
        return chatService.chat(auth.getName(), request);
    }
}