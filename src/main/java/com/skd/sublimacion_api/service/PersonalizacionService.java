package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.personalizacion.PersonalizacionRequest;
import com.skd.sublimacion_api.dto.personalizacion.PersonalizacionResponse;

public interface PersonalizacionService {

    PersonalizacionResponse guardar(PersonalizacionRequest request, Long usuarioId);

    PersonalizacionResponse obtenerPorItemCarrito(Long itemCarritoId, Long usuarioId);
}
