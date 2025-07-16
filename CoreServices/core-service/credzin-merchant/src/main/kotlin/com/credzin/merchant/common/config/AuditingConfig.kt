package com.credzin.merchant.common.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.domain.AuditorAware
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import java.util.Optional

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
class AuditingConfig {

    @Bean
    fun auditorProvider(): AuditorAware<String> {
        // For simplicity, returning a fixed user. In a real application,
        // this would typically get the current authenticated user from Spring Security.
        return AuditorAware { Optional.of("system_user") }
    }
}
