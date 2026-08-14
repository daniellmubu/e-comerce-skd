package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.checkout.CheckoutRequest;
import com.skd.sublimacion_api.dto.checkout.CheckoutResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.CheckoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResponse procesarCheckout(
            @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal Usuario usuario) {

        return checkoutService.procesarCheckout(request, usuario.getId());
    }

}