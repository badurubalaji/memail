package com.memail.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

@Component
public class WebSocketEventListener {

    @Autowired
    private WebSocketConfig webSocketConfig;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String user = headerAccessor.getFirstNativeHeader("user");

        if (user != null) {
            webSocketConfig.addActiveUser(user);
            System.out.println("🔌 WebSocket CONNECT event: " + user);
        }
    }

    @EventListener
    public void handleWebSocketConnectedListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String user = headerAccessor.getFirstNativeHeader("user");
        String sessionId = headerAccessor.getSessionId();

        System.out.println("✅ WebSocket CONNECTED event: user=" + user + ", session=" + sessionId);
    }

    @EventListener
    public void handleWebSocketSubscribeListener(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String user = headerAccessor.getFirstNativeHeader("user");
        String sessionId = headerAccessor.getSessionId();
        String destination = headerAccessor.getDestination();

        System.out.println("📬 User SUBSCRIBED: user=" + user + ", destination=" + destination + ", session=" + sessionId);

        // Ensure user is tracked when they subscribe
        if (user != null) {
            webSocketConfig.addActiveUser(user);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String user = headerAccessor.getFirstNativeHeader("user");
        String sessionId = headerAccessor.getSessionId();

        System.out.println("🔌 WebSocket DISCONNECT event: user=" + user + ", session=" + sessionId);

        if (user != null) {
            webSocketConfig.removeActiveUser(user);
        }
    }
}
