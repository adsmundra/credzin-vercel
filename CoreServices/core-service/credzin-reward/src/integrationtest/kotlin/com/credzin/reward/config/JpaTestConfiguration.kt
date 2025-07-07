package com.credzin.reward.config

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.data.jpa.repository.config.EnableJpaRepositories

/**
 * Test application for JPA integration tests.
 * Provides minimal Spring Boot configuration for @DataJpaTest.
 */

@EntityScan(basePackages = ["com.credzin.reward"])
@EnableJpaRepositories(basePackages = ["com.credzin.reward"])
class JpaTestApplication
