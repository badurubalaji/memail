package com.memail.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // Track active WebSocket sessions
    private final Set<String> activeUsers = ConcurrentHashMap.newKeySet();

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Support both raw WebSocket and SockJS
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    public Set<String> getActiveUsers() {
        return activeUsers;
    }

    public void addActiveUser(String user) {
        activeUsers.add(user);
        System.out.println("✅ Active user added: " + user + " (Total active users: " + activeUsers.size() + ")");
    }

    public void removeActiveUser(String user) {
        activeUsers.remove(user);
        System.out.println("❌ Active user removed: " + user + " (Total active users: " + activeUsers.size() + ")");
    }
}