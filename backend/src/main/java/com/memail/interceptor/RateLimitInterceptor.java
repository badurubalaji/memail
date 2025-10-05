package com.memail.interceptor;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Rate Limiting Interceptor using Bucket4j
 * Supports both Redis-based (distributed) and in-memory rate limiting
 * Falls back to in-memory when Redis is unavailable
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitInterceptor.class);

    private final LettuceBasedProxyManager<String> proxyManager;
    private final Supplier<BucketConfiguration> loginRateLimitConfig;
    private final Supplier<BucketConfiguration> apiRateLimitConfig;
    private final Map<String, Bucket> inMemoryBuckets = new ConcurrentHashMap<>();

    @Value("${rate.limit.enabled:true}")
    private boolean rateLimitEnabled;

    public RateLimitInterceptor(
            @Autowired(required = false) LettuceBasedProxyManager<String> proxyManager,
            Supplier<BucketConfiguration> loginRateLimitConfig,
            Supplier<BucketConfiguration> apiRateLimitConfig) {
        this.proxyManager = proxyManager;
        this.loginRateLimitConfig = loginRateLimitConfig;
        this.apiRateLimitConfig = apiRateLimitConfig;

        if (proxyManager == null) {
            logger.warn("Redis not available - using in-memory rate limiting (not distributed)");
        } else {
            logger.info("Using Redis-based distributed rate limiting");
        }
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!rateLimitEnabled) {
            return true;
        }

        String clientIp = getClientIP(request);
        String requestPath = request.getRequestURI();

        // Determine which rate limit to apply
        Supplier<BucketConfiguration> configSupplier;
        String bucketKey;

        if (isLoginEndpoint(requestPath)) {
            bucketKey = "login:" + clientIp;
            configSupplier = loginRateLimitConfig;
        } else {
            bucketKey = "api:" + clientIp;
            configSupplier = apiRateLimitConfig;
        }

        // Get or create bucket (Redis or in-memory)
        Bucket bucket = getBucket(bucketKey, configSupplier);

        // Try to consume 1 token
        if (bucket.tryConsume(1)) {
            // Request allowed
            long availableTokens = bucket.getAvailableTokens();
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(availableTokens));
            return true;
        } else {
            // Rate limit exceeded
            logger.warn("Rate limit exceeded for IP: {} on path: {}", clientIp, requestPath);
            response.setStatus(429);
            response.setContentType("application/json");
            response.setHeader("X-Rate-Limit-Retry-After", "60");
            response.getWriter().write("{\"error\":\"Too many requests. Please try again later.\"}");
            return false;
        }
    }

    /**
     * Gets or creates a bucket for the given key
     * Uses Redis if available, otherwise uses in-memory storage
     */
    private Bucket getBucket(String key, Supplier<BucketConfiguration> configSupplier) {
        if (proxyManager != null) {
            // Use Redis-based distributed bucket
            return proxyManager.builder().build(key, configSupplier);
        } else {
            // Use in-memory bucket (not distributed across instances)
            return inMemoryBuckets.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(configSupplier.get().getBandwidths()[0])
                .build());
        }
    }

    /**
     * Checks if the request is to a login endpoint
     */
    private boolean isLoginEndpoint(String path) {
        return path.contains("/auth/login") || path.contains("/auth/register");
    }

    /**
     * Extracts client IP address from request
     * Considers X-Forwarded-For header for load balancer scenarios
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }

        return request.getRemoteAddr();
    }
}
