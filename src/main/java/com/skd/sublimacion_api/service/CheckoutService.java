package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.checkout.CheckoutRequest;
import com.skd.sublimacion_api.dto.checkout.CheckoutResponse;

public interface CheckoutService {

    CheckoutResponse procesarCheckout(CheckoutRequest request, Long usuarioId);

}