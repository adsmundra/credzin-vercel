package com.credzin.core

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class CredzinApplication

fun main(args: Array<String>) {
    runApplication<CredzinApplication>(*args)
} 