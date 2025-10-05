package com.memail.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Cache Configuration
 * Uses Redis for distributed caching across multiple instances
 * Falls back to Caffeine for local-only deployment
 */
@Configuration
@EnableCaching
public class CacheConfig {

    private static final Logger logger = LoggerFactory.getLogger(CacheConfig.class);

    /**
     * Redis-based distributed cache manager (PRIMARY - for production)
     * Enables cache sharing across multiple application instances
     * Only created if RedisConnectionFactory is available
     */
    @Bean
    @Primary
    @ConditionalOnBean(RedisConnectionFactory.class)
    public CacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        logger.info("Using Redis-based distributed cache manager");
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5))  // 5 minute TTL
            .disableCachingNullValues()
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer()
                )
            );

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(config)
            .transactionAware()
            .build();
    }

    /**
     * Caffeine-based local cache manager (FALLBACK - for development)
     * Used when Redis is not available
     */
    @Bean
    @ConditionalOnMissingBean(RedisConnectionFactory.class)
    public CacheManager caffeineCacheManager() {
        logger.warn("Redis not available - using Caffeine in-memory cache (not distributed)");
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            "emailHeaders",      // Cache for email list headers
            "emailDetails",      // Cache for full email details
            "conversations",     // Cache for conversation threads
            "folderCounts",      // Cache for folder message counts
            "userPreferences",   // Cache for user preferences
            "labels"             // Cache for labels
        );

        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)                    // Max 1000 entries per cache
            .expireAfterWrite(5, TimeUnit.MINUTES) // Expire after 5 minutes
            .recordStats());                       // Enable statistics

        return cacheManager;
    }
}
