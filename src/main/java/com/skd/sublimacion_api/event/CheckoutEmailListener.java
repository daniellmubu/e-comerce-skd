package com.skd.sublimacion_api.event;

import com.skd.sublimacion_api.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class CheckoutEmailListener {

    private final EmailService emailService;

    @TransactionalEventListener
    public void alCompletarCheckout(CheckoutCompletadoEvent evento) {
        emailService.enviarFacturaCompra(evento);
    }

}
