package com.credzin

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories

@SpringBootApplication(scanBasePackages = ["com.credzin"])
@EntityScan(basePackages = ["com.credzin.merchant", "com.credzin.reward"])
@EnableJpaRepositories(basePackages = ["com.credzin.merchant", "com.credzin.reward"])
class CredzinApplication

fun main(args: Array<String>) {
    runApplication<CredzinApplication>(*args)
}