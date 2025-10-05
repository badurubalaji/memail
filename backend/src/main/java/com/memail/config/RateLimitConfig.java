package com.memail.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.function.Supplier;

/**
 * Rate Limiting Configuration using Bucket4j
 * Supports both Redis-based (distributed) and in-memory rate limiting
 * Falls back to in-memory when Redis is unavailable
 */
@Configuration
public class RateLimitConfig {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitConfig.class);

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${rate.limit.login.capacity:5}")
    private long loginCapacity;

    @Value("${rate.limit.login.refill-tokens:5}")
    private long loginRefillTokens;

    @Value("${rate.limit.login.refill-duration:1m}")
    private Duration loginRefillDuration;

    @Value("${rate.limit.api.capacity:100}")
    private long apiCapacity;

    @Value("${rate.limit.api.refill-tokens:100}")
    private long apiRefillTokens;

    @Value("${rate.limit.api.refill-duration:1m}")
    private Duration apiRefillDuration;

    /**
     * Creates Redis client for rate limiting (only when Redis is enabled)
     */
    @Bean
    @ConditionalOnProperty(name = "rate.limit.redis.enabled", havingValue = "true", matchIfMissing = false)
    public RedisClient redisClient() {
        logger.info("Creating Redis client for rate limiting: {}:{}", redisHost, redisPort);
        String redisUri = redisPassword.isEmpty()
            ? String.format("redis://%s:%d", redisHost, redisPort)
            : String.format("redis://%s@%s:%d", redisPassword, redisHost, redisPort);
        return RedisClient.create(redisUri);
    }

    /**
     * Creates proxy manager for distributed buckets (only when Redis is enabled)
     */
    @Bean
    @ConditionalOnProperty(name = "rate.limit.redis.enabled", havingValue = "true", matchIfMissing = false)
    public LettuceBasedProxyManager<String> proxyManager(RedisClient redisClient) {
        logger.info("Creating Redis-based proxy manager for distributed rate limiting");
        StatefulRedisConnection<String, byte[]> connection = redisClient.connect(
            RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE)
        );
        return LettuceBasedProxyManager.builderFor(connection)
            .build();
    }

    /**
     * Login rate limit configuration (5 requests per minute)
     */
    @Bean
    public Supplier<BucketConfiguration> loginRateLimitConfig() {
        return () -> BucketConfiguration.builder()
            .addLimit(Bandwidth.classic(loginCapacity, Refill.intervally(loginRefillTokens, loginRefillDuration)))
            .build();
    }

    /**
     * API rate limit configuration (100 requests per minute)
     */
    @Bean
    public Supplier<BucketConfiguration> apiRateLimitConfig() {
        return () -> BucketConfiguration.builder()
            .addLimit(Bandwidth.classic(apiCapacity, Refill.intervally(apiRefillTokens, apiRefillDuration)))
            .build();
    }
}
