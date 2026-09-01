package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.chat.ChatRequest;
import com.skd.sublimacion_api.dto.chat.ChatResponse;

public interface ChatBotService {

    ChatResponse responder(ChatRequest request);
}
